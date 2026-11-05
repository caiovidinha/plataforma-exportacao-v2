import { and, desc, eq } from 'drizzle-orm'
import type {
  IntegrationDto,
  IntegrationInput,
  IntegrationJobDto,
  IntegrationLogDto,
  JobStatus,
  PartnerDto,
  PartnerInput,
} from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { dataShares, integrationJobs, integrationLogs, partnerIntegrations, partners, shipmentTasks } from '../../db/schema'
import { audit } from '../../lib/audit'
import { decryptJson, encryptJson, randomToken } from '../../lib/crypto'
import { badRequest, conflict, isUniqueViolation, notFound, unprocessable } from '../../lib/errors'
import { getShipmentDto, getShipmentRow } from '../shipments/service'
import { applyPartnerEvents } from './events'
import { issueActionToken } from './portal'
import { sandboxEventsForTask } from './adapters/sandbox'
import { allowedDocumentHosts } from './worker'
import { getStageDef } from '@amazon-trade/shared'

type PartnerRow = typeof partners.$inferSelect
type IntegrationRow = typeof partnerIntegrations.$inferSelect

const secretsOf = (ctx: AppContext, row: IntegrationRow): Record<string, string> =>
  row.secretsEnc ? decryptJson(ctx.config.SECRETS_MASTER_KEY, row.secretsEnc) : {}

export const toIntegrationDto = (ctx: AppContext, r: IntegrationRow): IntegrationDto => ({
  id: r.id,
  partnerId: r.partnerId,
  mode: r.mode,
  environment: r.environment,
  enabled: r.enabled,
  config: r.config,
  secretKeys: Object.keys(secretsOf(ctx, r)),
  timeoutMs: r.timeoutMs,
  maxAttempts: r.maxAttempts,
  contractVersion: r.contractVersion,
  lastHealthAt: r.lastHealthAt?.toISOString() ?? null,
  lastHealthOk: r.lastHealthOk,
})

const toPartnerDto = (ctx: AppContext, p: PartnerRow, integrations: IntegrationRow[]): PartnerDto => ({
  id: p.id,
  type: p.type,
  key: p.key,
  name: p.name,
  contactName: p.contactName,
  contactEmail: p.contactEmail,
  contactPhone: p.contactPhone,
  active: p.active,
  notes: p.notes,
  integrations: integrations.filter((i) => i.partnerId === p.id).map((i) => toIntegrationDto(ctx, i)),
})

export async function listPartners(ctx: AppContext): Promise<PartnerDto[]> {
  const [ps, is] = await Promise.all([ctx.db.select().from(partners).orderBy(partners.type, partners.name), ctx.db.select().from(partnerIntegrations)])
  return ps.map((p) => toPartnerDto(ctx, p, is))
}

async function getPartner(ctx: AppContext, id: string) {
  const [p] = await ctx.db.select().from(partners).where(eq(partners.id, id)).limit(1)
  if (!p) throw notFound('partner_not_found')
  return p
}

export async function getPartnerDto(ctx: AppContext, id: string) {
  const p = await getPartner(ctx, id)
  return toPartnerDto(ctx, p, await ctx.db.select().from(partnerIntegrations).where(eq(partnerIntegrations.partnerId, id)))
}

export async function createPartner(ctx: AppContext, actorId: string, input: PartnerInput) {
  try {
    const [p] = await ctx.db.insert(partners).values(input).returning()
    await audit(ctx.db, { actorUserId: actorId, action: 'partner.created', entityType: 'partner', entityId: p!.id, meta: { type: input.type, key: input.key } })
    return toPartnerDto(ctx, p!, [])
  } catch (e) {
    if (isUniqueViolation(e)) throw conflict('partner_key_taken', 'Já existe parceiro com esta chave')
    throw e
  }
}

