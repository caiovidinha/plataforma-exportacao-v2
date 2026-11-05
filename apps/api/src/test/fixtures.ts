import { eq } from 'drizzle-orm'
import { documentTypesFor, sectionsFor, type CompanyType } from '@amazon-trade/shared'
import { companies, users } from '../db/schema'
export { sampleItem, sampleSectionData, sampleValue } from '../db/demo-data'
import { bearer, loginToken, registerUser, type TestApp } from './helpers'


export const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n')

/** Corpo multipart/form-data (campos primeiro, arquivo por último). */
export function multipartBody(fields: Record<string, string>, file: { name: string; buffer: Buffer; type?: string }) {
  const boundary = '----atform' + Math.random().toString(16).slice(2)
  const chunks: Buffer[] = []
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`))
  }
  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type ?? 'application/pdf'}\r\n\r\n`))
  chunks.push(file.buffer, Buffer.from(`\r\n--${boundary}--\r\n`))
  return { payload: Buffer.concat(chunks), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}

export interface Actor {
  token: string
  email: string
  userId: string
  companyId: string
  h: { authorization: string }
}

let companySeq = 100
/** Cria usuário+empresa; opcionalmente já aprovada (atalho direto no banco) e/ou como staff. */
export async function createActor(
  t: TestApp,
  opts: { type?: CompanyType; approved?: boolean; platformRole?: 'COMPLIANCE' | 'OPERATIONS' | 'PLATFORM_ADMIN'; country?: string } = {},
): Promise<Actor> {
  const type = opts.type ?? 'EXPORTER'
  const { email } = await registerUser(t, { companyType: type, companyName: `Empresa ${companySeq++}`, country: opts.country ?? (type === 'EXPORTER' ? 'BR' : 'DE') })
  const [u] = await t.ctx.db.select().from(users).where(eq(users.email, email))
  await t.ctx.db.update(users).set({ emailVerifiedAt: new Date(), ...(opts.platformRole ? { platformRole: opts.platformRole } : {}) }).where(eq(users.id, u!.id))
  const token = await loginToken(t, email)
  const me = (await t.app.inject({ method: 'GET', url: '/auth/me', headers: bearer(token) })).json()
  if (opts.approved && me.company) {
    await t.ctx.db.update(companies).set({ onboardingStatus: 'APPROVED', reviewedAt: new Date() }).where(eq(companies.id, me.company.id))
  }
  return { token, email, userId: u!.id, companyId: me.company?.id, h: bearer(token) }
}

export const allSections = (type: CompanyType) => sectionsFor(type)
export const requiredDocs = (type: CompanyType) => documentTypesFor(type).filter((d) => d.required)

// ---------------------------------------------------------------- catálogo / pricing / parceiros
import { partnerIntegrations, partners, tariffs } from '../db/schema'
import { SAMPLE_TARIFFS } from '../db/sample-tariffs'
import type { PartnerType, IntegrationMode } from '@amazon-trade/shared'

export async function seedSampleTariffs(t: TestApp) {
  await t.ctx.db.insert(tariffs).values(
    SAMPLE_TARIFFS.map((x) => ({ service: x.service, match: x.match, pricing: x.pricing, validFrom: x.validFrom, validTo: x.validTo ?? null, label: x.label, isSample: x.isSample })),
  )
}

export const productPayload = (over: Record<string, unknown> = {}) => ({
  name: 'Castanha-do-Brasil Crua In Natura',
  category: 'Castanha-do-Brasil',
  description: 'Castanha selecionada',
  ncm: '0801.21.00',
  packaging: 'Sacos de 25 kg',
  originPort: 'BRBEL',
  originState: 'PA',
  harvestYear: 2026,
  basePriceUsdPerKg: 5,
  minOrderKg: 1000,
  availableKg: 60000,
  leadTimeDays: 20,
  incoterms: ['FOB', 'CFR', 'CIF'],
  destinationCountries: ['DE', 'NL'],
  technicalSheet: { physicochemical: { maxMoisturePct: 5, aflatoxinTolerance: [{ country: 'DE', ppb: 4 }] } },
  status: 'PUBLISHED',
  ...over,
})

export async function createPublishedProduct(t: TestApp, exporter: Actor, over: Record<string, unknown> = {}) {
  const res = await t.app.inject({ method: 'POST', url: '/products', headers: exporter.h, payload: productPayload(over) })
  if (res.statusCode !== 201) throw new Error(`product create failed ${res.statusCode}: ${res.body}`)
  return res.json() as { id: string; name: string }
}

/** Simula → cria pedido → exportador confirma. Devolve ids do pedido e do embarque. */
export async function createConfirmedShipment(t: TestApp, a: { exporter: Actor; importer: Actor; productId: string }) {
  const sim = await t.app.inject({
    method: 'POST', url: '/simulations', headers: a.importer.h,
    payload: { productId: a.productId, quantityKg: 20000, destinationPort: 'NLRTM', incoterm: 'CIF', currency: 'USD', containerType: '40HC' },
  })
  if (sim.statusCode !== 201) throw new Error(`simulation failed ${sim.statusCode}: ${sim.body}`)
  const order = await t.app.inject({ method: 'POST', url: '/orders', headers: a.importer.h, payload: { simulationId: sim.json().id } })
  if (order.statusCode !== 201) throw new Error(`order failed ${order.statusCode}: ${order.body}`)
  const decided = await t.app.inject({ method: 'POST', url: `/orders/${order.json().id}/decision`, headers: a.exporter.h, payload: { decision: 'ACCEPT' } })
  if (decided.statusCode !== 200) throw new Error(`decision failed ${decided.statusCode}: ${decided.body}`)
  return { orderId: order.json().id as string, shipmentId: decided.json().shipmentId as string }
}

export async function createPartner(
  t: TestApp,
  opts: { type: PartnerType; key?: string; mode?: IntegrationMode; adapter?: string; config?: Record<string, unknown>; enabled?: boolean; email?: string },
) {
  const key = opts.key ?? `${opts.type.toLowerCase().replace(/_/g, '-')}-${Math.random().toString(36).slice(2, 7)}`
  const [partner] = await t.ctx.db.insert(partners).values({ type: opts.type, key, name: `Parceiro ${key}`, contactEmail: opts.email ?? `${key}@partner.test`, active: true }).returning()
  const [integration] = await t.ctx.db
    .insert(partnerIntegrations)
    .values({ partnerId: partner!.id, mode: opts.mode ?? 'API', environment: 'SANDBOX', enabled: opts.enabled ?? true, config: { ...(opts.adapter ? { adapter: opts.adapter } : {}), ...(opts.config ?? {}) } })
    .returning()
  return { partner: partner!, integration: integration! }
}
