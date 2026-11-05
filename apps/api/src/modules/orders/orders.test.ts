import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MAIN_FLOW, getStageDef, type ShipmentDto } from '@amazon-trade/shared'
import { integrationJobs, notifications } from '../../db/schema'
import { makeTestApp, type TestApp } from '../../test/helpers'
import { PDF, createActor, createPartner, createPublishedProduct, multipartBody, seedSampleTariffs, type Actor } from '../../test/fixtures'

let t: TestApp
let exporter: Actor
let importer: Actor
let ops: Actor
let productId: string

const simulate = async (a: Actor = importer) => {
  const res = await t.app.inject({
    method: 'POST', url: '/simulations', headers: a.h,
    payload: { productId, quantityKg: 20000, destinationPort: 'NLRTM', incoterm: 'CIF', currency: 'USD', containerType: '40HC' },
  })
  expect(res.statusCode, res.body).toBe(201)
  return res.json().id as string
}
const order = async (a: Actor = importer) => {
  const res = await t.app.inject({ method: 'POST', url: '/orders', headers: a.h, payload: { simulationId: await simulate(a), importerNotes: 'urgente' } })
  expect(res.statusCode, res.body).toBe(201)
  return res.json() as { id: string; number: string; status: string }
}
const decide = (id: string, decision: 'ACCEPT' | 'REJECT', reason?: string, a: Actor = exporter) =>
  t.app.inject({ method: 'POST', url: `/orders/${id}/decision`, headers: a.h, payload: { decision, reason } })
const shipment = async (id: string) => (await t.app.inject({ method: 'GET', url: `/shipments/${id}`, headers: ops.h })).json() as ShipmentDto
const patchTask = (shipmentId: string, key: string, status: string, a: Actor = ops) =>
  t.app.inject({ method: 'PATCH', url: `/shipments/${shipmentId}/tasks/${key}`, headers: a.h, payload: { status } })

beforeAll(async () => {
  t = await makeTestApp()
  await seedSampleTariffs(t)
  exporter = await createActor(t, { type: 'EXPORTER', approved: true })
  importer = await createActor(t, { type: 'IMPORTER', approved: true })
  ops = await createActor(t, { type: 'IMPORTER', platformRole: 'OPERATIONS' })
  productId = (await createPublishedProduct(t, exporter)).id
})
afterAll(async () => {
  await t.close()
})

describe('pedidos', () => {
  it('cria pedido a partir da simulação com contrato-lite e notifica o exportador', async () => {
    const o = await order()
    expect(o.number).toMatch(/^AT-\d{4}-\d{6}$/)
    expect(o.status).toBe('AWAITING_CONFIRMATION')
    const detail = (await t.app.inject({ method: 'GET', url: `/orders/${o.id}`, headers: importer.h })).json()
    expect(detail.contract.termsHash).toHaveLength(64)
    expect(detail.contract.importerAcceptedAt).toBeTruthy()
    expect(detail.contract.exporterAcceptedAt).toBeNull()
    const notes = await t.ctx.db.select().from(notifications).where(eq(notifications.userId, exporter.userId))
    expect(notes.some((n) => n.kind === 'order')).toBe(true)
  })

  it('protege acesso e regras de negócio', async () => {
    const simId = await simulate()
    const first = await t.app.inject({ method: 'POST', url: '/orders', headers: importer.h, payload: { simulationId: simId } })
    expect(first.statusCode).toBe(201)
    const dup = await t.app.inject({ method: 'POST', url: '/orders', headers: importer.h, payload: { simulationId: simId } })
    expect(dup.statusCode).toBe(409)
    // exportador não cria pedido; outro importador não vê nem usa a simulação
    expect((await t.app.inject({ method: 'POST', url: '/orders', headers: exporter.h, payload: { simulationId: simId } })).statusCode).toBe(403)
    const other = await createActor(t, { type: 'IMPORTER', approved: true })
    expect((await t.app.inject({ method: 'POST', url: '/orders', headers: other.h, payload: { simulationId: simId } })).statusCode).toBe(404)
    expect((await t.app.inject({ method: 'GET', url: `/orders/${first.json().id}`, headers: other.h })).statusCode).toBe(404)
    // importador não decide; recusa exige motivo
    expect((await decide(first.json().id, 'ACCEPT', undefined, importer)).statusCode).toBe(403)
    expect((await decide(first.json().id, 'REJECT')).statusCode).toBe(422)
    const rejected = await decide(first.json().id, 'REJECT', 'Sem estoque no período')
    expect(rejected.statusCode, rejected.body).toBe(200)
    expect(rejected.json().status).toBe('REJECTED')
    expect((await decide(first.json().id, 'ACCEPT')).statusCode).toBe(409)
  })

  it('importador cancela pedido pendente', async () => {
    const o = await order()
    const res = await t.app.inject({ method: 'POST', url: `/orders/${o.id}/cancel`, headers: importer.h })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('CANCELLED')
  })
})

