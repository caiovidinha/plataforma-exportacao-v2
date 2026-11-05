import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { JOB_STATUSES, integrationInputSchema, partnerInputSchema } from '@amazon-trade/shared'
import { requirePlatformRole } from '../../plugins/auth'
import { defaultAdapterId } from './registry'
import * as admin from './admin'
import { pollStatuses, recoverStaleJobs, runWorkerOnce } from './worker'

const idParams = z.object({ id: z.uuid() })
const limitQ = z.coerce.number().int().min(1).max(200).default(50)

/** Backoffice de parceiros/integrações (papel OPERATIONS ou PLATFORM_ADMIN). */
export const integrationAdminRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const ops = requirePlatformRole('OPERATIONS')
  const tags = ['admin-integrations']

  app.get('/admin/adapters', { preHandler: ops, schema: { tags } }, async () => ({
    adapters: ctx.adapters.list(),
    defaults: { DESPACHANTE: defaultAdapterId('DESPACHANTE', 'API'), TRANSPORTE_MARITIMO: defaultAdapterId('TRANSPORTE_MARITIMO', 'API'), email: defaultAdapterId('SEGURO', 'EMAIL'), manual: defaultAdapterId('SEGURO', 'MANUAL') },
  }))

  app.get('/admin/partners', { preHandler: ops, schema: { tags } }, async () => admin.listPartners(ctx))

  app.post('/admin/partners', { preHandler: ops, schema: { body: partnerInputSchema, tags } }, async (req, reply) => {
    reply.code(201)
    return admin.createPartner(ctx, req.auth!.user.id, req.body)
  })

  app.put('/admin/partners/:id', { preHandler: ops, schema: { params: idParams, body: partnerInputSchema.partial(), tags } }, async (req) =>
    admin.updatePartner(ctx, req.auth!.user.id, req.params.id, req.body),
  )

  app.put('/admin/partners/:id/integrations', { preHandler: ops, schema: { params: idParams, body: integrationInputSchema, tags } }, async (req) =>
    admin.upsertIntegration(ctx, req.auth!.user.id, req.params.id, req.body),
  )

  app.post('/admin/integrations/:id/test', { preHandler: ops, schema: { params: idParams, tags } }, async (req) => admin.testIntegration(ctx, req.auth!.user.id, req.params.id))

  app.post('/admin/integrations/:id/rotate-webhook-secret', { preHandler: ops, schema: { params: idParams, tags } }, async (req) =>
    admin.rotateWebhookSecret(ctx, req.auth!.user.id, req.params.id),
  )

  // ---- fila (outbox) ----
  app.get('/admin/jobs', { preHandler: ops, schema: { querystring: z.object({ status: z.enum(JOB_STATUSES).optional(), partnerId: z.uuid().optional(), shipmentId: z.uuid().optional(), limit: limitQ }), tags } }, async (req) =>
    admin.listJobs(ctx, req.query),
  )

  app.post('/admin/jobs/run', { preHandler: ops, schema: { tags } }, async () => {
    const processed = await runWorkerOnce(ctx, 20)
    return { processed, recovered: await recoverStaleJobs(ctx), polled: await pollStatuses(ctx) }
  })

  app.post('/admin/jobs/:id/retry', { preHandler: ops, schema: { params: idParams, tags } }, async (req) => {
    await admin.retryJob(ctx, req.auth!.user.id, req.params.id)
    return { ok: true }
  })

  app.post('/admin/jobs/:id/cancel', { preHandler: ops, schema: { params: idParams, tags } }, async (req) => {
    await admin.cancelJob(ctx, req.auth!.user.id, req.params.id)
    return { ok: true }
  })

  app.post('/admin/jobs/:id/portal-link', { preHandler: ops, schema: { params: idParams, tags } }, async (req) => admin.createJobPortalLink(ctx, req.auth!.user.id, req.params.id))

  // ---- observabilidade / LGPD ----
  app.get('/admin/integration-logs', { preHandler: ops, schema: { querystring: z.object({ partnerId: z.uuid().optional(), limit: limitQ }), tags } }, async (req) => admin.listLogs(ctx, req.query))

  app.get('/admin/data-shares', { preHandler: ops, schema: { querystring: z.object({ partnerId: z.uuid().optional(), companyId: z.uuid().optional(), limit: limitQ }), tags } }, async (req) =>
    admin.listDataShares(ctx, req.query),
  )

  // ---- demo/dev ----
  app.post('/admin/shipments/:id/sandbox/simulate', { preHandler: ops, schema: { params: idParams, tags } }, async (req) =>
    admin.simulateSandboxStage(ctx, req.auth!.user.id, req.params.id),
  )
}