export async function updatePartner(ctx: AppContext, actorId: string, id: string, input: Partial<PartnerInput>) {
  await getPartner(ctx, id)
  const { key: _key, type: _type, ...rest } = input // chave e tipo são imutáveis (referenciados por webhooks/URLs)
  const [p] = await ctx.db.update(partners).set(rest).where(eq(partners.id, id)).returning()
  await audit(ctx.db, { actorUserId: actorId, action: 'partner.updated', entityType: 'partner', entityId: id, meta: { fields: Object.keys(rest) } })
  return getPartnerDto(ctx, p!.id)
}

export async function upsertIntegration(ctx: AppContext, actorId: string, partnerId: string, input: IntegrationInput) {
  await getPartner(ctx, partnerId)
  const adapterId = input.config.adapter
  if (adapterId !== undefined) {
    if (typeof adapterId !== 'string' || !ctx.adapters.get(adapterId)) throw badRequest('unknown_adapter', `Adapter desconhecido: ${String(adapterId)}`)
    if (adapterId === 'sandbox' && input.environment === 'PRODUCTION') throw badRequest('sandbox_not_allowed_in_production', 'O adapter sandbox não pode ser usado no ambiente de produção')
  }
  const [existing] = await ctx.db
    .select()
    .from(partnerIntegrations)
    .where(and(eq(partnerIntegrations.partnerId, partnerId), eq(partnerIntegrations.environment, input.environment)))
    .limit(1)

  // segredos: valor não vazio grava/atualiza; string vazia remove; ausente preserva
  let secrets = existing ? secretsOf(ctx, existing) : {}
  for (const [k, v] of Object.entries(input.secrets ?? {})) {
    if (v === '') delete secrets[k]
    else secrets = { ...secrets, [k]: v }
  }
  const values = {
    mode: input.mode,
    enabled: input.enabled,
    config: input.config,
    secretsEnc: Object.keys(secrets).length ? encryptJson(ctx.config.SECRETS_MASTER_KEY, secrets) : null,
    timeoutMs: input.timeoutMs,
    maxAttempts: input.maxAttempts,
    contractVersion: input.contractVersion ?? null,
  }
  const [row] = existing
    ? await ctx.db.update(partnerIntegrations).set(values).where(eq(partnerIntegrations.id, existing.id)).returning()
    : await ctx.db.insert(partnerIntegrations).values({ partnerId, environment: input.environment, ...values }).returning()
  await audit(ctx.db, { actorUserId: actorId, action: 'integration.upserted', entityType: 'partner_integration', entityId: row!.id, meta: { environment: input.environment, mode: input.mode, enabled: input.enabled, secretKeys: Object.keys(secrets) } })
  return toIntegrationDto(ctx, row!)
}

/** Gera um novo segredo de webhook (devolvido uma única vez, para ser entregue ao parceiro). */
export async function rotateWebhookSecret(ctx: AppContext, actorId: string, integrationId: string) {
  const [row] = await ctx.db.select().from(partnerIntegrations).where(eq(partnerIntegrations.id, integrationId)).limit(1)
  if (!row) throw notFound('integration_not_found')
  const secret = randomToken(32)
  const secrets = { ...secretsOf(ctx, row), webhookSecret: secret }
  await ctx.db.update(partnerIntegrations).set({ secretsEnc: encryptJson(ctx.config.SECRETS_MASTER_KEY, secrets) }).where(eq(partnerIntegrations.id, integrationId))
  await audit(ctx.db, { actorUserId: actorId, action: 'integration.webhook_secret_rotated', entityType: 'partner_integration', entityId: integrationId })
  return { webhookSecret: secret }
}

