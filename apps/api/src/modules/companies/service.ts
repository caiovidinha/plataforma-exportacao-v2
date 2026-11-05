import { and, desc, eq, isNull } from 'drizzle-orm'
import {
  buildSectionDraftSchema,
  computeReadiness,
  getDocumentType,
  getSection,
  readinessByPartner,
  type CompanyDto,
  type DocumentDto,
  type OnboardingStateDto,
  type SectionData,
} from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { companies, companySections, documents, files } from '../../db/schema'
import { audit } from '../../lib/audit'
import { badRequest, conflict, forbidden, isUniqueViolation, notFound, unprocessable } from '../../lib/errors'
import { notifyCompany, notifyStaff } from '../../lib/notify'
import type { AuthContext } from '../../plugins/auth'
import { readValidatedUpload, storeFile } from '../files/service'
import type { MultipartFile } from '@fastify/multipart'

type CompanyRow = typeof companies.$inferSelect

export const toCompanyDto = (c: CompanyRow): CompanyDto => ({
  id: c.id,
  type: c.type,
  legalName: c.legalName,
  tradeName: c.tradeName,
  taxId: c.taxId,
  country: c.country,
  onboardingStatus: c.onboardingStatus,
  submittedAt: c.submittedAt?.toISOString() ?? null,
  reviewedAt: c.reviewedAt?.toISOString() ?? null,
  reviewNote: c.reviewNote,
  createdAt: c.createdAt.toISOString(),
})

const today = () => new Date().toISOString().slice(0, 10)

export function toDocumentDto(d: typeof documents.$inferSelect, f: typeof files.$inferSelect): DocumentDto {
  const expired = d.status === 'APPROVED' && d.expiresAt && d.expiresAt < today()
  return {
    id: d.id,
    typeKey: d.typeKey,
    fileName: f.originalName,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    status: expired ? 'EXPIRED' : d.status,
    expiresAt: d.expiresAt,
    note: d.note,
    reviewReason: d.reviewReason,
    version: d.version,
    uploadedAt: d.createdAt.toISOString(),
  }
}

export async function getCompany(ctx: AppContext, companyId: string) {
  const [c] = await ctx.db.select().from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!c) throw notFound('company_not_found')
  return c
}

/** Documentos vigentes da empresa (versões mais novas; não substituídos). */
export async function listCompanyDocuments(ctx: AppContext, companyId: string): Promise<DocumentDto[]> {
  const rows = await ctx.db
    .select({ d: documents, f: files })
    .from(documents)
    .innerJoin(files, eq(files.id, documents.fileId))
    .where(and(eq(documents.companyId, companyId), isNull(documents.supersededAt)))
    .orderBy(desc(documents.createdAt))
  return rows.map((r) => toDocumentDto(r.d, r.f))
}

export async function loadSections(ctx: AppContext, companyId: string): Promise<Record<string, SectionData>> {
  const rows = await ctx.db.select().from(companySections).where(eq(companySections.companyId, companyId))
  return Object.fromEntries(rows.map((r) => [r.sectionKey, r.data]))
}

export async function getOnboardingState(ctx: AppContext, companyId: string): Promise<OnboardingStateDto> {
  const company = await getCompany(ctx, companyId)
  const [sections, docs] = await Promise.all([loadSections(ctx, companyId), listCompanyDocuments(ctx, companyId)])
  const input = { companyType: company.type, sections, documents: docs.map((d) => ({ typeKey: d.typeKey, status: d.status })) }
  return {
    company: toCompanyDto(company),
    sections,
    documents: docs,
    submission: computeReadiness(input),
    partners: readinessByPartner(input),
  }
}

const EDITABLE = new Set(['DRAFT', 'CHANGES_REQUESTED', 'APPROVED'])

function assertEditable(company: CompanyRow) {
  if (!EDITABLE.has(company.onboardingStatus)) throw conflict('onboarding_locked', 'Cadastro em análise ou encerrado; não pode ser editado')
}

