import { and, eq, inArray, isNotNull, lt } from 'drizzle-orm'
import type { AppContext } from '../../context'
import { integrationJobs, orders, partners, shipmentTasks, shipments } from '../../db/schema'
import { notifyStaff } from '../../lib/notify'
import { expireStaleOrders } from '../orders/service'
import { addEvent, updateTask } from '../shipments/service'
import { applyPartnerEvents } from './events'
import { nextAttemptDelayMs, claimDueJobs } from './outbox'
import { buildDispatchPayload } from './payloads'
import { issueActionToken } from './portal'
import type { ResolvedIntegration } from './registry'
import { AdapterError, CapabilityUnavailableError, type NormalizedPartnerEvent } from './types'

type JobRow = typeof integrationJobs.$inferSelect

export type JobOutcome = 'succeeded' | 'retry' | 'dead' | 'missing'

/** Hosts autorizados a servir documentos para esta integração. */
export function allowedDocumentHosts(r: ResolvedIntegration): string[] {
  const hosts = new Set<string>()
  const base = r.integration.config.baseUrl
  if (typeof base === 'string') {
    try {
      hosts.add(new URL(base).host)
    } catch {
      /* baseUrl inválida: ignora */
    }
  }
  const extra = r.integration.config.documentHosts
  if (Array.isArray(extra)) for (const h of extra) if (typeof h === 'string') hosts.add(h)
  return [...hosts]
}

const wantsPortalLink = (r: ResolvedIntegration) => r.integration.config.portalLite === true || ['EMAIL', 'WHATSAPP', 'MANUAL'].includes(r.integration.mode)

async function failJob(ctx: AppContext, job: JobRow, err: unknown, resolved: ResolvedIntegration | null): Promise<JobOutcome> {
  const message = err instanceof Error ? err.message : String(err)
  const retryable = err instanceof AdapterError ? err.retryable : true
  const max = resolved?.integration.maxAttempts ?? job.maxAttempts
  const dead = !retryable || job.attempts >= max
  if (!dead) {
    await ctx.db
      .update(integrationJobs)
      .set({ status: 'FAILED', lastError: message.slice(0, 1000), nextAttemptAt: new Date(ctx.now().getTime() + nextAttemptDelayMs(job.attempts)), lockedAt: null })
      .where(eq(integrationJobs.id, job.id))
    return 'retry'
  }
  await ctx.db.update(integrationJobs).set({ status: 'DEAD', lastError: message.slice(0, 1000), finishedAt: ctx.now(), lockedAt: null }).where(eq(integrationJobs.id, job.id))
  const [partner] = await ctx.db.select().from(partners).where(eq(partners.id, job.partnerId))
  if (job.shipmentId) {
    await addEvent(ctx.db, { shipmentId: job.shipmentId, type: 'PARTNER_REQUEST_FAILED', source: 'SYSTEM', partnerId: job.partnerId, partnerType: partner?.type ?? null, taskKey: job.taskKey, message: `Falha definitiva ao acionar ${partner?.name ?? 'parceiro'} (${job.operation})`, data: { error: message } })
    if (job.taskKey) {
      await updateTask(ctx, job.shipmentId, job.taskKey, 'BLOCKED', { source: 'SYSTEM', note: `Integração falhou: ${message}`.slice(0, 500) }).catch(() => undefined)
    }
  }
  await notifyStaff(ctx, ['OPERATIONS'], {
    kind: 'integration',
    titleKey: 'notif.integration.dead',
    bodyKey: 'notif.integration.dead.body',
    vars: { operation: job.operation, partner: partner?.name ?? job.partnerId },
    link: '/admin/jobs',
  })
  return 'dead'
}

