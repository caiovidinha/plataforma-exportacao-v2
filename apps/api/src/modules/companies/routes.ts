import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  documentReviewSchema,
  documentUploadFieldsSchema,
  reviewDecisionSchema,
} from '@amazon-trade/shared'
import { badRequest, forbidden, notFound } from '../../lib/errors'
import { requireAuth, requireCompany, requireMemberRole, requirePlatformRole } from '../../plugins/auth'
import { readFileBuffer, verifySignedFileToken } from '../files/service'
import * as service from './service'

export const companyRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx

  app.get('/company', { preHandler: requireCompany(), schema: { tags: ['company'] } }, async (req) =>
    service.toCompanyDto(await service.getCompany(ctx, req.auth!.company!.id)),
  )

  app.get('/onboarding', { preHandler: requireCompany(), schema: { tags: ['onboarding'] } }, async (req) =>
    service.getOnboardingState(ctx, req.auth!.company!.id),
  )

  app.put(
    '/onboarding/sections/:key',
    {
      preHandler: requireMemberRole('OPERATOR'),
      schema: { params: z.object({ key: z.string().min(2).max(40) }), body: z.unknown(), tags: ['onboarding'] },
    },
    async (req) => {
      if (!req.auth!.company) throw forbidden('no_company')
      return service.saveSection(ctx, req.auth!, req.params.key, req.body, req.ip)
    },
  )

  app.post('/onboarding/submit', { preHandler: requireMemberRole('ADMIN'), schema: { tags: ['onboarding'] } }, async (req) =>
    service.submitOnboarding(ctx, req.auth!, req.ip),
  )

  // ---- documentos da empresa ----
  app.get('/documents', { preHandler: requireCompany(), schema: { tags: ['documents'] } }, async (req) =>
    service.listCompanyDocuments(ctx, req.auth!.company!.id),
  )

  app.post('/documents', { preHandler: requireMemberRole('OPERATOR'), schema: { tags: ['documents'], consumes: ['multipart/form-data'] } }, async (req, reply) => {
    if (!req.auth!.company) throw forbidden('no_company')
    const part = await req.file()
    if (!part) throw badRequest('file_required', 'Envie um arquivo')
    const raw: Record<string, string> = {}
    for (const [k, v] of Object.entries(part.fields)) {
      const field = v as { value?: unknown; type?: string } | undefined
      if (field && field.type === 'field' && typeof field.value === 'string') raw[k] = field.value
    }
    const fields = documentUploadFieldsSchema.safeParse(raw)
    if (!fields.success) throw badRequest('validation_error', 'Dados inválidos', fields.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })))
    const doc = await service.uploadDocument(ctx, req.auth!, part, fields.data)
    reply.code(201)
    return doc
  })

  app.delete('/documents/:id', { preHandler: requireMemberRole('OPERATOR'), schema: { params: z.object({ id: z.uuid() }), tags: ['documents'] } }, async (req) => {
    await service.deleteDocument(ctx, req.auth!, req.params.id)
    return { ok: true }
  })

  /** Download autenticado: membros da empresa dona do documento ou equipe da plataforma. */
  app.get('/documents/:id/download', { preHandler: requireAuth, schema: { params: z.object({ id: z.uuid() }), tags: ['documents'] } }, async (req, reply) => {
    const { d, f } = await service.getDocumentWithFile(ctx, req.params.id)
    const staff = ['COMPLIANCE', 'OPERATIONS', 'PLATFORM_ADMIN'].includes(req.auth!.user.platformRole)
    if (!staff && req.auth!.company?.id !== d.companyId) throw notFound('document_not_found')
    const buffer = await ctx.storage.get(f.storageKey)
    reply.header('content-type', f.mimeType).header('content-disposition', `inline; filename="${encodeURIComponent(f.originalName)}"`).header('cache-control', 'private, no-store')
    return reply.send(buffer)
  })

  /** Download por link assinado (parceiros / e-mails). */
  app.get('/files/signed/:token', { schema: { params: z.object({ token: z.string().min(20) }), tags: ['documents'] } }, async (req, reply) => {
    const fileId = await verifySignedFileToken(ctx, req.params.token)
    const { row, buffer } = await readFileBuffer(ctx, fileId)
    reply.header('content-type', row.mimeType).header('content-disposition', `attachment; filename="${encodeURIComponent(row.originalName)}"`).header('cache-control', 'private, no-store')
    return reply.send(buffer)
  })

  // ---- compliance (backoffice) ----
  const compliance = requirePlatformRole('COMPLIANCE')

  app.get('/admin/compliance/queue', { preHandler: compliance, schema: { querystring: z.object({ status: z.string().optional() }), tags: ['admin'] } }, async (req) =>
    service.listReviewQueue(ctx, req.query.status),
  )

  app.get('/admin/compliance/:companyId', { preHandler: compliance, schema: { params: z.object({ companyId: z.uuid() }), tags: ['admin'] } }, async (req) =>
    service.getOnboardingState(ctx, req.params.companyId),
  )

  app.post('/admin/compliance/:companyId/review', { preHandler: compliance, schema: { params: z.object({ companyId: z.uuid() }), body: reviewDecisionSchema, tags: ['admin'] } }, async (req) =>
    service.reviewCompany(ctx, req.auth!, req.params.companyId, req.body.decision, req.body.reason),
  )

  app.post('/admin/documents/:id/review', { preHandler: compliance, schema: { params: z.object({ id: z.uuid() }), body: documentReviewSchema, tags: ['admin'] } }, async (req) =>
    service.reviewDocument(ctx, req.auth!, req.params.id, req.body.decision, req.body.reason),
  )
}