/** Salva uma seção do cadastro (rascunho validado por tipo/formato; obrigatórios só na submissão). */
export async function saveSection(ctx: AppContext, auth: AuthContext, key: string, body: unknown, ip?: string) {
  const company = await getCompany(ctx, auth.company!.id)
  assertEditable(company)
  const section = getSection(company.type, key)
  if (!section) throw notFound('section_not_found')
  const parsed = buildSectionDraftSchema(section).safeParse(body)
  if (!parsed.success) {
    throw badRequest('validation_error', 'Dados inválidos', parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })))
  }
  const data = parsed.data as SectionData

  await ctx.db.transaction(async (tx) => {
    await tx
      .insert(companySections)
      .values({ companyId: company.id, sectionKey: key, data, updatedBy: auth.user.id })
      .onConflictDoUpdate({ target: [companySections.companyId, companySections.sectionKey], set: { data, updatedBy: auth.user.id, updatedAt: ctx.now() } })

    // desnormaliza identificadores usados em busca/unicidade
    if (key === 'company') {
      const d = data as Record<string, unknown>
      const patch: Partial<typeof companies.$inferInsert> = { updatedAt: ctx.now() }
      if (typeof d.legalName === 'string') patch.legalName = d.legalName
      if (typeof d.tradeName === 'string') patch.tradeName = d.tradeName
      if (company.type === 'EXPORTER' && typeof d.cnpj === 'string') patch.taxId = d.cnpj
      if (company.type === 'IMPORTER') {
        if (typeof d.taxId === 'string') patch.taxId = d.taxId.trim()
        if (typeof d.country === 'string') patch.country = d.country
      }
      try {
        await tx.update(companies).set(patch).where(eq(companies.id, company.id))
      } catch (e) {
        if (isUniqueViolation(e)) {
          throw conflict('tax_id_in_use', 'Já existe uma empresa cadastrada com este documento')
        }
        throw e
      }
    }
    await audit(tx, { actorUserId: auth.user.id, companyId: company.id, action: 'onboarding.section_saved', entityType: 'section', entityId: key, ip })
  })

  if (company.onboardingStatus === 'APPROVED') {
    await notifyStaff(ctx, ['COMPLIANCE'], { kind: 'onboarding', titleKey: 'notif.onboarding.updated', bodyKey: 'notif.onboarding.updated.body', vars: { company: company.legalName }, link: `/admin/compliance/${company.id}` })
  }
  return getOnboardingState(ctx, company.id)
}

export async function submitOnboarding(ctx: AppContext, auth: AuthContext, ip?: string) {
  if (!auth.user.emailVerifiedAt) throw forbidden('email_not_verified', 'Confirme seu e-mail antes de enviar o cadastro')
  const company = await getCompany(ctx, auth.company!.id)
  if (company.onboardingStatus !== 'DRAFT' && company.onboardingStatus !== 'CHANGES_REQUESTED') {
    throw conflict('invalid_status', 'O cadastro já foi enviado')
  }
  const state = await getOnboardingState(ctx, company.id)
  if (!state.submission.ready) throw unprocessable('incomplete_onboarding', 'Cadastro incompleto', state.submission.missing)

  await ctx.db.update(companies).set({ onboardingStatus: 'SUBMITTED', submittedAt: ctx.now(), reviewNote: null, updatedAt: ctx.now() }).where(eq(companies.id, company.id))
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: company.id, action: 'onboarding.submitted', ip })
  await notifyStaff(ctx, ['COMPLIANCE'], { kind: 'onboarding', titleKey: 'notif.onboarding.submitted', bodyKey: 'notif.onboarding.submitted.body', vars: { company: company.legalName }, link: `/admin/compliance/${company.id}`, email: true })
  return getOnboardingState(ctx, company.id)
}

// ------------------------------------------------------------------ documentos
export async function uploadDocument(
  ctx: AppContext,
  auth: AuthContext,
  part: MultipartFile,
  fields: { typeKey: string; expiresAt?: string; note?: string },
) {
  const company = await getCompany(ctx, auth.company!.id)
  assertEditable(company)
  const def = getDocumentType(company.type, fields.typeKey)
  if (!def) throw badRequest('unknown_document_type')
  if (def.requiresExpiry && !fields.expiresAt) throw badRequest('expiry_required', 'Informe a data de validade do documento')
  if (fields.expiresAt && fields.expiresAt < today()) throw badRequest('document_already_expired', 'O documento já está vencido')

  const upload = await readValidatedUpload(part)
  const result = await ctx.db.transaction(async (tx) => {
    const file = await storeFile(ctx, tx, { ownerCompanyId: company.id, kind: 'COMPANY_DOC', createdBy: auth.user.id, ...upload })
    let version = 1
    if (!def.multiple) {
      const prev = await tx.select().from(documents).where(and(eq(documents.companyId, company.id), eq(documents.typeKey, def.key), isNull(documents.supersededAt)))
      version = prev.reduce((m, p) => Math.max(m, p.version), 0) + 1
      if (prev.length) await tx.update(documents).set({ supersededAt: ctx.now() }).where(and(eq(documents.companyId, company.id), eq(documents.typeKey, def.key), isNull(documents.supersededAt)))
    }
    const [doc] = await tx
      .insert(documents)
      .values({ companyId: company.id, typeKey: def.key, fileId: file.id, expiresAt: fields.expiresAt ?? null, note: fields.note ?? null, version, uploadedBy: auth.user.id })
      .returning()
    await audit(tx, { actorUserId: auth.user.id, companyId: company.id, action: 'document.uploaded', entityType: 'document', entityId: doc!.id, meta: { typeKey: def.key } })
    return toDocumentDto(doc!, file)
  })
  if (company.onboardingStatus === 'APPROVED') {
    await notifyStaff(ctx, ['COMPLIANCE'], { kind: 'document', titleKey: 'notif.onboarding.updated', bodyKey: 'notif.onboarding.updated.body', vars: { company: company.legalName }, link: `/admin/compliance/${company.id}` })
  }
  return result
}

