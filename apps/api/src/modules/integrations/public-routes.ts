import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { partnerActionSubmitSchema, shipmentDocumentUploadFieldsSchema } from '@amazon-trade/shared'
import { partners, webhookDeliveries } from '../../db/schema'
import { AppError, badRequest, notFound, unauthorized, unprocessable } from '../../lib/errors'
import { uploadShipmentDocumentFromPart } from '../shipments/documents'
import { applyPartnerEvents } from './events'
import { describeActionTarget, resolveActionToken } from './portal'
import { AdapterError, type NormalizedPartnerEvent, type PartnerRef } from './types'
import { verifyStandardSignature } from './webhook'
import { allowedDocumentHosts } from './worker'

const toRef = (p: typeof partners.$inferSelect): PartnerRef => ({
  id: p.id,
  type: p.type,
  key: p.key,
  name: p.name,
  contactEmail: p.contactEmail,
  contactName: p.contactName,
  contactPhone: p.contactPhone,
})

/**
 * Webhooks de ENTRADA dos parceiros. Corpo bruto preservado para validar a assinatura HMAC.
 * Escopo próprio (encapsulado) para o parser `application/json` → Buffer não afetar o resto da API.
 */
export const webhookRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  app.addContentTypeParser('application/json', { parseAs: 'buffer', bodyLimit: 1024 * 1024 }, (_req, body, done) => done(null, body))

  app.post(
    '/webhooks/:partnerKey',
    { config: { rateLimit: { max: 300, timeWindow: '1 minute' } }, schema: { params: z.object({ partnerKey: z.string().min(3).max(60) }), tags: ['webhooks'] } },
    async (req, reply) => {
      const [partnerRow] = await ctx.db.select().from(partners).where(eq(partners.key, req.params.partnerKey)).limit(1)
      const resolved = partnerRow ? await ctx.adapters.resolveForPartner(ctx, partnerRow.id) : null
      // não revela se o parceiro existe: desconhecido, inativo ou sem integração habilitada → 404
      if (!partnerRow || !resolved || !resolved.adapter.parseWebhook) throw notFound('not_found')
      const { adapter, adapterCtx } = resolved
      const parseWebhook = resolved.adapter.parseWebhook
      const raw = req.body as Buffer
      const logIn = (ok: boolean, extra: { error?: string; response?: unknown; statusCode?: number } = {}) =>
        adapterCtx.log({ operation: 'WEBHOOK', direction: 'INBOUND', ok, statusCode: extra.statusCode, error: extra.error, response: extra.response, request: { bytes: raw.length } })

      const verdict = adapter.verifyWebhook
        ? adapter.verifyWebhook(adapterCtx, req.headers, raw)
          ? ({ ok: true } as const)
          : ({ ok: false, reason: 'invalid_signature' } as const)
        : verifyStandardSignature(resolved.integration.secrets.webhookSecret, req.headers, raw, ctx.now().getTime())
      if (!verdict.ok) {
        await logIn(false, { error: verdict.reason, statusCode: 401 })
        throw unauthorized(verdict.reason, 'Assinatura inválida')
      }

      let parsed
      try {
        parsed = await parseWebhook.call(adapter, adapterCtx, req.headers, raw)
      } catch (e) {
        const msg = e instanceof AdapterError ? e.message : 'invalid_payload'
        await logIn(false, { error: msg, statusCode: 400 })
        throw badRequest('invalid_payload', msg)
      }

      // anti-replay / idempotência: o mesmo eventId só é processado uma vez
      const inserted = await ctx.db
        .insert(webhookDeliveries)
        .values({ partnerId: partnerRow.id, eventId: parsed.eventId, bodyHash: createHash('sha256').update(raw).digest('hex'), status: 'PROCESSED' })
        .onConflictDoNothing({ target: [webhookDeliveries.partnerId, webhookDeliveries.eventId] })
        .returning({ id: webhookDeliveries.id })
      if (!inserted.length) {
        await logIn(true, { response: { duplicate: true, eventId: parsed.eventId } })
        return { ok: true, duplicate: true }
      }

      const result = await applyPartnerEvents(ctx, toRef(partnerRow), parsed.events, { allowedDocumentHosts: allowedDocumentHosts(resolved) })
      if (result.applied === 0) {
        // nada aplicado: libera o eventId para que o reenvio do parceiro seja processado depois
        await ctx.db.delete(webhookDeliveries).where(eq(webhookDeliveries.id, inserted[0]!.id))
        await logIn(false, { error: `not_applied: ${result.skipped.map((s) => s.reason).join(', ')}`, statusCode: 422 })
        reply.code(422)
        return { ok: false, applied: 0, skipped: result.skipped }
      }
      await logIn(true, { response: result })
      return { ok: true, applied: result.applied, skipped: result.skipped }
    },
  )
}