describe('embarque e workflow', () => {
  it('confirmação cria embarque, bloqueia tarefas sem parceiro e enfileira jobs quando há parceiro', async () => {
    // só existe parceiro de seguro → demais tarefas de parceiro ficam BLOCKED
    await createPartner(t, { type: 'SEGURO', adapter: 'manual', mode: 'EMAIL' })
    const o = await order()
    const res = await decide(o.id, 'ACCEPT')
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json().status).toBe('CONFIRMED')
    const sid = res.json().shipmentId as string
    expect(sid).toBeTruthy()

    const s = await shipment(sid)
    expect(s.stage).toBe('NEGOCIO')
    expect(s.number).toMatch(/^SH-\d{4}-\d{6}$/)
    const byKey = Object.fromEntries(s.tasks.filter((x) => x.stage === 'NEGOCIO').map((x) => [x.key, x.status]))
    expect(byKey.CONTRACTS_ACCEPTED).toBe('DONE')
    expect(byKey.INSURANCE_ISSUED).toBe('IN_PROGRESS')
    expect(byKey.FX_CONTRACT_OPENED).toBe('BLOCKED')

    const jobs = await t.ctx.db.select().from(integrationJobs).where(eq(integrationJobs.shipmentId, sid))
    expect(jobs.map((j) => j.operation)).toEqual(['REQUEST_INSURANCE'])
    expect(jobs[0]!.status).toBe('QUEUED')
    expect(jobs[0]!.idempotencyKey).toBe(`${sid}:REQUEST_INSURANCE:INSURANCE_ISSUED`)

    // importador acompanha o embarque e a timeline; terceiros não
    expect((await t.app.inject({ method: 'GET', url: `/shipments/${sid}`, headers: importer.h })).statusCode).toBe(200)
    const outsider = await createActor(t, { type: 'IMPORTER', approved: true })
    expect((await t.app.inject({ method: 'GET', url: `/shipments/${sid}`, headers: outsider.h })).statusCode).toBe(404)
    const events = (await t.app.inject({ method: 'GET', url: `/shipments/${sid}/events`, headers: importer.h })).json()
    expect(events.map((e: { type: string }) => e.type)).toEqual(expect.arrayContaining(['SHIPMENT_CREATED', 'STAGE_ENTERED', 'NO_PARTNER', 'PARTNER_REQUESTED']))
  })

  it('autorização de tarefas: parceiro/plataforma só operações; exportador só as suas', async () => {
    const o = await order()
    const sid = (await decide(o.id, 'ACCEPT')).json().shipmentId as string
    expect((await patchTask(sid, 'INSURANCE_ISSUED', 'DONE', exporter)).statusCode).toBe(403)
    expect((await patchTask(sid, 'INSURANCE_ISSUED', 'DONE', importer)).statusCode).toBe(403)
    expect((await patchTask(sid, 'INVOICE_ISSUED', 'DONE', ops)).statusCode).toBe(404) // etapa futura
    expect((await patchTask(sid, 'INSURANCE_ISSUED', 'DONE', ops)).statusCode).toBe(200)
  })

  it('avança todos os estágios até concluir o embarque', async () => {
    const o = await order()
    const sid = (await decide(o.id, 'ACCEPT')).json().shipmentId as string
    for (const stage of MAIN_FLOW) {
      const before = await shipment(sid)
      expect(before.stage).toBe(stage)
      const pending = getStageDef(stage).tasks.filter((x) => !x.auto)
      for (const [i, task] of pending.entries()) {
        // o exportador conclui as suas tarefas; o restante é override manual de operações
        const actor = task.actor === 'EXPORTER' ? exporter : ops
        const res = await patchTask(sid, task.key, 'DONE', actor)
        expect(res.statusCode, `${stage}/${task.key}: ${res.body}`).toBe(200)
        if (i < pending.length - 1) expect((await shipment(sid)).stage).toBe(stage) // ainda não avança
      }
    }
    const done = await shipment(sid)
    expect(done.status).toBe('COMPLETED')
    expect(done.completedAt).toBeTruthy()
    expect((await patchTask(sid, 'PAYMENT_RECEIVED', 'DONE')).statusCode).toBe(409) // embarque encerrado
    const events = (await t.app.inject({ method: 'GET', url: `/shipments/${sid}/events`, headers: ops.h })).json()
    expect(events[0].type).toBe('SHIPMENT_COMPLETED')
    // dashboards refletem
    const dash = (await t.app.inject({ method: 'GET', url: '/dashboard', headers: exporter.h })).json()
    expect(dash.role).toBe('EXPORTER')
    expect(dash.counters.shipmentsInProgress).toBeGreaterThanOrEqual(0)
    expect(dash.counters.productsPublished).toBeGreaterThanOrEqual(1)
  })

  it('ocorrência de não pagamento abre ramo excepcional e encerra o embarque', async () => {
    const o = await order()
    const sid = (await decide(o.id, 'ACCEPT')).json().shipmentId as string
    const early = await t.app.inject({ method: 'POST', url: `/shipments/${sid}/exception`, headers: ops.h, payload: { stage: 'NAO_PAGAMENTO', reason: 'Pagamento não recebido' } })
    expect(early.statusCode).toBe(422) // só a partir da liberação
    for (const stage of ['NEGOCIO', 'MERCADORIA_PRONTA', 'MERCADORIA_PORTO'] as const) {
      for (const task of getStageDef(stage).tasks.filter((x) => !x.auto)) await patchTask(sid, task.key, 'DONE', task.actor === 'EXPORTER' ? exporter : ops)
    }
    expect((await shipment(sid)).stage).toBe('MERCADORIA_LIBERADA')
    const ex = await t.app.inject({ method: 'POST', url: `/shipments/${sid}/exception`, headers: ops.h, payload: { stage: 'NAO_PAGAMENTO', reason: 'Pagamento não recebido em 30 dias' } })
    expect(ex.statusCode, ex.body).toBe(200)
    expect(ex.json().stage).toBe('NAO_PAGAMENTO')
    expect(ex.json().status).toBe('DISPUTE')
    expect((await t.app.inject({ method: 'POST', url: `/shipments/${sid}/exception`, headers: exporter.h, payload: { stage: 'NAO_PAGAMENTO', reason: 'tentativa indevida' } })).statusCode).toBe(403)
  })

  it('documentos do embarque: upload, listagem e download por participantes', async () => {
    const o = await order()
    const sid = (await decide(o.id, 'ACCEPT')).json().shipmentId as string
    const mp = multipartBody({ type: 'COMMERCIAL_INVOICE', note: 'v1' }, { name: 'invoice.pdf', buffer: PDF })
    const up = await t.app.inject({ method: 'POST', url: `/shipments/${sid}/documents`, headers: { ...exporter.h, ...mp.headers }, payload: mp.payload })
    expect(up.statusCode, up.body).toBe(201)
    const list = (await t.app.inject({ method: 'GET', url: `/shipments/${sid}/documents`, headers: importer.h })).json()
    expect(list).toHaveLength(1)
    expect(list[0].type).toBe('COMMERCIAL_INVOICE')
    const dl = await t.app.inject({ method: 'GET', url: `/shipments/${sid}/documents/${list[0].id}/download`, headers: importer.h })
    expect(dl.statusCode).toBe(200)
    expect(dl.rawPayload.subarray(0, 5).toString()).toBe('%PDF-')
    const bad = multipartBody({ type: 'COMMERCIAL_INVOICE' }, { name: 'x.pdf', buffer: Buffer.from('not a pdf') })
    expect((await t.app.inject({ method: 'POST', url: `/shipments/${sid}/documents`, headers: { ...exporter.h, ...bad.headers }, payload: bad.payload })).statusCode).toBe(400)
  })

  it('notificações: lista, contador e marcar como lida', async () => {
    const res = (await t.app.inject({ method: 'GET', url: '/notifications', headers: importer.h })).json()
    expect(res.unread).toBeGreaterThan(0)
    await t.app.inject({ method: 'POST', url: `/notifications/${res.items[0].id}/read`, headers: importer.h })
    await t.app.inject({ method: 'POST', url: '/notifications/read-all', headers: importer.h })
    expect((await t.app.inject({ method: 'GET', url: '/notifications', headers: importer.h })).json().unread).toBe(0)
  })
})
