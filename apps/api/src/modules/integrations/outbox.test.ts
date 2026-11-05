import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { integrationJobs, notifications, partnerIntegrations, shipmentEvents } from '../../db/schema'
import { makeTestApp, type TestApp } from '../../test/helpers'
import { createActor, createConfirmedShipment, createPartner, createPublishedProduct, seedSampleTariffs, type Actor } from '../../test/fixtures'
import { enqueueJob, nextAttemptDelayMs } from './outbox'
import { AdapterError, type PartnerAdapter } from './types'
import { processJob, runWorkerOnce } from './worker'

let t: TestApp
let exporter: Actor
let importer: Actor
let ops: Actor
let productId: string
let clock = new Date('2026-06-01T12:00:00Z')

let behavior: 'transient' | 'permanent' | 'ok' = 'transient'
let calls = 0
const flaky: PartnerAdapter = {
  id: 'flaky',
  capabilities: new Set(['dispatch']),
  async dispatch() {
    calls++
    if (behavior === 'transient') throw new AdapterError('timeout talking to partner')
    if (behavior === 'permanent') throw new AdapterError('400 bad request', false, 400)
    return { accepted: true, externalRef: 'FLK-1' }
  },
}

const jobsOf = (shipmentId: string) => t.ctx.db.select().from(integrationJobs).where(eq(integrationJobs.shipmentId, shipmentId))
const tick = (ms: number) => (clock = new Date(clock.getTime() + ms))

beforeAll(async () => {
  t = await makeTestApp({ now: () => clock })
  t.ctx.adapters.register(flaky)
  await seedSampleTariffs(t)
  exporter = await createActor(t, { type: 'EXPORTER', approved: true })
  importer = await createActor(t, { type: 'IMPORTER', approved: true })
  ops = await createActor(t, { type: 'IMPORTER', platformRole: 'OPERATIONS' })
  productId = (await createPublishedProduct(t, exporter)).id
})
afterAll(async () => {
  await t.close()
})

describe('backoff', () => {
  it('cresce exponencialmente com jitter e tem teto de 6 h', () => {
    expect(nextAttemptDelayMs(1, () => 0.5)).toBe(30_000)
    expect(nextAttemptDelayMs(2, () => 0.5)).toBe(60_000)
    expect(nextAttemptDelayMs(3, () => 0.5)).toBe(120_000)
    expect(nextAttemptDelayMs(1, () => 0)).toBe(22_500) // -25 %
    expect(nextAttemptDelayMs(1, () => 1)).toBe(37_500) // +25 %
    expect(nextAttemptDelayMs(30, () => 0.5)).toBe(6 * 3600_000)
  })
})