/** Executa um job já reivindicado (status RUNNING). */
export async function processJob(ctx: AppContext, jobId: string): Promise<JobOutcome> {
  const [job] = await ctx.db.select().from(integrationJobs).where(eq(integrationJobs.id, jobId)).limit(1)
  if (!job || job.status !== 'RUNNING') return 'missing'

  const resolved = await ctx.adapters.resolveForPartner(ctx, job.partnerId)
  if (!resolved) return failJob(ctx, job, new AdapterError('integration_unavailable: nenhuma integração habilitada para o parceiro'), null)

  const { adapter, adapterCtx, partner, integration } = resolved
  const started = Date.now()
  try {
    let events: NormalizedPartnerEvent[] = []
    let externalRef: string | undefined
    let accepted = true
    let summary: Record<string, unknown> = {}

    if (job.operation === 'CANCEL') {
      if (!adapter.cancel) throw new CapabilityUnavailableError('cancel')
      const ref = String(job.payload.externalRef ?? '')
      await adapter.cancel(adapterCtx, ref)
    } else if (job.operation === 'SYNC_STATUS') {
      if (!adapter.fetchStatus) throw new CapabilityUnavailableError('status')
      events = await adapter.fetchStatus(adapterCtx, String(job.payload.externalRef ?? ''))
    } else {
      if (!adapter.dispatch) throw new CapabilityUnavailableError('dispatch')
      if (!job.shipmentId) throw new AdapterError('job_without_shipment', false)
      const built = await buildDispatchPayload(ctx, { partnerId: partner.id, partnerType: partner.type, operation: job.operation, shipmentId: job.shipmentId })
      const action = wantsPortalLink(resolved) ? await issueActionToken(ctx, { partnerId: partner.id, shipmentId: job.shipmentId, taskKey: job.taskKey, jobId: job.id }) : null
      const res = await adapter.dispatch(adapterCtx, {
        operation: job.operation,
        idempotencyKey: job.idempotencyKey,
        shipmentId: job.shipmentId,
        taskKey: job.taskKey,
        payload: built.payload,
        documentLinks: built.documents.map((d) => ({ type: d.type, fileName: d.fileName, url: d.url })),
        actionUrl: action?.url,
      })
      accepted = res.accepted
      externalRef = res.externalRef
      events = res.events ?? []
      summary = { fields: built.fields.length, documents: built.documents.length, portalLink: Boolean(action) }
    }

    if (job.shipmentId && job.taskKey) {
      if (externalRef) {
        await ctx.db.update(shipmentTasks).set({ externalRef }).where(and(eq(shipmentTasks.shipmentId, job.shipmentId), eq(shipmentTasks.key, job.taskKey)))
      }
      if (!accepted) {
        events = [{ type: 'REQUEST_REJECTED', externalRef, taskKey: job.taskKey, message: 'Solicitação recusada pelo parceiro na resposta', occurredAt: ctx.now().toISOString() }, ...events]
      } else if (job.operation !== 'SYNC_STATUS' && job.operation !== 'CANCEL') {
        await addEvent(ctx.db, { shipmentId: job.shipmentId, type: 'PARTNER_REQUEST_SENT', source: 'PLATFORM', partnerId: partner.id, partnerType: partner.type, taskKey: job.taskKey, message: `Solicitação entregue a ${partner.name} (${integration.mode})`, data: { externalRef: externalRef ?? null } })
      }
    }
    const applied = events.length ? await applyPartnerEvents(ctx, partner, events, { shipmentId: job.shipmentId, taskKey: job.taskKey, externalRef, allowedDocumentHosts: allowedDocumentHosts(resolved) }) : null

    await ctx.db
      .update(integrationJobs)
      .set({ status: 'SUCCEEDED', integrationId: integration.id, finishedAt: ctx.now(), lockedAt: null, lastError: null, result: { externalRef: externalRef ?? null, accepted, ...summary, events: applied } })
      .where(eq(integrationJobs.id, job.id))
    await adapterCtx.log({ operation: job.operation, direction: 'OUTBOUND', ok: true, durationMs: Date.now() - started, correlationId: job.id, request: { idempotencyKey: job.idempotencyKey, ...summary }, response: { accepted, externalRef } })
    return 'succeeded'
  } catch (err) {
    await adapterCtx.log({ operation: job.operation, direction: 'OUTBOUND', ok: false, durationMs: Date.now() - started, correlationId: job.id, error: err instanceof Error ? err.message : String(err) }).catch(() => undefined)
    return failJob(ctx, job, err, resolved)
  }
}

