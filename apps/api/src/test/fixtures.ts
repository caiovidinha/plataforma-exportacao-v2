import { eq } from 'drizzle-orm'
import {
  documentTypesFor,
  resolveOptions,
  sectionsFor,
  type CompanyType,
  type FieldDef,
  type SectionDef,
} from '@amazon-trade/shared'
import { companies, users } from '../db/schema'
import { bearer, loginToken, registerUser, type TestApp } from './helpers'

/** Valor válido plausível para um campo (para testes dirigidos pelas definições). */
export function sampleValue(f: FieldDef): unknown {
  switch (f.type) {
    case 'text': return f.key === 'bankCode' ? '001' : `Sample ${f.key}`.slice(0, 80)
    case 'textarea': return 'Texto de exemplo'
    case 'number': return 10
    case 'boolean': return true
    case 'date': return '2020-05-10'
    case 'email': return 'contato@example.com'
    case 'phone': return '+55 91 99999-0000'
    case 'country': return 'BR'
    case 'url': return 'https://example.com'
    case 'cnpj': return '11222333000181'
    case 'cpf': return '52998224725'
    case 'iban': return 'DE89370400440532013000'
    case 'swift': return 'DEUTDEFF'
    case 'select': return resolveOptions(f)[0]!.value
    case 'multiselect': return [resolveOptions(f)[0]!.value]
    case 'tags': return ['tag']
    case 'ncm': return ['08012100']
  }
}

export function sampleItem(section: SectionDef): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  for (const f of section.fields) {
    if (f.showIf) continue
    item[f.key] = sampleValue(f)
  }
  // coerência para campos condicionais
  if (section.key === 'importRegulatory') item.notifySameAsConsignee = 'YES'
  if (section.key === 'insuranceInfo') { item.hasCargoInsurance = 'NO'; item.claimsLast3Years = 'NONE' }
  if (section.key === 'tradeRegistrations') item.hasExportExperience = 'NO'
  if (section.key === 'credit') item.hasPaymentDefaults = 'NO'
  return item
}

export function sampleSectionData(section: SectionDef, companyType: CompanyType, seq = 0) {
  const item = sampleItem(section)
  if (section.key === 'company') {
    if (companyType === 'EXPORTER') {
      item.legalName = `Exportadora Teste ${seq} Ltda.`
      item.cnpj = ['11222333000181', '45723174000110', '11444777000161'][seq % 3]
    } else {
      item.legalName = `Importer Test ${seq} GmbH`
      item.taxId = `DE${100000000 + seq}`
      item.country = 'DE'
    }
  }
  if (section.key === 'declarations') for (const f of section.fields) item[f.key] = true
  if (!section.repeatable) return item
  const items = Array.from({ length: Math.max(section.repeatable.min, 1) }, () => ({ ...item }))
  return { items }
}

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
