import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AdapterError, type PartnerAdapter } from '../integrations/types'
import { makeTestApp, type TestApp } from '../../test/helpers'
import { createActor, createPartner, createPublishedProduct, seedSampleTariffs, type Actor } from '../../test/fixtures'

let t: TestApp
let exporter: Actor
let importer: Actor
let ops: Actor
let productId: string

const sim = (a: Actor, over: Record<string, unknown> = {}) =>
  t.app.inject({
    method: 'POST',
    url: '/simulations',
    headers: a.h,
    payload: { productId, quantityKg: 20000, destinationPort: 'NLRTM', incoterm: 'FOB', currency: 'USD', containerType: '40HC', ...over },
  })
const line = (result: { lines: { code: string }[] }, code: string) => result.lines.find((l) => l.code === code) as unknown as { amountUsd: number; source: string; fallbackUsed?: boolean; includedInInvoice: boolean }

const setMode = (service: string, mode: 'TABLE' | 'PARTNER_API', fallbackToTable = true) =>
  t.app.inject({ method: 'PUT', url: '/admin/pricing-config', headers: ops.h, payload: { service, mode, fallbackToTable } })

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

describe('simulação por TABELA', () => {
  it('calcula os itens e as diferenças entre FOB, CFR e CIF', async () => {
    const fobRes = await sim(importer, { incoterm: 'FOB' })
    expect(fobRes.statusCode, fobRes.body).toBe(201)
    const fob = fobRes.json().result
    const cfr = (await sim(importer, { incoterm: 'CFR' })).json().result
    const cif = (await sim(importer, { incoterm: 'CIF' })).json().result

    expect(fob.containers).toBe(1)
    expect(line(fob, 'PRODUCT').amountUsd).toBe(100000)
    expect(line(fob, 'FREIGHT_MARITIME').amountUsd).toBe(3380) // (3200 + 180) × 1
    expect(line(fob, 'FREIGHT_MARITIME').source).toBe('TABLE')
    expect(line(fob, 'INSURANCE').amountUsd).toBe(398.01)
    expect(fob.transitDays).toBe(22)

    // incoterm muda o que entra na fatura do exportador
    expect(fob.invoiceValueUsd).toBe(100000)
    expect(cfr.invoiceValueUsd - fob.invoiceValueUsd).toBeCloseTo(3380, 2)
    expect(cif.invoiceValueUsd - cfr.invoiceValueUsd).toBeCloseTo(398.01, 2)
    expect(line(cif, 'FREIGHT_MARITIME').includedInInvoice).toBe(true)
    expect(line(fob, 'FREIGHT_MARITIME').includedInInvoice).toBe(false)

    // total = fatura + custos extras
    expect(fob.totalLandedUsd).toBeCloseTo(fob.invoiceValueUsd + fob.extraCostsUsd, 2)
    expect(fob.disclaimer).toBeTruthy()
  })

  it('converte para a moeda escolhida e calcula contêineres por peso', async () => {
    const eur = (await sim(importer, { currency: 'EUR' })).json().result
    expect(eur.fxRateUsed).toBeCloseTo(0.9259, 3)
    expect(eur.totalInCurrency).toBeCloseTo(eur.totalLandedUsd * 0.9259, 0)
    const big = (await sim(importer, { quantityKg: 55000 })).json().result
    expect(big.containers).toBe(3) // 55 t / 26 t por 40HC
  })

  it('valida regras de negócio', async () => {
    expect((await sim(importer, { quantityKg: 100 })).json().error.code).toBe('quantity_below_minimum')
    expect((await sim(importer, { quantityKg: 999999 })).json().error.code).toBe('quantity_above_available')
    expect((await sim(importer, { destinationPort: 'BRSSZ' })).json().error.code).toBe('invalid_destination_port')
    expect((await sim(importer, { destinationPort: 'JPTYO' })).json().error.code).toBe('no_tariff') // rota sem tarifa
    expect((await sim(exporter)).statusCode).toBe(403)
    expect((await sim({ ...importer, h: {} as never })).statusCode).toBe(401)
  })

  it('importação sem tarifa de destino segue com aviso (linha informativa zerada)', async () => {
    const r = (await sim(importer, { destinationPort: 'ESBCN' })).json().result
    const ic = r.lines.find((l: { code: string }) => l.code === 'IMPORT_CHARGES')
    expect(ic.amountUsd).toBe(0)
    expect(ic.warning).toBeTruthy()
  })

  it('lista e recupera simulações do próprio importador', async () => {
    const created = (await sim(importer)).json()
    const got = await t.app.inject({ method: 'GET', url: `/simulations/${created.id}`, headers: importer.h })
    expect(got.statusCode).toBe(200)
    const other = await createActor(t, { type: 'IMPORTER', approved: true })
    expect((await t.app.inject({ method: 'GET', url: `/simulations/${created.id}`, headers: other.h })).statusCode).toBe(404)
    const list = await t.app.inject({ method: 'GET', url: '/simulations', headers: importer.h })
    expect(list.json().length).toBeGreaterThan(0)
  })
})

