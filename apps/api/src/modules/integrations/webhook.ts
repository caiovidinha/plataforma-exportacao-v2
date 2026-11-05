import { z } from 'zod'
import { PARTNER_EVENT_TYPES, TASK_STATUSES } from '@amazon-trade/shared'
import { hmacSha256Hex, safeEqual } from '../../lib/crypto'
import { AdapterError, type AdapterContext, type NormalizedPartnerEvent, type WebhookParseResult } from './types'

/**
 * ESQUEMA PADRÃO DE WEBHOOK DE ENTRADA (o que oferecemos aos parceiros):
 *   POST {PUBLIC_API_URL}/webhooks/{partnerKey}
 *   x-at-timestamp: <epoch em segundos>
 *   x-at-signature: sha256=<hex(HMAC_SHA256(webhookSecret, "<timestamp>.<corpo bruto>"))>
 *   corpo: JSON no formato canônico (ver `canonicalWebhookSchema`).
 * Tolerância de relógio: 5 minutos. Reenvios com o mesmo `eventId` são ignorados (idempotência/anti-replay).
 */
export const WEBHOOK_TOLERANCE_SEC = 300
export const SIGNATURE_HEADER = 'x-at-signature'
export const TIMESTAMP_HEADER = 'x-at-timestamp'

type Headers = Record<string, string | string[] | undefined>
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export function signWebhook(secret: string, timestamp: number | string, rawBody: Buffer | string) {
  return `sha256=${hmacSha256Hex(secret, `${timestamp}.${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')}`)}`
}

export function verifyStandardSignature(secret: string | undefined, headers: Headers, rawBody: Buffer, nowMs: number): { ok: true } | { ok: false; reason: string } {
  if (!secret) return { ok: false, reason: 'webhook_secret_not_configured' }
  const ts = first(headers[TIMESTAMP_HEADER])
  const sig = first(headers[SIGNATURE_HEADER])
  if (!ts || !sig) return { ok: false, reason: 'missing_signature_headers' }
  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum) || Math.abs(nowMs / 1000 - tsNum) > WEBHOOK_TOLERANCE_SEC) return { ok: false, reason: 'timestamp_out_of_tolerance' }
  if (!safeEqual(sig, signWebhook(secret, ts, rawBody))) return { ok: false, reason: 'invalid_signature' }
  return { ok: true }
}

const eventSchema = z.object({
  type: z.enum(PARTNER_EVENT_TYPES),
  taskKey: z.string().max(60).optional(),
  shipmentRef: z.string().max(40).optional(),
  externalRef: z.string().max(120).optional(),
  /** Status do parceiro como veio; traduzido por `config.statusMap` quando `status` não é enviado. */
  partnerStatus: z.string().max(80).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  message: z.string().max(1000).default(''),
  occurredAt: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  tracking: z
    .object({
      vesselName: z.string().optional(),
      voyage: z.string().optional(),
      containerNumbers: z.array(z.string()).optional(),
      blNumber: z.string().optional(),
      etd: z.string().optional(),
      eta: z.string().optional(),
      lastPosition: z.object({ lat: z.number(), lng: z.number(), at: z.string() }).optional(),
      status: z.string().optional(),
    })
    .optional(),
  document: z
    .object({ type: z.string(), fileName: z.string().max(160), url: z.url().optional(), contentBase64: z.string().optional(), mimeType: z.string().optional() })
    .optional(),
})

export const canonicalWebhookSchema = z.object({
  eventId: z.string().min(3).max(120),
  events: z.array(eventSchema).min(1).max(50),
})

export function mapPartnerStatus(config: Record<string, unknown>, partnerStatus?: string) {
  if (!partnerStatus) return undefined
  const map = (config.statusMap ?? {}) as Record<string, string>
  const v = map[partnerStatus] ?? map[partnerStatus.toUpperCase()]
  return (TASK_STATUSES as readonly string[]).includes(v ?? '') ? (v as NormalizedPartnerEvent['canonicalStatus']) : undefined
}

/** Normaliza o corpo canônico (usado por HTTP genérico, sandbox e qualquer parceiro que adote nosso contrato). */
export function parseCanonicalWebhook(ctx: AdapterContext, rawBody: Buffer): WebhookParseResult {
  let json: unknown
  try {
    json = JSON.parse(rawBody.toString('utf8'))
  } catch {
    throw new AdapterError('invalid_json', false)
  }
  const parsed = canonicalWebhookSchema.safeParse(json)
  if (!parsed.success) throw new AdapterError(`invalid_payload: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`, false)
  return {
    eventId: parsed.data.eventId,
    events: parsed.data.events.map((e) => ({
      type: e.type,
      taskKey: e.taskKey,
      shipmentRef: e.shipmentRef,
      externalRef: e.externalRef,
      partnerStatus: e.partnerStatus,
      canonicalStatus: e.status ?? mapPartnerStatus(ctx.integration.config, e.partnerStatus),
      message: e.message,
      occurredAt: e.occurredAt ?? new Date().toISOString(),
      data: e.data,
      tracking: e.tracking,
      document: e.document,
    })),
  }
}
