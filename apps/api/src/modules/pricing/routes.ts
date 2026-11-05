import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { PRICING_SERVICES, pricingConfigSchema, tariffInputSchema } from '@amazon-trade/shared'
import { requirePlatformRole } from '../../plugins/auth'
import { createTariff, deleteTariff, listPricingConfigs, listTariffs, setPricingConfig } from './tariffs'

/** Backoffice: tabelas de preço e a chave TABELA × API do parceiro por serviço. */
export const pricingAdminRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const ops = requirePlatformRole('OPERATIONS')

  app.get('/admin/tariffs', { preHandler: ops, schema: { querystring: z.object({ service: z.enum(PRICING_SERVICES).optional() }), tags: ['admin'] } }, async (req) =>
    listTariffs(ctx, req.query.service),
  )
  app.post('/admin/tariffs', { preHandler: ops, schema: { body: tariffInputSchema, tags: ['admin'] } }, async (req, reply) => {
    reply.code(201)
    return createTariff(ctx, req.body, req.auth!.user.id)
  })
  app.delete('/admin/tariffs/:id', { preHandler: ops, schema: { params: z.object({ id: z.uuid() }), tags: ['admin'] } }, async (req) => {
    await deleteTariff(ctx, req.params.id)
    return { ok: true }
  })

  app.get('/admin/pricing-config', { preHandler: ops, schema: { tags: ['admin'] } }, async () => listPricingConfigs(ctx))
  app.put('/admin/pricing-config', { preHandler: ops, schema: { body: pricingConfigSchema, tags: ['admin'] } }, async (req) =>
    setPricingConfig(ctx, req.body, req.auth!.user.id),
  )
}
