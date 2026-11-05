import { and, eq } from 'drizzle-orm'
import { DOCUMENT_UPLOAD_RULES, SHIPMENT_DOCUMENT_TYPES, type ShipmentDocumentType, type TaskStatus } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { shipmentTasks, shipments } from '../../db/schema'
import { AppError } from '../../lib/errors'
import { notifyStaff } from '../../lib/notify'
import { validateUploadBuffer } from '../files/service'
import { addShipmentDocument } from '../shipments/documents'
import { addEvent, mergeTracking, updateTask } from '../shipments/service'
import type { NormalizedPartnerEvent, PartnerRef } from './types'

export interface ApplyOptions {
  /** Contexto conhecido (job ou token): evita adivinhar o embarque/tarefa pelo corpo do evento. */
  shipmentId?: string | null
  taskKey?: string | null
  externalRef?: string
  /** Hosts autorizados a servir documentos por URL (baseUrl da integração + `documentHosts`). */
  allowedDocumentHosts?: string[]
}

export interface ApplyResult {
  applied: number
  skipped: { index: number; reason: string }[]
}

async function resolveShipmentId(ctx: AppContext, partner: PartnerRef, ev: NormalizedPartnerEvent, opts: ApplyOptions) {
  if (opts.shipmentId) return opts.shipmentId
  if (ev.shipmentRef) {
    const [s] = await ctx.db.select({ id: shipments.id }).from(shipments).where(eq(shipments.number, ev.shipmentRef)).limit(1)
    if (s) return s.id
  }
  const ref = ev.externalRef ?? opts.externalRef
  if (ref) {
    const [t] = await ctx.db
      .select({ shipmentId: shipmentTasks.shipmentId })
      .from(shipmentTasks)
      .where(and(eq(shipmentTasks.externalRef, ref), eq(shipmentTasks.partnerType, partner.type)))
      .limit(1)
    if (t) return t.shipmentId
  }
  return null
}

async function resolveTaskKey(ctx: AppContext, partner: PartnerRef, shipmentId: string, ev: NormalizedPartnerEvent, opts: ApplyOptions) {
  const key = ev.taskKey ?? opts.taskKey
  if (key) return key
  const ref = ev.externalRef ?? opts.externalRef
  if (!ref) return null
  const [t] = await ctx.db
    .select({ key: shipmentTasks.key })
    .from(shipmentTasks)
    .where(and(eq(shipmentTasks.shipmentId, shipmentId), eq(shipmentTasks.externalRef, ref), eq(shipmentTasks.partnerType, partner.type)))
    .limit(1)
  return t?.key ?? null
}

/** Baixa um documento servido pelo parceiro, apenas de hosts autorizados e dentro do limite de tamanho. */
export async function fetchPartnerDocument(url: string, allowedHosts: string[], timeoutMs = 20_000): Promise<Buffer> {
  const u = new URL(url)
  if (!['https:', 'http:'].includes(u.protocol)) throw new Error('document_url_protocol_not_allowed')
  if (!allowedHosts.includes(u.host)) throw new Error(`document_host_not_allowed:${u.host}`)
  const res = await fetch(u, { signal: AbortSignal.timeout(timeoutMs), redirect: 'error' })
  if (!res.ok) throw new Error(`document_download_failed:${res.status}`)
  const len = Number(res.headers.get('content-length') ?? 0)
  if (len > DOCUMENT_UPLOAD_RULES.maxBytes) throw new Error('document_too_large')
  return Buffer.from(await res.arrayBuffer())
}

const isDocType = (v: string): v is ShipmentDocumentType => (SHIPMENT_DOCUMENT_TYPES as readonly string[]).includes(v)