describe('chave TABELA × API do parceiro', () => {
  const makeAdapter = (impl: PartnerAdapter['quote']): PartnerAdapter => ({ id: 'fake-quote', capabilities: new Set(['quote']), quote: impl })

  it('PARTNER_API usa a cotação do parceiro (e converte moeda)', async () => {
    t.ctx.adapters.register(makeAdapter(async (_c, req) => ({ amount: 3000, currency: 'EUR', transitDays: 19, raw: { svc: req.service } })))
    await createPartner(t, { type: 'TRANSPORTE_MARITIMO', adapter: 'fake-quote' })
    expect((await setMode('FREIGHT_MARITIME', 'PARTNER_API')).statusCode).toBe(200)

    const r = (await sim(importer)).json().result
    const f = line(r, 'FREIGHT_MARITIME')
    expect(f.source).toBe('PARTNER')
    expect(f.amountUsd).toBe(3240) // 3000 EUR × 1.08
    expect(r.transitDays).toBe(19)
    // demais serviços continuam por tabela
    expect(line(r, 'INSURANCE').source).toBe('TABLE')
  })

  it('com falha do parceiro e fallback ligado, usa a tabela e sinaliza', async () => {
    t.ctx.adapters.register(makeAdapter(async () => { throw new AdapterError('timeout') }))
    await setMode('FREIGHT_MARITIME', 'PARTNER_API', true)
    const r = (await sim(importer)).json().result
    const f = line(r, 'FREIGHT_MARITIME')
    expect(f.source).toBe('TABLE')
    expect(f.fallbackUsed).toBe(true)
    expect(f.amountUsd).toBe(3380)
  })

  it('com falha do parceiro e sem fallback, responde 503', async () => {
    await setMode('FREIGHT_MARITIME', 'PARTNER_API', false)
    const res = await sim(importer)
    expect(res.statusCode).toBe(503)
    expect(res.json().error.code).toBe('partner_pricing_unavailable')
  })

  it('voltando para TABELA restaura o cálculo interno', async () => {
    await setMode('FREIGHT_MARITIME', 'TABLE')
    const r = (await sim(importer)).json().result
    expect(line(r, 'FREIGHT_MARITIME').source).toBe('TABLE')
    const cfg = await t.app.inject({ method: 'GET', url: '/admin/pricing-config', headers: ops.h })
    expect(cfg.json().find((c: { service: string }) => c.service === 'FREIGHT_MARITIME').mode).toBe('TABLE')
  })

  it('config e tarifas exigem papel de operações', async () => {
    expect((await t.app.inject({ method: 'GET', url: '/admin/tariffs', headers: importer.h })).statusCode).toBe(403)
    const created = await t.app.inject({
      method: 'POST', url: '/admin/tariffs', headers: ops.h,
      payload: { service: 'FREIGHT_MARITIME', match: { originPort: 'BRBEL', destinationPort: 'JPTYO', containerType: '40HC' }, pricing: { ratePerContainer: 4500, currency: 'USD', transitDays: 35 }, validFrom: '2026-01-01', isSample: false },
    })
    expect(created.statusCode, created.body).toBe(201)
    const bad = await t.app.inject({ method: 'POST', url: '/admin/tariffs', headers: ops.h, payload: { service: 'FREIGHT_MARITIME', match: {}, pricing: {}, validFrom: '2026-01-01', isSample: false } })
    expect(bad.statusCode).toBe(400)
    // a nova tarifa passa a atender a rota antes sem cobertura
    expect((await sim(importer, { destinationPort: 'JPTYO' })).statusCode).toBe(201)
  })
})
