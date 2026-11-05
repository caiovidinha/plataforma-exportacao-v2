import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest } from 'fastify'
import { z } from 'zod'
import { shipmentDocumentUploadFieldsSchema, shipmentExceptionSchema, shipmentTaskUpdateSchema } from '@amazon-trade/shared'
import { badRequest, notFound } from '../../lib/errors'
import { requireAuth, requirePlatformRole } from '../../plugins/auth'
import * as service from './service'
import * as docs from './documents'

const idParams = z.object({ id: z.uuid() })

export const shipmentRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx

  /** Participantes do embarque (exportador/importador do pedido) e equipe de operações. */
  const participant = async (req: FastifyRequest) => {
    await requireAuth(req)
    const id = (req.params as { id: string }).id
    if (!(await service.canAccessShipment(ctx, req.auth!, id))) throw notFound('shipment_not_found')
  }

  app.get('/shipments', { preHandler: requireAuth, schema: { tags: ['shipments'] } }, async (req) => {
    const a = req.auth!
    if (a.company?.type === 'EXPORTER') return service.listShipments(ctx, { exporterCompanyId: a.company.id })
    if (a.company?.type === 'IMPORTER') return service.listShipments(ctx, { importerCompanyId: a.company.id })
    return []
  })

  app.get('/admin/shipments', { preHandler: requirePlatformRole('OPERATIONS'), schema: { tags: ['admin'] } }, async () => service.listShipments(ctx, { all: true }))

  app.get('/shipments/:id', { preHandler: participant, schema: { params: idParams, tags: ['shipments'] } }, async (req) => service.getShipmentDto(ctx, req.params.id))

  app.get('/shipments/:id/events', { preHandler: participant, schema: { params: idParams, tags: ['shipments'] } }, async (req) => service.listShipmentEvents(ctx, req.params.id))

  app.patch(
    '/shipments/:id/tasks/:key',
    { preHandler: participant, schema: { params: z.object({ id: z.uuid(), key: z.string().min(2).max(60) }), body: shipmentTaskUpdateSchema, tags: ['shipments'] } },
    async (req) => service.updateTaskAsUser(ctx, req.auth!, req.params.id, req.params.key, req.body.status, req.body.note),
  )

  app.post(
    '/shipments/:id/exception',
    { preHandler: [requirePlatformRole('OPERATIONS'), participant], schema: { params: idParams, body: shipmentExceptionSchema, tags: ['shipments'] } },
    async (req) => service.declareException(ctx, req.params.id, req.body.stage, req.body.reason, req.auth!.user.id),
  )

  // ---- documentos do embarque ----
  app.get('/shipments/:id/documents', { preHandler: participant, schema: { params: idParams, tags: ['shipments'] } }, async (req) => docs.listShipmentDocuments(ctx, req.params.id))

  app.post('/shipments/:id/documents', { preHandler: participant, schema: { params: idParams, tags: ['shipments'], consumes: ['multipart/form-data'] } }, async (req, reply) => {
    const part = await req.file()
    if (!part) throw badRequest('file_required', 'Envie um arquivo')
    const raw: Record<string, string> = {}
    for (const [k, v] of Object.entries(part.fields)) {
      const f = v as { value?: unknown; type?: string } | undefined
      if (f && f.type === 'field' && typeof f.value === 'string') raw[k] = f.value
    }
    const fields = shipmentDocumentUploadFieldsSchema.safeParse(raw)
    if (!fields.success) throw badRequest('validation_error', 'Dados inválidos', fields.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })))
    const doc = await docs.uploadShipmentDocumentFromPart(ctx, req.params.id, part, fields.data, { source: 'USER', userId: req.auth!.user.id })
    reply.code(201)
    return { id: doc.id }
  })

  app.get(
    '/shipments/:id/documents/:docId/download',
    { preHandler: participant, schema: { params: z.object({ id: z.uuid(), docId: z.uuid() }), tags: ['shipments'] } },
    async (req, reply) => {
      const { file, buffer } = await docs.getShipmentDocumentFile(ctx, req.params.id, req.params.docId)
      reply.header('content-type', file.mimeType).header('content-disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`)
      return reply.send(buffer)
    },
  )
}
