import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REQUIREMENT_REGISTRY, getStageDef, sectionsFor, type ShipmentDto } from '@amazon-trade/shared'
import { companySections, dataShares, partners, webhookDeliveries } from '../../db/schema'
import { makeTestApp, type TestApp } from '../../test/helpers'
import { PDF, createActor, createConfirmedShipment, createPartner, createPublishedProduct, multipartBody, sampleSectionData, seedSampleTariffs, type Actor } from '../../test/fixtures'
import { signWebhook } from './webhook'
import { runWorkerOnce } from './worker'

let t: TestApp
let exporter: Actor
let importer: Actor
let ops: Actor
let productId: string
let shipmentId: string
const keys: Record<string, string> = {}

const get = async (path: string, a: Actor = ops) => (await t.app.inject({ method: 'GET', url: path, headers: a.h })).json()
const shipment = () => get(`/shipments/${shipmentId}`) as Promise<ShipmentDto>
const task = async (key: string) => (await shipment()).tasks.find((x) => x.key === key)!

async function fillSections(actor: Actor, type: 'EXPORTER' | 'IMPORTER') {
  for (const [i, s] of sectionsFor(type).entries()) {
    const data = sampleSectionData(s, type, i) as never
    await t.ctx.db
      .insert(companySections)
      .values({ companyId: actor.companyId, sectionKey: s.key, data })
      .onConflictDoUpdate({ target: [companySections.companyId, companySections.sectionKey], set: { data } })
  }
}

function signedWebhook(partnerKey: string, secret: string, body: unknown, over: { ts?: number; sign?: boolean } = {}) {
  const raw = JSON.stringify(body)
  const ts = over.ts ?? Math.floor(Date.now() / 1000)
  return t.app.inject({
    method: 'POST',
    url: `/webhooks/${partnerKey}`,
    headers: { 'content-type': 'application/json', 'x-at-timestamp': String(ts), 'x-at-signature': over.sign === false ? 'sha256=deadbeef' : signWebhook(secret, ts, raw) },
    payload: raw,
  })
}

beforeAll(async () => {
  t = await makeTestApp()
  await seedSampleTariffs(t)
  exporter = await createActor(t, { type: 'EXPORTER', approved: true })
  importer = await createActor(t, { type: 'IMPORTER', approved: true })
  ops = await createActor(t, { type: 'IMPORTER', platformRole: 'OPERATIONS' })
  productId = (await createPublishedProduct(t, exporter)).id
  await fillSections(exporter, 'EXPORTER')
  await fillSections(importer, 'IMPORTER')

  // DESPACHANTE / MARÍTIMO / CÂMBIO = sandbox (API simulada); SEGURO = e-mail + portal-lite; TERRESTRE = manual
  for (const type of ['DESPACHANTE', 'TRANSPORTE_MARITIMO', 'CAMBIO'] as const) {
    const { partner } = await createPartner(t, { type, adapter: 'sandbox', key: `sbx-${type.toLowerCase().replace(/_/g, '-')}` })
    keys[type] = partner.key
  }
  keys.SEGURO = (await createPartner(t, { type: 'SEGURO', mode: 'EMAIL', key: 'seguradora-teste', email: 'sinistros@seguradora.test' })).partner.key
  keys.TRANSPORTE_TERRESTRE = (await createPartner(t, { type: 'TRANSPORTE_TERRESTRE', mode: 'MANUAL', key: 'terrestre-teste' })).partner.key
  shipmentId = (await createConfirmedShipment(t, { exporter, importer, productId })).shipmentId
})
afterAll(async () => {
  await t.close()
})

