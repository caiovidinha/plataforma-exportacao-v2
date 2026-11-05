import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest } from 'fastify'
import { z } from 'zod'
import { PRODUCT_STATUSES, productInputSchema, productListQuerySchema } from '@amazon-trade/shared'
import { badRequest } from '../../lib/errors'
import { requireApprovedCompany, requireAuth, requireCompany, requireMemberRole } from '../../plugins/auth'
import * as service from './service'

const idParams = z.object({ id: z.uuid() })
const productUpdateSchema = productInputSchema.extend({ status: z.enum(PRODUCT_STATUSES).optional() })

export const catalogRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const exporterOperator = async (req: FastifyRequest) => {
    await requireCompany('EXPORTER')(req)
    await requireMemberRole('OPERATOR')(req)
  }

  // ---- vitrine (qualquer usuário autenticado) ----
  app.get('/catalog', { preHandler: requireAuth, schema: { querystring: productListQuerySchema, tags: ['catalog'] } }, async (req) =>
    service.browseCatalog(ctx, req.query),
  )

  app.get('/products/mine', { preHandler: requireCompany('EXPORTER'), schema: { tags: ['catalog'] } }, async (req) => service.listOwnProducts(ctx, req.auth!))

  app.get('/products/:id', { preHandler: requireAuth, schema: { params: idParams, tags: ['catalog'] } }, async (req) =>
    service.getProductForViewer(ctx, req.auth!, req.params.id),
  )

  // ---- gestão (exportador) ----
  app.post('/products', { preHandler: exporterOperator, schema: { body: productInputSchema, tags: ['catalog'] } }, async (req, reply) => {
    // publicar exige empresa aprovada
    if (req.body.status === 'PUBLISHED') await requireApprovedCompany('EXPORTER')(req)
    reply.code(201)
    return service.createProduct(ctx, req.auth!, req.body)
  })

  app.put('/products/:id', { preHandler: exporterOperator, schema: { params: idParams, body: productUpdateSchema, tags: ['catalog'] } }, async (req) => {
    if (req.body.status === 'PUBLISHED') await requireApprovedCompany('EXPORTER')(req)
    const updated = await service.updateProduct(ctx, req.auth!, req.params.id, req.body)
    return req.body.status && req.body.status !== updated.status ? service.setProductStatus(ctx, req.auth!, req.params.id, req.body.status) : updated
  })

  app.patch('/products/:id/status', { preHandler: exporterOperator, schema: { params: idParams, body: z.object({ status: z.enum(PRODUCT_STATUSES) }), tags: ['catalog'] } }, async (req) =>
    service.setProductStatus(ctx, req.auth!, req.params.id, req.body.status),
  )

  app.delete('/products/:id', { preHandler: exporterOperator, schema: { params: idParams, tags: ['catalog'] } }, async (req) => {
    await service.deleteProduct(ctx, req.auth!, req.params.id)
    return { ok: true }
  })

  app.post('/products/:id/images', { preHandler: exporterOperator, schema: { params: idParams, tags: ['catalog'], consumes: ['multipart/form-data'] } }, async (req, reply) => {
    const part = await req.file()
    if (!part) throw badRequest('file_required')
    reply.code(201)
    return service.addProductImage(ctx, req.auth!, req.params.id, part)
  })

  app.delete('/products/:id/images/:fileId', { preHandler: exporterOperator, schema: { params: z.object({ id: z.uuid(), fileId: z.uuid() }), tags: ['catalog'] } }, async (req) =>
    service.removeProductImage(ctx, req.auth!, req.params.id, req.params.fileId),
  )

  // imagens de produto são públicas (vitrine)
  app.get('/media/:fileId', { schema: { params: z.object({ fileId: z.uuid() }), tags: ['catalog'] } }, async (req, reply) => {
    const { file, buffer } = await service.readPublicImage(ctx, req.params.fileId)
    reply.header('content-type', file.mimeType).header('cache-control', 'public, max-age=86400')
    return reply.send(buffer)
  })
}