export async function deleteDocument(ctx: AppContext, auth: AuthContext, docId: string) {
  const [row] = await ctx.db.select().from(documents).where(and(eq(documents.id, docId), eq(documents.companyId, auth.company!.id))).limit(1)
  if (!row) throw notFound('document_not_found')
  if (row.status === 'APPROVED') throw conflict('document_approved', 'Documento aprovado não pode ser removido; envie uma nova versão')
  await ctx.db.delete(documents).where(eq(documents.id, docId))
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'document.deleted', entityType: 'document', entityId: docId })
}

export async function getDocumentWithFile(ctx: AppContext, docId: string) {
  const [row] = await ctx.db.select({ d: documents, f: files }).from(documents).innerJoin(files, eq(files.id, documents.fileId)).where(eq(documents.id, docId)).limit(1)
  if (!row) throw notFound('document_not_found')
  return row
}

// ------------------------------------------------------------------ compliance
export async function reviewDocument(
  ctx: AppContext,
  reviewer: AuthContext,
  docId: string,
  decision: 'APPROVE' | 'REJECT',
  reason?: string,
) {
  const { d, f } = await getDocumentWithFile(ctx, docId)
  if (decision === 'REJECT' && !reason) throw badRequest('reason_required', 'Informe o motivo da reprovação')
  const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  await ctx.db.update(documents).set({ status, reviewReason: reason ?? null, reviewedBy: reviewer.user.id, reviewedAt: ctx.now() }).where(eq(documents.id, docId))
  await audit(ctx.db, { actorUserId: reviewer.user.id, companyId: d.companyId, action: `document.${decision.toLowerCase()}`, entityType: 'document', entityId: docId, meta: { reason } })
  if (status === 'REJECTED') {
    const company = await getCompany(ctx, d.companyId)
    const def = getDocumentType(company.type, d.typeKey)
    await notifyCompany(ctx, d.companyId, { kind: 'document', titleKey: 'notif.document.rejected', bodyKey: 'notif.document.rejected.body', vars: { doc: def?.label.pt ?? d.typeKey, reason: reason ?? '' }, link: '/onboarding', email: true })
  }
  return toDocumentDto({ ...d, status }, f)
}

export async function reviewCompany(
  ctx: AppContext,
  reviewer: AuthContext,
  companyId: string,
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
  reason?: string,
) {
  const company = await getCompany(ctx, companyId)
  if (!['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED'].includes(company.onboardingStatus)) throw conflict('invalid_status')
  if (decision !== 'APPROVE' && !reason) throw badRequest('reason_required', 'Informe o motivo')

  if (decision === 'APPROVE') {
    const state = await getOnboardingState(ctx, companyId)
    const pending = state.submission.missing.filter((m) => m.kind === 'document')
    const unapproved = state.documents.filter((d) => {
      const def = getDocumentType(company.type, d.typeKey)
      return def?.required && d.status !== 'APPROVED'
    })
    if (pending.length || unapproved.length) {
      throw unprocessable('documents_pending_review', 'Há documentos obrigatórios não aprovados', unapproved.map((d) => d.typeKey))
    }
  }
  const status = decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED'
  await ctx.db
    .update(companies)
    .set({ onboardingStatus: status, reviewedAt: ctx.now(), reviewedBy: reviewer.user.id, reviewNote: reason ?? null, updatedAt: ctx.now() })
    .where(eq(companies.id, companyId))
  await audit(ctx.db, { actorUserId: reviewer.user.id, companyId, action: `onboarding.${decision.toLowerCase()}`, meta: { reason } })
  const titleKey = decision === 'APPROVE' ? 'notif.onboarding.approved' : decision === 'REJECT' ? 'notif.onboarding.rejected' : 'notif.onboarding.changes'
  await notifyCompany(ctx, companyId, {
    kind: 'onboarding',
    titleKey,
    bodyKey: decision === 'APPROVE' ? 'notif.onboarding.approved.body' : undefined,
    vars: { reason: reason ?? '' },
    link: '/onboarding',
    email: true,
  })
  return getOnboardingState(ctx, companyId)
}

export async function listReviewQueue(ctx: AppContext, status?: string) {
  const rows = await ctx.db.select().from(companies).orderBy(desc(companies.submittedAt))
  return rows.filter((c) => (status ? c.onboardingStatus === status : c.onboardingStatus !== 'DRAFT')).map(toCompanyDto)
}
