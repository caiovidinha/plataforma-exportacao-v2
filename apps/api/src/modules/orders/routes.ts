import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest } from 'fastify'
import { z } from 'zod'
import { createOrderSchema, orderDecisionSchema } from '@amazon-trade/shared'
import { requireApprovedCompany, requireAuth, requireCompany, requireMemberRole, requirePlatformRole } from '../../plugins/auth'
import * as service from './service'

const idParams = z.object({ id: z.uuid() })

export const orderRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const importerOperator = async (req: FastifyRequest) => {
    await requireApprovedCompany('IMPORTER')(req)
    await requireMemberRole('OPERATOR')(req)
  }
  const exporterOperator = async (req: FastifyRequest) => {
    await requireApprovedCompany('EXPORTER')(req)
    await requireMemberRole('OPERATOR')(req)
  }

  app.post('/orders', { preHandler: importerOperator, schema: { body: createOrderSchema, tags: ['orders'] } }, async (req, reply) => {
    reply.code(201)
    return service.createOrder(ctx, req.auth!, req.body, req.ip)
  })

  app.get('/orders', { preHandler: requireCompany(), schema: { tags: ['orders'] } }, async (req) => service.listOrders(ctx, req.auth!))

  app.get('/orders/:id', { preHandler: requireAuth, schema: { params: idParams, tags: ['orders'] } }, async (req) => service.getOrder(ctx, req.auth!, req.params.id))

  app.post('/orders/:id/decision', { preHandler: exporterOperator, schema: { params: idParams, body: orderDecisionSchema, tags: ['orders'] } }, async (req) =>
    service.decideOrder(ctx, req.auth!, req.params.id, req.body.decision, req.body.reason, req.ip),
  )

  app.post('/orders/:id/cancel', { preHandler: importerOperator, schema: { params: idParams, tags: ['orders'] } }, async (req) =>
    service.cancelOrder(ctx, req.auth!, req.params.id),
  )

  app.get('/admin/orders', { preHandler: requirePlatformRole('OPERATIONS'), schema: { tags: ['admin'] } }, async (req) =>
    service.listOrders(ctx, req.auth!, 'all'),
  )
}
