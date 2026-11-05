import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { simulationInputSchema } from '@amazon-trade/shared'
import { requireCompany } from '../../plugins/auth'
import * as service from './service'

export const simulationRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const importer = requireCompany('IMPORTER')

  app.post('/simulations', { preHandler: importer, schema: { body: simulationInputSchema, tags: ['simulations'] } }, async (req, reply) => {
    reply.code(201)
    return service.createSimulation(ctx, req.auth!, req.body)
  })
  app.get('/simulations', { preHandler: importer, schema: { tags: ['simulations'] } }, async (req) => service.listSimulations(ctx, req.auth!))
  app.get('/simulations/:id', { preHandler: importer, schema: { params: z.object({ id: z.uuid() }), tags: ['simulations'] } }, async (req) =>
    service.getSimulation(ctx, req.auth!, req.params.id),
  )
}