async function applyOne(ctx: AppContext, partner: PartnerRef, ev: NormalizedPartnerEvent, opts: ApplyOptions): Promise<void> {
  const shipmentId = await resolveShipmentId(ctx, partner, ev, opts)
  if (!shipmentId) throw new Error('shipment_not_resolved')
  const taskKey = await resolveTaskKey(ctx, partner, shipmentId, ev, opts)
  const occurredAt = ev.occurredAt ? new Date(ev.occurredAt) : undefined
  const meta = { source: 'PARTNER' as const, partnerId: partner.id, partnerType: partner.type, externalRef: ev.externalRef ?? opts.externalRef, occurredAt }
  const setTask = (status: TaskStatus, message?: string) => {
    if (!taskKey) throw new Error('task_not_resolved')
    return updateTask(ctx, shipmentId, taskKey, status, { ...meta, note: ev.message, message: message ?? `${partner.name}: ${ev.message}` })
  }

  switch (ev.type) {
    case 'REQUEST_ACCEPTED':
      await setTask('IN_PROGRESS', `${partner.name} aceitou a solicitação`)
      break
    case 'REQUEST_REJECTED':
      await setTask('BLOCKED', `${partner.name} recusou a solicitação: ${ev.message}`)
      await notifyStaff(ctx, ['OPERATIONS'], { kind: 'shipment', titleKey: 'notif.partner.update', link: `/admin/shipments/${shipmentId}` })
      break
    case 'TASK_STATUS': {
      const status = ev.canonicalStatus
      if (!status) throw new Error(`status_not_mapped:${ev.partnerStatus ?? ''}`)
      await setTask(status)
      break
    }
    case 'TRACKING_UPDATE':
      if (ev.tracking) await mergeTracking(ctx, shipmentId, ev.tracking)
      await addEvent(ctx.db, { shipmentId, type: 'TRACKING_UPDATE', source: 'PARTNER', partnerId: partner.id, partnerType: partner.type, message: ev.message, data: ev.tracking ?? {}, occurredAt })
      break
    case 'DOCUMENT_AVAILABLE': {
      const d = ev.document
      if (!d || !isDocType(d.type)) throw new Error('document_type_invalid')
      let bytes: Buffer
      if (d.contentBase64) bytes = Buffer.from(d.contentBase64, 'base64')
      else if (d.url) bytes = await fetchPartnerDocument(d.url, opts.allowedDocumentHosts ?? [])
      else throw new Error('document_without_content')
      const file = validateUploadBuffer(bytes, d.fileName)
      await addShipmentDocument(ctx, shipmentId, { type: d.type, note: ev.message, source: 'PARTNER', partnerId: partner.id, partnerType: partner.type, file })
      break
    }
    case 'QUOTE_RECEIVED':
      await addEvent(ctx.db, { shipmentId, type: 'QUOTE_RECEIVED', source: 'PARTNER', partnerId: partner.id, partnerType: partner.type, taskKey, message: ev.message, data: ev.data ?? {}, occurredAt })
      break
    case 'ISSUE_REPORTED':
      await addEvent(ctx.db, { shipmentId, type: 'ISSUE_REPORTED', source: 'PARTNER', partnerId: partner.id, partnerType: partner.type, taskKey, message: `${partner.name}: ${ev.message}`, data: ev.data ?? {}, occurredAt })
      if (taskKey) await setTask('BLOCKED', `${partner.name} reportou problema: ${ev.message}`)
      await notifyStaff(ctx, ['OPERATIONS'], { kind: 'shipment', titleKey: 'notif.partner.update', link: `/admin/shipments/${shipmentId}` })
      break
  }
}

/**
 * Aplica eventos canônicos de um parceiro no embarque. Cada evento é isolado: falhas individuais
 * (embarque desconhecido, tarefa de outro parceiro, embarque encerrado...) não derrubam o lote.
 */
export async function applyPartnerEvents(ctx: AppContext, partner: PartnerRef, events: NormalizedPartnerEvent[], opts: ApplyOptions = {}): Promise<ApplyResult> {
  const result: ApplyResult = { applied: 0, skipped: [] }
  for (const [index, ev] of events.entries()) {
    try {
      await applyOne(ctx, partner, ev, opts)
      result.applied++
    } catch (e) {
      const reason = e instanceof AppError ? e.code : e instanceof Error ? e.message : 'unknown_error'
      result.skipped.push({ index, reason })
    }
  }
  return result
}