export async function testIntegration(ctx: AppContext, actorId: string, integrationId: string) {
  const [row] = await ctx.db.select().from(partnerIntegrations).where(eq(partnerIntegrations.id, integrationId)).limit(1)
  if (!row) throw notFound('integration_not_found')
  const resolved = await ctx.adapters.resolveById(ctx, row.partnerId, integrationId)
  if (!resolved) throw unprocessable('adapter_unavailable', 'Adapter indisponível para esta integração')
  if (!resolved.adapter.healthCheck) return { ok: false, supported: false, detail: 'adapter_without_health_check' }
  const res = await resolved.adapter.healthCheck(resolved.adapterCtx)
  await ctx.db.update(partnerIntegrations).set({ lastHealthAt: ctx.now(), lastHealthOk: res.ok }).where(eq(partnerIntegrations.id, integrationId))
  await audit(ctx.db, { actorUserId: actorId, action: 'integration.tested', entityType: 'partner_integration', entityId: integrationId, meta: { ok: res.ok } })
  return { ...res, supported: true }
}

// ------------------------------------------------------------------ jobs
export async function listJobs(ctx: AppContext, q: { status?: JobStatus; partnerId?: string; shipmentId?: string; limit: number }): Promise<IntegrationJobDto[]> {
  const conds = [q.status ? eq(integrationJobs.status, q.status) : undefined, q.partnerId ? eq(integrationJobs.partnerId, q.partnerId) : undefined, q.shipmentId ? eq(integrationJobs.shipmentId, q.shipmentId) : undefined].filter(Boolean) as ReturnType<typeof eq>[]
  const rows = await ctx.db
    .select({ j: integrationJobs, p: partners })
    .from(integrationJobs)
    .innerJoin(partners, eq(partners.id, integrationJobs.partnerId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(integrationJobs.createdAt))
    .limit(q.limit)
  return rows.map(({ j, p }) => ({
    id: j.id,
    partnerId: p.id,
    partnerName: p.name,
    partnerType: p.type,
    shipmentId: j.shipmentId,
    operation: j.operation,
    status: j.status,
    attempts: j.attempts,
    maxAttempts: j.maxAttempts,
    nextAttemptAt: j.nextAttemptAt?.toISOString() ?? null,
    lastError: j.lastError,
    createdAt: j.createdAt.toISOString(),
    finishedAt: j.finishedAt?.toISOString() ?? null,
  }))
}

export async function retryJob(ctx: AppContext, actorId: string, id: string) {
  const [job] = await ctx.db.select().from(integrationJobs).where(eq(integrationJobs.id, id)).limit(1)
  if (!job) throw notFound('job_not_found')
  if (!['FAILED', 'DEAD', 'CANCELLED'].includes(job.status)) throw conflict('job_not_retryable', 'Só jobs com falha ou cancelados podem ser reprocessados')
  await ctx.db
    .update(integrationJobs)
    .set({ status: 'QUEUED', attempts: job.status === 'FAILED' ? job.attempts : 0, nextAttemptAt: ctx.now(), finishedAt: null, lockedAt: null })
    .where(eq(integrationJobs.id, id))
  await audit(ctx.db, { actorUserId: actorId, action: 'integration.job_retried', entityType: 'integration_job', entityId: id })
}

export async function cancelJob(ctx: AppContext, actorId: string, id: string) {
  const [job] = await ctx.db.select().from(integrationJobs).where(eq(integrationJobs.id, id)).limit(1)
  if (!job) throw notFound('job_not_found')
  if (!['QUEUED', 'FAILED', 'DEAD'].includes(job.status)) throw conflict('job_not_cancellable')
  await ctx.db.update(integrationJobs).set({ status: 'CANCELLED', finishedAt: ctx.now() }).where(eq(integrationJobs.id, id))
  await audit(ctx.db, { actorUserId: actorId, action: 'integration.job_cancelled', entityType: 'integration_job', entityId: id })
}

/** Novo link do portal-lite para um job (o operador envia ao parceiro por outro canal). */
export async function createJobPortalLink(ctx: AppContext, actorId: string, id: string) {
  const [job] = await ctx.db.select().from(integrationJobs).where(eq(integrationJobs.id, id)).limit(1)
  if (!job?.shipmentId) throw notFound('job_not_found')
  const link = await issueActionToken(ctx, { partnerId: job.partnerId, shipmentId: job.shipmentId, taskKey: job.taskKey, jobId: job.id })
  await audit(ctx.db, { actorUserId: actorId, action: 'integration.portal_link_created', entityType: 'integration_job', entityId: id })
  return { url: link.url, expiresAt: link.expiresAt.toISOString() }
}

export async function listLogs(ctx: AppContext, q: { partnerId?: string; limit: number }): Promise<IntegrationLogDto[]> {
  const rows = await ctx.db.select().from(integrationLogs).where(q.partnerId ? eq(integrationLogs.partnerId, q.partnerId) : undefined).orderBy(desc(integrationLogs.createdAt)).limit(q.limit)
  return rows.map((l) => ({
    id: l.id,
    partnerId: l.partnerId ?? '',
    direction: l.direction,
    operation: l.operation,
    ok: l.ok,
    statusCode: l.statusCode,
    durationMs: l.durationMs,
    correlationId: l.correlationId,
    request: l.request,
    response: l.response,
    error: l.error,
    createdAt: l.createdAt.toISOString(),
  }))
}

export async function listDataShares(ctx: AppContext, q: { partnerId?: string; companyId?: string; limit: number }) {
  const conds = [q.partnerId ? eq(dataShares.partnerId, q.partnerId) : undefined, q.companyId ? eq(dataShares.companyId, q.companyId) : undefined].filter(Boolean) as ReturnType<typeof eq>[]
  const rows = await ctx.db.select().from(dataShares).where(conds.length ? and(...conds) : undefined).orderBy(desc(dataShares.createdAt)).limit(q.limit)
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
}

/**
 * SOMENTE DESENVOLVIMENTO/DEMO: faz os parceiros SANDBOX concluírem as tarefas pendentes do estágio atual
 * (emitindo rastreio e documentos fictícios), para exercitar o fluxo completo sem parceiros reais.
 */
export async function simulateSandboxStage(ctx: AppContext, actorId: string, shipmentId: string) {
  if (ctx.config.NODE_ENV === 'production') throw conflict('not_available_in_production')
  const { s } = await getShipmentRow(ctx, shipmentId)
  if (s.status !== 'IN_PROGRESS') throw conflict('shipment_closed')
  const tasks = (await ctx.db.select().from(shipmentTasks).where(and(eq(shipmentTasks.shipmentId, shipmentId), eq(shipmentTasks.stage, s.stage)))).filter(
    (t) => t.partnerType && t.status !== 'DONE' && t.status !== 'SKIPPED',
  )
  const done: string[] = []
  const skipped: { taskKey: string; reason: string }[] = []
  for (const t of tasks) {
    const resolved = await ctx.adapters.resolveByType(ctx, t.partnerType!)
    if (!resolved || resolved.adapter.id !== 'sandbox') {
      skipped.push({ taskKey: t.key, reason: 'partner_not_sandbox' })
      continue
    }
    const ref = t.externalRef ?? `SBX-SIM-${t.key}`
    const res = await applyPartnerEvents(ctx, resolved.partner, sandboxEventsForTask(t.key, ref, ctx.now()), { shipmentId, taskKey: t.key, externalRef: ref, allowedDocumentHosts: allowedDocumentHosts(resolved) })
    if (res.applied) done.push(t.key)
    else skipped.push({ taskKey: t.key, reason: res.skipped[0]?.reason ?? 'not_applied' })
  }
  await audit(ctx.db, { actorUserId: actorId, action: 'integration.sandbox_simulated', entityType: 'shipment', entityId: shipmentId, meta: { stage: s.stage, done } })
  return { stage: s.stage, stageTitle: getStageDef(s.stage).title.pt, done, skipped, shipment: await getShipmentDto(ctx, shipmentId) }
}