describe('outbox: retry, backoff e DEAD', () => {
  let shipmentId: string
  let jobId: string

  it('só existe job se há parceiro ativo; a chave de idempotência evita duplicidade', async () => {
    const { partner, integration } = await createPartner(t, { type: 'SEGURO', adapter: 'flaky', mode: 'API' })
    await t.ctx.db.update(partnerIntegrations).set({ maxAttempts: 3 }).where(eq(partnerIntegrations.id, integration.id))
    expect(partner.id).toBeTruthy()
    shipmentId = (await createConfirmedShipment(t, { exporter, importer, productId })).shipmentId
    const jobs = await jobsOf(shipmentId)
    expect(jobs).toHaveLength(1)
    jobId = jobs[0]!.id
    // reenfileirar a mesma operação/tarefa é no-op
    const again = await enqueueJob(t.ctx, t.ctx.db, { partnerType: 'SEGURO', operation: 'REQUEST_INSURANCE', shipmentId, taskKey: 'INSURANCE_ISSUED', payload: {} })
    expect(again).toMatchObject({ queued: true, duplicate: true })
    expect(await jobsOf(shipmentId)).toHaveLength(1)
    // sem parceiro ativo do tipo → não enfileira
    const none = await enqueueJob(t.ctx, t.ctx.db, { partnerType: 'LABORATORIO', operation: 'SEND_DOCUMENT', shipmentId, taskKey: null, payload: {} })
    expect(none).toEqual({ queued: false, reason: 'no_partner' })
  })

  it('falha transitória → FAILED com próxima tentativa no futuro; não reprocessa antes da hora', async () => {
    behavior = 'transient'
    const first = await runWorkerOnce(t.ctx)
    expect(first).toEqual([{ jobId, outcome: 'retry' }])
    const [job] = await jobsOf(shipmentId)
    expect(job!.status).toBe('FAILED')
    expect(job!.attempts).toBe(1)
    expect(job!.lastError).toContain('timeout')
    expect(job!.nextAttemptAt!.getTime()).toBeGreaterThan(clock.getTime())
    expect(await runWorkerOnce(t.ctx)).toEqual([]) // ainda não venceu
    expect(calls).toBe(1)
  })

  it('esgota as tentativas → DEAD, bloqueia a tarefa, registra na timeline e avisa operações', async () => {
    tick(10 * 60_000)
    expect((await runWorkerOnce(t.ctx))[0]!.outcome).toBe('retry') // tentativa 2
    tick(60 * 60_000)
    expect((await runWorkerOnce(t.ctx))[0]!.outcome).toBe('dead') // tentativa 3 = maxAttempts
    const [job] = await jobsOf(shipmentId)
    expect(job!.status).toBe('DEAD')
    expect(job!.attempts).toBe(3)
    expect(job!.finishedAt).toBeTruthy()

    const events = await t.ctx.db.select().from(shipmentEvents).where(eq(shipmentEvents.shipmentId, shipmentId))
    expect(events.map((e) => e.type)).toContain('PARTNER_REQUEST_FAILED')
    const shipment = (await t.app.inject({ method: 'GET', url: `/shipments/${shipmentId}`, headers: ops.h })).json()
    expect(shipment.tasks.find((x: { key: string }) => x.key === 'INSURANCE_ISSUED').status).toBe('BLOCKED')
    const alerts = await t.ctx.db.select().from(notifications).where(eq(notifications.userId, ops.userId))
    expect(alerts.some((n) => n.title.includes('Integração falhou'))).toBe(true)
    expect(await runWorkerOnce(t.ctx)).toEqual([]) // DEAD não volta sozinho
  })

  it('retry manual no backoffice reabre o job (zera tentativas) e conclui quando o parceiro volta', async () => {
    expect((await t.app.inject({ method: 'POST', url: `/admin/jobs/${jobId}/retry`, headers: importer.h })).statusCode).toBe(403)
    expect((await t.app.inject({ method: 'POST', url: `/admin/jobs/${jobId}/retry`, headers: ops.h })).statusCode).toBe(200)
    expect((await jobsOf(shipmentId))[0]).toMatchObject({ status: 'QUEUED', attempts: 0 })
    behavior = 'ok'
    expect((await runWorkerOnce(t.ctx))[0]!.outcome).toBe('succeeded')
    const [job] = await jobsOf(shipmentId)
    expect(job!.status).toBe('SUCCEEDED')
    expect(job!.result).toMatchObject({ externalRef: 'FLK-1', accepted: true })
    // retry de job concluído não é permitido
    expect((await t.app.inject({ method: 'POST', url: `/admin/jobs/${jobId}/retry`, headers: ops.h })).statusCode).toBe(409)
    const list = (await t.app.inject({ method: 'GET', url: '/admin/jobs?status=SUCCEEDED', headers: ops.h })).json()
    expect(list.some((j: { id: string }) => j.id === jobId)).toBe(true)
  })

  it('erro não retentável (4xx) vai direto para DEAD', async () => {
    behavior = 'permanent'
    const other = (await createConfirmedShipment(t, { exporter, importer, productId })).shipmentId
    const res = await runWorkerOnce(t.ctx)
    expect(res.map((r) => r.outcome)).toEqual(['dead'])
    expect((await jobsOf(other))[0]).toMatchObject({ status: 'DEAD', attempts: 1 })
  })

  it('job preso em RUNNING (processo caiu) é recuperado', async () => {
    behavior = 'ok'
    const third = (await createConfirmedShipment(t, { exporter, importer, productId })).shipmentId
    const [job] = await jobsOf(third)
    await t.ctx.db.update(integrationJobs).set({ status: 'RUNNING', attempts: 1, lockedAt: new Date(clock.getTime() - 10 * 60_000) }).where(eq(integrationJobs.id, job!.id))
    expect(await processJob(t.ctx, job!.id)).toBe('succeeded')
    // recoverStaleJobs só mexe em RUNNING antigos
    const { recoverStaleJobs } = await import('./worker')
    await t.ctx.db.update(integrationJobs).set({ status: 'RUNNING', attempts: 1, lockedAt: new Date(clock.getTime() - 10 * 60_000) }).where(eq(integrationJobs.id, job!.id))
    expect(await recoverStaleJobs(t.ctx)).toBe(1)
    expect((await jobsOf(third))[0]!.status).toBe('FAILED')
  })
})