describe('despacho aos parceiros (worker)', () => {
  it('processa a fila: sandbox conclui sozinho, e-mail e manual ficam aguardando o parceiro', async () => {
    const results = await runWorkerOnce(t.ctx, 10)
    expect(results.map((r) => r.outcome)).toEqual(['succeeded', 'succeeded', 'succeeded', 'succeeded', 'succeeded'])

    // sandbox: aceitou e concluiu
    for (const key of ['CUSTOMS_PROCESS_OPENED', 'MARITIME_BOOKING_CONFIRMED', 'FX_CONTRACT_OPENED']) expect((await task(key)).status).toBe('DONE')
    // e-mail e manual: entregues, aguardando resposta do parceiro
    expect((await task('INSURANCE_ISSUED')).status).toBe('IN_PROGRESS')
    expect((await task('LAND_TRANSPORT_SCHEDULED')).status).toBe('IN_PROGRESS')

    // rastreio e documentos vindos do parceiro (sandbox) entram no embarque
    const s = await shipment()
    expect(s.tracking).toMatchObject({ vesselName: 'SANDBOX MV AMAZONIA', status: 'BOOKING_CONFIRMED' })
    const events = await get(`/shipments/${shipmentId}/events`)
    expect(events.some((e: { source: string; message: string }) => e.source === 'PARTNER' && e.message.includes('[SANDBOX]'))).toBe(true)
  })

  it('e-mail ao seguro leva os dados da operação e o link do portal-lite', async () => {
    const mail = t.mailer.last('sinistros@seguradora.test')!
    expect(mail.subject).toContain('Cotação/emissão de seguro')
    expect(mail.text).toContain('=== DADOS DA OPERAÇÃO ===')
    expect(mail.text).toMatch(/\/partner\/[\w-]{40,}/)
  })

  it('minimização: cada compartilhamento só lista campos exigidos por aquele tipo de parceiro', async () => {
    const shares = await t.ctx.db.select().from(dataShares)
    expect(shares.length).toBeGreaterThanOrEqual(5)
    const allPartners = await t.ctx.db.select().from(partners)
    let checked = 0
    for (const share of shares) {
      const type = allPartners.find((p) => p.id === share.partnerId)!.type
      for (const f of share.fields.filter((x) => !x.startsWith('document.'))) {
        const [party, section, key] = f.split('.') as [string, string, string]
        const companyType = party === 'exporter' ? 'EXPORTER' : 'IMPORTER'
        const req = REQUIREMENT_REGISTRY.find((r) => r.kind === 'field' && r.companyType === companyType && r.section === section && r.key === key)
        expect(req?.partners, `${f} compartilhado com ${type}`).toContain(type)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})

describe('portal-lite (parceiro sem API)', () => {
  let token: string

  it('abre pelo link, mostra só o necessário e permite aceitar/atualizar a tarefa do próprio parceiro', async () => {
    token = t.mailer.last('sinistros@seguradora.test')!.text.match(/\/partner\/([\w-]+)/)![1]!
    const info = (await t.app.inject({ method: 'GET', url: `/partner-actions/${token}` })).json()
    expect(info.partner.type).toBe('SEGURO')
    expect(info.shipment.number).toMatch(/^SH-/)
    expect(info.tasks.map((x: { key: string }) => x.key)).toEqual(['INSURANCE_ISSUED'])
    expect(JSON.stringify(info)).not.toMatch(/cnpj|iban|swift|bank/i) // sem dados cadastrais

    const accept = await t.app.inject({ method: 'POST', url: `/partner-actions/${token}`, payload: { action: 'ACCEPT', reference: 'APO-123' } })
    expect(accept.statusCode, accept.body).toBe(200)
    expect((await task('INSURANCE_ISSUED')).status).toBe('IN_PROGRESS')

    // não pode mexer em tarefa de outro tipo de parceiro
    const other = await t.app.inject({ method: 'POST', url: `/partner-actions/${token}`, payload: { action: 'UPDATE_STATUS', taskKey: 'FX_CONTRACT_SIGNED', taskStatus: 'DONE' } })
    expect(other.statusCode).toBe(422)

    // documento (apólice) pelo portal
    const mp = multipartBody({ type: 'INSURANCE_POLICY' }, { name: 'apolice.pdf', buffer: PDF })
    const up = await t.app.inject({ method: 'POST', url: `/partner-actions/${token}/documents`, headers: mp.headers, payload: mp.payload })
    expect(up.statusCode, up.body).toBe(201)
    const docs = await get(`/shipments/${shipmentId}/documents`)
    expect(docs.find((d: { type: string; source: string }) => d.type === 'INSURANCE_POLICY' && d.source === 'PARTNER')).toBeTruthy()

    const done = await t.app.inject({ method: 'POST', url: `/partner-actions/${token}`, payload: { action: 'UPDATE_STATUS', taskStatus: 'DONE', note: 'Apólice emitida' } })
    expect(done.statusCode).toBe(200)
    expect((await task('INSURANCE_ISSUED')).status).toBe('DONE')
  })

  it('token inválido, adulterado ou revogado é rejeitado', async () => {
    expect((await t.app.inject({ method: 'GET', url: `/partner-actions/${'x'.repeat(43)}` })).statusCode).toBe(401)
    expect((await t.app.inject({ method: 'GET', url: `/partner-actions/${token}x` })).statusCode).toBe(401)
    // o operador gera outro link; o anterior do mesmo job é revogado
    const [job] = (await get(`/admin/jobs?shipmentId=${shipmentId}&limit=50`)).filter((j: { operation: string }) => j.operation === 'REQUEST_INSURANCE')
    const link = (await t.app.inject({ method: 'POST', url: `/admin/jobs/${job.id}/portal-link`, headers: ops.h })).json()
    expect(link.url).toMatch(/\/partner\//)
    expect((await t.app.inject({ method: 'GET', url: `/partner-actions/${token}` })).statusCode).toBe(401)
    const fresh = link.url.split('/partner/')[1]
    expect((await t.app.inject({ method: 'GET', url: `/partner-actions/${fresh}` })).statusCode).toBe(200)
  })

  it('o parceiro manual (terrestre) é concluído por operações e o embarque avança de etapa', async () => {
    expect((await shipment()).stage).toBe('NEGOCIO')
    const res = await t.app.inject({ method: 'PATCH', url: `/shipments/${shipmentId}/tasks/LAND_TRANSPORT_SCHEDULED`, headers: ops.h, payload: { status: 'DONE' } })
    expect(res.statusCode, res.body).toBe(200)
    expect((await shipment()).stage).toBe('MERCADORIA_PRONTA')
  })
})

describe('webhooks de entrada', () => {
  const key = () => keys.DESPACHANTE!
  let secret: string

  it('exige integração habilitada e segredo configurado', async () => {
    expect((await signedWebhook('nao-existe', 'x', { eventId: 'e0', events: [] })).statusCode).toBe(404)
    // sem segredo definido nenhuma assinatura é aceita
    const body = { eventId: 'evt-nosecret', events: [{ type: 'TASK_STATUS', taskKey: 'EXPORT_DOCS_PREPARED', status: 'DONE', message: 'x' }] }
    expect((await signedWebhook(key(), 'qualquer', body)).statusCode).toBe(401)

    const [p] = (await get('/admin/partners')).filter((x: { key: string }) => x.key === key())
    const rotated = await t.app.inject({ method: 'POST', url: `/admin/integrations/${p.integrations[0].id}/rotate-webhook-secret`, headers: ops.h })
    secret = rotated.json().webhookSecret
    expect(secret.length).toBeGreaterThan(30)
  })

  it('aceita evento assinado e aplica no embarque (status via mapa do parceiro)', async () => {
    // mapa de status do parceiro → status canônico
    const [p] = (await get('/admin/partners')).filter((x: { key: string }) => x.key === key())
    await t.app.inject({ method: 'PUT', url: `/admin/partners/${p.id}/integrations`, headers: ops.h, payload: { mode: 'API', environment: 'SANDBOX', enabled: true, config: { adapter: 'sandbox', statusMap: { FINALIZADO: 'DONE' } } } })

    const body = {
      eventId: 'evt-1',
      events: [
        { type: 'TASK_STATUS', shipmentRef: (await shipment()).number, taskKey: 'EXPORT_DOCS_PREPARED', partnerStatus: 'FINALIZADO', message: 'Documentos preparados' },
        { type: 'DOCUMENT_AVAILABLE', shipmentRef: (await shipment()).number, message: 'Pré-embarque', document: { type: 'PACKING_LIST', fileName: 'pl.pdf', contentBase64: PDF.toString('base64') } },
      ],
    }
    const res = await signedWebhook(key(), secret, body)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toMatchObject({ ok: true, applied: 2 })
    expect((await task('EXPORT_DOCS_PREPARED')).status).toBe('DONE')
    expect((await get(`/shipments/${shipmentId}/documents`)).some((d: { type: string }) => d.type === 'PACKING_LIST')).toBe(true)
  })

  it('reenvio do mesmo eventId é ignorado (anti-replay) e não duplica efeitos', async () => {
    const body = { eventId: 'evt-1', events: [{ type: 'TASK_STATUS', shipmentRef: (await shipment()).number, taskKey: 'EXPORT_DOCS_PREPARED', status: 'DONE', message: 'de novo' }] }
    const res = await signedWebhook(key(), secret, body)
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ duplicate: true })
    const docs = (await get(`/shipments/${shipmentId}/documents`)).filter((d: { type: string }) => d.type === 'PACKING_LIST')
    expect(docs).toHaveLength(1)
  })

  it('rejeita assinatura inválida, timestamp fora da tolerância e corpo malformado', async () => {
    const body = { eventId: 'evt-2', events: [{ type: 'TASK_STATUS', taskKey: 'PRE_SEAL_INSPECTION', status: 'DONE', message: 'x' }] }
    expect((await signedWebhook(key(), secret, body, { sign: false })).statusCode).toBe(401)
    expect((await signedWebhook(key(), 'segredo-errado', body)).statusCode).toBe(401)
    expect((await signedWebhook(key(), secret, body, { ts: Math.floor(Date.now() / 1000) - 3600 })).statusCode).toBe(401) // replay antigo
    expect((await t.app.inject({ method: 'POST', url: `/webhooks/${key()}`, headers: { 'content-type': 'application/json' }, payload: '{}' })).statusCode).toBe(401) // sem headers
    expect((await signedWebhook(key(), secret, { eventId: 'evt-3', events: [] })).statusCode).toBe(400)
    expect((await signedWebhook(key(), secret, { eventId: 'evt-4', events: [{ type: 'NAO_EXISTE', message: 'x' }] })).statusCode).toBe(400)
    // nada disso deixou rastro de "processado"
    const rows = await t.ctx.db.select().from(webhookDeliveries)
    expect(rows.map((r) => r.eventId)).toEqual(['evt-1'])
  })

  it('parceiro só atualiza tarefas do seu tipo; evento sem efeito libera o eventId para reenvio', async () => {
    const body = { eventId: 'evt-5', events: [{ type: 'TASK_STATUS', shipmentRef: (await shipment()).number, taskKey: 'INVOICE_ISSUED', status: 'DONE', message: 'tentando mexer na NF' }] }
    const res = await signedWebhook(key(), secret, body)
    expect(res.statusCode).toBe(422)
    expect(res.json().skipped[0].reason).toBe('task_not_owned_by_partner')
    expect((await task('INVOICE_ISSUED')).status).not.toBe('DONE')
    expect((await t.ctx.db.select().from(webhookDeliveries)).map((r) => r.eventId)).not.toContain('evt-5')
  })

  it('evento tardio/duplicado nunca reabre tarefa concluída', async () => {
    const body = { eventId: 'evt-6', events: [{ type: 'REQUEST_ACCEPTED', shipmentRef: (await shipment()).number, taskKey: 'EXPORT_DOCS_PREPARED', message: 'aceito (atrasado)' }] }
    expect((await signedWebhook(key(), secret, body)).statusCode).toBe(200)
    expect((await task('EXPORT_DOCS_PREPARED')).status).toBe('DONE')
  })
})

describe('ciclo completo até concluir', () => {
  it('sandbox + operações levam o embarque de ponta a ponta', async () => {
    for (let i = 0; i < 8; i++) {
      const s = await shipment()
      if (s.status === 'COMPLETED') break
      await t.app.inject({ method: 'POST', url: `/admin/shipments/${shipmentId}/sandbox/simulate`, headers: ops.h })
      // o que o sandbox não cobre (exportador/plataforma/seguro/terrestre manuais) é feito por operações
      const current = await shipment()
      const sandboxTypes = ['DESPACHANTE', 'TRANSPORTE_MARITIMO', 'CAMBIO']
      for (const def of getStageDef(current.stage).tasks.filter((d) => !d.auto && !(d.partner && sandboxTypes.includes(d.partner)))) {
        const tk = current.tasks.find((x) => x.stage === current.stage && x.key === def.key)!
        if (tk.status !== 'DONE') await t.app.inject({ method: 'PATCH', url: `/shipments/${shipmentId}/tasks/${def.key}`, headers: ops.h, payload: { status: 'DONE' } })
      }
    }
    const final = await shipment()
    expect(final.status).toBe('COMPLETED')
    expect(final.tracking).toMatchObject({ blNumber: 'SBX-BL-0001', containerNumbers: ['SBXU1234567'] })
    const types = (await get(`/shipments/${shipmentId}/documents`)).map((d: { type: string }) => d.type)
    expect(types).toEqual(expect.arrayContaining(['BILL_OF_LADING', 'DU_E', 'PHYTOSANITARY_CERTIFICATE', 'FX_CONTRACT']))
  })

  it('simulação sandbox não existe em produção', async () => {
    const prod = { ...t.ctx, config: { ...t.ctx.config, NODE_ENV: 'production' as const } }
    const { simulateSandboxStage } = await import('./admin')
    await expect(simulateSandboxStage(prod, ops.userId, shipmentId)).rejects.toMatchObject({ code: 'not_available_in_production' })
  })
})