/** Portal-lite: parceiros sem API agem por link tokenizado (sem conta). */
export const partnerActionRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const params = z.object({ token: z.string().min(20).max(100) })
  const limit = { rateLimit: { max: 60, timeWindow: '1 minute' } }

  app.get('/partner-actions/:token', { config: limit, schema: { params, tags: ['partner-actions'] } }, async (req) => describeActionTarget(ctx, req.params.token))

  app.post('/partner-actions/:token', { config: limit, schema: { params, body: partnerActionSubmitSchema, tags: ['partner-actions'] } }, async (req) => {
    const { token, partner, shipmentId } = await resolveActionToken(ctx, req.params.token)
    const b = req.body
    const taskKey = b.taskKey ?? token.taskKey ?? undefined
    const now = ctx.now().toISOString()
    let ev: NormalizedPartnerEvent
    switch (b.action) {
      case 'ACCEPT':
        ev = { type: 'REQUEST_ACCEPTED', taskKey, externalRef: b.reference, message: b.note ?? 'Aceite confirmado pelo parceiro (portal-lite)', occurredAt: now }
        break
      case 'REJECT':
        ev = { type: 'REQUEST_REJECTED', taskKey, externalRef: b.reference, message: b.note ?? 'Solicitação recusada pelo parceiro (portal-lite)', occurredAt: now }
        break
      case 'UPDATE_STATUS':
        if (!b.taskStatus) throw badRequest('task_status_required')
        ev = { type: 'TASK_STATUS', taskKey, externalRef: b.reference, canonicalStatus: b.taskStatus, partnerStatus: b.taskStatus, message: b.note ?? `Status atualizado pelo parceiro (portal-lite): ${b.taskStatus}`, occurredAt: now }
        break
      case 'SEND_QUOTE':
        if (!b.quote) throw badRequest('quote_required')
        ev = { type: 'QUOTE_RECEIVED', taskKey, message: `Cotação recebida: ${b.quote.amount} ${b.quote.currency}`, occurredAt: now, data: { ...b.quote, note: b.note } }
        break
    }
    const result = await applyPartnerEvents(ctx, toRef(partner), [ev], { shipmentId, taskKey })
    if (result.applied === 0) throw unprocessable(result.skipped[0]?.reason ?? 'not_applied', 'Não foi possível aplicar a atualização')
    return { ok: true }
  })

  app.post('/partner-actions/:token/documents', { config: limit, schema: { params, tags: ['partner-actions'], consumes: ['multipart/form-data'] } }, async (req, reply) => {
    const { partner, shipmentId } = await resolveActionToken(ctx, req.params.token)
    const part = await req.file()
    if (!part) throw badRequest('file_required', 'Envie um arquivo')
    const raw: Record<string, string> = {}
    for (const [k, v] of Object.entries(part.fields)) {
      const f = v as { value?: unknown; type?: string } | undefined
      if (f && f.type === 'field' && typeof f.value === 'string') raw[k] = f.value
    }
    const fields = shipmentDocumentUploadFieldsSchema.safeParse(raw)
    if (!fields.success) throw badRequest('validation_error', 'Dados inválidos', fields.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })))
    try {
      await uploadShipmentDocumentFromPart(ctx, shipmentId, part, fields.data, { source: 'PARTNER', partnerId: partner.id, partnerType: partner.type })
    } catch (e) {
      if (e instanceof AppError) throw e
      throw badRequest('upload_failed')
    }
    reply.code(201)
    return { ok: true }
  })
}