describe('backoffice de parceiros', () => {
  it('exige papel de operações', async () => {
    for (const a of [exporter, importer]) expect((await t.app.inject({ method: 'GET', url: '/admin/partners', headers: a.h })).statusCode).toBe(403)
    expect((await t.app.inject({ method: 'GET', url: '/admin/partners' })).statusCode).toBe(401)
  })

  it('cria parceiro, configura integração e nunca devolve segredos', async () => {
    const created = await t.app.inject({ method: 'POST', url: '/admin/partners', headers: ops.h, payload: { type: 'DESPACHANTE', key: 'despachante-teste', name: 'Despachante Teste', contactEmail: 'ops@despachante.test' } })
    expect(created.statusCode, created.body).toBe(201)
    const id = created.json().id
    expect((await t.app.inject({ method: 'POST', url: '/admin/partners', headers: ops.h, payload: { type: 'DESPACHANTE', key: 'despachante-teste', name: 'Outro' } })).statusCode).toBe(409)

    const put = await t.app.inject({
      method: 'PUT', url: `/admin/partners/${id}/integrations`, headers: ops.h,
      payload: { mode: 'API', environment: 'SANDBOX', enabled: true, config: { baseUrl: 'https://sandbox.despachante.test', auth: { type: 'apiKey' } }, secrets: { apiKey: 'super-secret-key', webhookSecret: 'whsec' } },
    })
    expect(put.statusCode, put.body).toBe(200)
    expect(put.json().secretKeys.sort()).toEqual(['apiKey', 'webhookSecret'])
    expect(JSON.stringify(put.json())).not.toContain('super-secret-key')
    const [row] = await t.ctx.db.select().from(partnerIntegrations).where(eq(partnerIntegrations.id, put.json().id))
    expect(row!.secretsEnc).toBeTruthy()
    expect(row!.secretsEnc).not.toContain('super-secret-key') // criptografado em repouso

    // atualizar sem enviar segredos preserva; string vazia remove
    const keep = await t.app.inject({ method: 'PUT', url: `/admin/partners/${id}/integrations`, headers: ops.h, payload: { mode: 'API', environment: 'SANDBOX', enabled: true, config: { baseUrl: 'https://sandbox.despachante.test' }, secrets: { webhookSecret: '' } } })
    expect(keep.json().secretKeys).toEqual(['apiKey'])

    const list = (await t.app.inject({ method: 'GET', url: '/admin/partners', headers: ops.h })).json()
    expect(list.find((p: { id: string }) => p.id === id).integrations).toHaveLength(1)
  })

  it('valida adapter e proíbe sandbox em produção', async () => {
    const [p] = (await t.app.inject({ method: 'GET', url: '/admin/partners', headers: ops.h })).json()
    const bad = await t.app.inject({ method: 'PUT', url: `/admin/partners/${p.id}/integrations`, headers: ops.h, payload: { mode: 'API', environment: 'SANDBOX', config: { adapter: 'nao-existe' } } })
    expect(bad.json().error.code).toBe('unknown_adapter')
    const prod = await t.app.inject({ method: 'PUT', url: `/admin/partners/${p.id}/integrations`, headers: ops.h, payload: { mode: 'API', environment: 'PRODUCTION', config: { adapter: 'sandbox' } } })
    expect(prod.json().error.code).toBe('sandbox_not_allowed_in_production')
  })

  it('testar conexão usa o healthCheck do adapter e grava o resultado', async () => {
    const { integration } = await createPartner(t, { type: 'CAMBIO', adapter: 'sandbox' })
    const res = await t.app.inject({ method: 'POST', url: `/admin/integrations/${integration.id}/test`, headers: ops.h })
    expect(res.json()).toMatchObject({ ok: true, supported: true })
    const [row] = await t.ctx.db.select().from(partnerIntegrations).where(eq(partnerIntegrations.id, integration.id))
    expect(row!.lastHealthOk).toBe(true)
    expect(row!.lastHealthAt).toBeTruthy()
  })

  it('adapter sandbox nunca é resolvido em produção', async () => {
    const { partner } = await createPartner(t, { type: 'TRANSPORTE_TERRESTRE', adapter: 'sandbox' })
    expect(await t.ctx.adapters.resolveForPartner(t.ctx, partner.id)).not.toBeNull()
    const prodCtx = { ...t.ctx, config: { ...t.ctx.config, NODE_ENV: 'production' as const } }
    const [row] = await t.ctx.db.select().from(partnerIntegrations).where(eq(partnerIntegrations.partnerId, partner.id))
    await t.ctx.db.update(partnerIntegrations).set({ environment: 'PRODUCTION' }).where(eq(partnerIntegrations.id, row!.id))
    expect(await t.ctx.adapters.resolveForPartner(prodCtx, partner.id)).toBeNull()
  })
})