/** Reivindica e processa jobs vencidos. Devolve os desfechos. */
export async function runWorkerOnce(ctx: AppContext, limit = 5): Promise<{ jobId: string; outcome: JobOutcome }[]> {
  const ids = await claimDueJobs(ctx, limit)
  const out: { jobId: string; outcome: JobOutcome }[] = []
  for (const jobId of ids) out.push({ jobId, outcome: await processJob(ctx, jobId) })
  return out
}

/** Jobs presos em RUNNING (processo caiu no meio) voltam para a fila com a tentativa contada. */
export async function recoverStaleJobs(ctx: AppContext, olderThanMs = 5 * 60_000) {
  const stale = await ctx.db
    .select()
    .from(integrationJobs)
    .where(and(eq(integrationJobs.status, 'RUNNING'), lt(integrationJobs.lockedAt, new Date(ctx.now().getTime() - olderThanMs))))
  for (const job of stale) await failJob(ctx, job, new AdapterError('worker_interrupted'), null)
  return stale.length
}

/** Fallback sem webhook: consulta o status de tarefas abertas que já têm referência no parceiro. */
export async function pollStatuses(ctx: AppContext, limit = 50) {
  const rows = await ctx.db
    .select({ t: shipmentTasks })
    .from(shipmentTasks)
    .innerJoin(shipments, eq(shipments.id, shipmentTasks.shipmentId))
    .where(and(isNotNull(shipmentTasks.externalRef), inArray(shipmentTasks.status, ['IN_PROGRESS', 'BLOCKED']), inArray(shipments.status, ['IN_PROGRESS', 'DISPUTE'])))
    .limit(limit)
  let applied = 0
  const byType = new Map<string, ResolvedIntegration | null>()
  for (const { t } of rows) {
    if (!t.partnerType || !t.externalRef) continue
    if (!byType.has(t.partnerType)) byType.set(t.partnerType, await ctx.adapters.resolveByType(ctx, t.partnerType))
    const r = byType.get(t.partnerType)
    if (!r?.adapter.fetchStatus) continue
    try {
      const events = await r.adapter.fetchStatus(r.adapterCtx, t.externalRef)
      const res = await applyPartnerEvents(ctx, r.partner, events, { shipmentId: t.shipmentId, taskKey: t.key, externalRef: t.externalRef, allowedDocumentHosts: allowedDocumentHosts(r) })
      applied += res.applied
    } catch {
      /* próximo ciclo tenta de novo; erros ficam em integration_logs */
    }
  }
  return applied
}

export async function runMaintenance(ctx: AppContext) {
  const recovered = await recoverStaleJobs(ctx)
  const polled = await pollStatuses(ctx)
  const expired = await expireStaleOrders(ctx)
  return { recovered, polled, expired }
}

/** Worker in-process: processa a outbox a cada intervalo e roda a manutenção a cada ~1 min. */
export function startWorker(ctx: AppContext, log: { error: (o: unknown, m?: string) => void }) {
  let busy = false
  let ticks = 0
  const every = Math.max(1, Math.round(60_000 / ctx.config.INTEGRATION_WORKER_INTERVAL_MS))
  const timer = setInterval(async () => {
    if (busy) return
    busy = true
    try {
      await runWorkerOnce(ctx)
      if (++ticks % every === 0) await runMaintenance(ctx)
    } catch (err) {
      log.error({ err }, 'integration worker tick failed')
    } finally {
      busy = false
    }
  }, ctx.config.INTEGRATION_WORKER_INTERVAL_MS)
  timer.unref()
  return { stop: () => clearInterval(timer) }
}
