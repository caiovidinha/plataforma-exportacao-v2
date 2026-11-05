import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { count, eq } from 'drizzle-orm'
import { productInputSchema, sectionsFor, type CompanyType, type PartnerType } from '@amazon-trade/shared'
import { createContext } from '../bootstrap'
import type { AppContext } from '../context'
import { hashPassword } from '../lib/crypto'
import { createProduct } from '../modules/catalog/service'
import { storeFile } from '../modules/files/service'
import type { AuthContext } from '../plugins/auth'
import { sampleSectionData } from './demo-data'
import { SAMPLE_TARIFFS } from './sample-tariffs'
import { companies, companyMembers, companySections, partnerIntegrations, partners, products, tariffs, users } from './schema'

/**
 * SEED idempotente.
 *   - sempre:      tarifas de AMOSTRA (marcadas `isSample`) quando a tabela está vazia
 *   - produção:    só cria o administrador se SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD estiverem definidos
 *   - dev/teste:   usuários de equipe + parceiros SANDBOX; com `--demo` também empresas/produtos de demonstração
 *
 * As credenciais abaixo existem SOMENTE para desenvolvimento local e jamais são criadas em produção.
 */
const DEV_PASSWORD = 'AmazonTrade#2026'
const isProd = (ctx: AppContext) => ctx.config.NODE_ENV === 'production'

async function ensureUser(ctx: AppContext, u: { email: string; fullName: string; password: string; platformRole?: 'COMPLIANCE' | 'OPERATIONS' | 'PLATFORM_ADMIN' }) {
  const [existing] = await ctx.db.select().from(users).where(eq(users.email, u.email)).limit(1)
  if (existing) return existing
  const [row] = await ctx.db
    .insert(users)
    .values({ email: u.email, fullName: u.fullName, passwordHash: await hashPassword(u.password), platformRole: u.platformRole ?? 'NONE', emailVerifiedAt: ctx.now(), locale: 'pt' })
    .returning()
  console.log(`[seed] usuário criado: ${u.email}`)
  return row!
}

async function seedTariffs(ctx: AppContext) {
  const [{ n }] = await ctx.db.select({ n: count() }).from(tariffs)
  if (n > 0) return
  await ctx.db.insert(tariffs).values(SAMPLE_TARIFFS.map((x) => ({ service: x.service, match: x.match, pricing: x.pricing, validFrom: x.validFrom, validTo: x.validTo ?? null, label: x.label, isSample: x.isSample })))
  console.log(`[seed] ${SAMPLE_TARIFFS.length} tarifas de AMOSTRA criadas (substitua pelas tabelas reais no backoffice)`)
}

async function seedStaff(ctx: AppContext) {
  if (isProd(ctx)) {
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD
    if (email && password) await ensureUser(ctx, { email, password, fullName: 'Administrador', platformRole: 'PLATFORM_ADMIN' })
    else console.log('[seed] produção: defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD para criar o administrador')
    return
  }
  await ensureUser(ctx, { email: 'admin@amazontrade.local', fullName: 'Admin Amazon Trade', password: DEV_PASSWORD, platformRole: 'PLATFORM_ADMIN' })
  await ensureUser(ctx, { email: 'ops@amazontrade.local', fullName: 'Operações', password: DEV_PASSWORD, platformRole: 'OPERATIONS' })
  await ensureUser(ctx, { email: 'compliance@amazontrade.local', fullName: 'Compliance', password: DEV_PASSWORD, platformRole: 'COMPLIANCE' })
}

const SANDBOX_PARTNERS: { type: PartnerType; key: string; name: string }[] = [
  { type: 'DESPACHANTE', key: 'sandbox-despachante', name: '[SANDBOX] Despachante Aduaneiro' },
  { type: 'TRANSPORTE_MARITIMO', key: 'sandbox-maritimo', name: '[SANDBOX] Transportadora Marítima' },
  { type: 'TRANSPORTE_TERRESTRE', key: 'sandbox-terrestre', name: '[SANDBOX] Transportadora Terrestre' },
  { type: 'CAMBIO', key: 'sandbox-cambio', name: '[SANDBOX] Câmbio' },
  { type: 'SEGURO', key: 'sandbox-seguro', name: '[SANDBOX] Seguradora' },
]

async function seedSandboxPartners(ctx: AppContext) {
  if (isProd(ctx)) return
  for (const p of SANDBOX_PARTNERS) {
    const [existing] = await ctx.db.select().from(partners).where(eq(partners.key, p.key)).limit(1)
    if (existing) continue
    const [row] = await ctx.db.insert(partners).values({ ...p, contactEmail: `${p.key}@example.test`, notes: 'Parceiro SIMULADO para desenvolvimento. Não é integração real.' }).returning()
    await ctx.db.insert(partnerIntegrations).values({ partnerId: row!.id, mode: 'API', environment: 'SANDBOX', enabled: true, config: { adapter: 'sandbox', autoComplete: true } })
    console.log(`[seed] parceiro sandbox: ${p.key}`)
  }
}

// ------------------------------------------------------------------ demonstração
async function ensureDemoCompany(ctx: AppContext, a: { email: string; fullName: string; company: string; type: CompanyType; country: string; extra?: Record<string, unknown> }) {
  const user = await ensureUser(ctx, { email: a.email, fullName: a.fullName, password: DEV_PASSWORD })
  let [member] = await ctx.db.select().from(companyMembers).where(eq(companyMembers.userId, user.id)).limit(1)
  if (!member) {
    const [company] = await ctx.db.insert(companies).values({ type: a.type, legalName: a.company, tradeName: a.company.replace(/ (Ltda\.|GmbH)$/, ''), country: a.country, onboardingStatus: 'APPROVED', reviewedAt: ctx.now() }).returning()
    ;[member] = await ctx.db.insert(companyMembers).values({ companyId: company!.id, userId: user.id, role: 'OWNER' }).returning()
    for (const [i, s] of sectionsFor(a.type).entries()) {
      const data = sampleSectionData(s, a.type, i) as Record<string, unknown>
      if (s.key === 'company') Object.assign(data, { legalName: a.company, ...(a.extra ?? {}) })
      await ctx.db.insert(companySections).values({ companyId: company!.id, sectionKey: s.key, data: data as never, updatedBy: user.id })
    }
    console.log(`[seed] empresa demo (${a.type}) aprovada: ${a.company}`)
  }
  const [company] = await ctx.db.select().from(companies).where(eq(companies.id, member!.companyId))
  const auth: AuthContext = {
    via: 'bearer',
    user: { id: user.id, email: user.email, fullName: user.fullName, locale: 'pt', platformRole: 'NONE', emailVerifiedAt: user.emailVerifiedAt },
    company: { id: company!.id, type: company!.type, legalName: company!.legalName, onboardingStatus: company!.onboardingStatus, country: company!.country },
    memberRole: 'OWNER',
  }
  return auth
}

const imageDir = () => path.resolve(import.meta.dirname, '../../../web/public/img')

async function seedDemo(ctx: AppContext) {
  if (isProd(ctx)) throw new Error('Dados de demonstração não são permitidos em produção')
  const exporter = await ensureDemoCompany(ctx, { email: 'exportador@demo.local', fullName: 'Marina Tavares', company: 'Castanhas do Xingu Ltda.', type: 'EXPORTER', country: 'BR', extra: { cnpj: '11222333000181' } })
  await ensureDemoCompany(ctx, { email: 'importador@demo.local', fullName: 'Lars Becker', company: 'Nordic Nuts GmbH', type: 'IMPORTER', country: 'DE', extra: { taxId: 'DE811234567' } })

  const [{ n }] = await ctx.db.select({ n: count() }).from(products).where(eq(products.companyId, exporter.company!.id))
  if (n > 0) return
  const catalog = [
    { name: 'Castanha-do-Brasil Crua In Natura', file: 'offer-castanha-crua.webp', price: 6.4, available: 90000, desc: 'Castanha crua, selecionada e descascada, safra do Pará. Baixa umidade e controle de aflatoxina por lote.' },
    { name: 'Castanha-do-Brasil Orgânica Certificada', file: 'offer-castanha-organica.webp', price: 8.9, available: 40000, desc: 'Origem extrativista com certificação orgânica e rastreabilidade por comunidade.' },
    { name: 'Castanha-do-Brasil Premium Tipo 1', file: 'offer-castanha-premium.webp', price: 7.6, available: 60000, desc: 'Calibre superior, seleção eletrônica e embalagem a vácuo para varejo.' },
  ]
  for (const c of catalog) {
    const imageFileIds: string[] = []
    const file = path.join(imageDir(), c.file)
    if (existsSync(file)) {
      const stored = await storeFile(ctx, ctx.db, { ownerCompanyId: exporter.company!.id, kind: 'PRODUCT_IMAGE', buffer: readFileSync(file), mimeType: 'image/webp', originalName: c.file, createdBy: exporter.user.id })
      imageFileIds.push(stored.id)
    }
    const input = productInputSchema.parse({
      name: c.name,
      category: 'Castanha-do-Brasil',
      description: c.desc,
      ncm: '0801.21.00',
      packaging: 'Sacos de 25 kg em big bag',
      originPort: 'BRBEL',
      originState: 'PA',
      harvestYear: 2026,
      basePriceUsdPerKg: c.price,
      minOrderKg: 5000,
      availableKg: c.available,
      leadTimeDays: 25,
      incoterms: ['FOB', 'CFR', 'CIF'],
      destinationCountries: ['DE', 'NL', 'US', 'ES'],
      technicalSheet: { physicochemical: { maxMoisturePct: 5, aflatoxinTolerance: [{ country: 'DE', ppb: 4 }, { country: 'NL', ppb: 4 }, { country: 'US', ppb: 10 }] } },
      status: 'PUBLISHED',
      imageFileIds,
    })
    await createProduct(ctx, exporter, input)
  }
  console.log(`[seed] ${catalog.length} produtos de demonstração publicados`)
}

const ctx = await createContext()
try {
  await seedTariffs(ctx)
  await seedStaff(ctx)
  await seedSandboxPartners(ctx)
  if (process.argv.includes('--demo')) await seedDemo(ctx)
  console.log('[seed] concluído')
} finally {
  await ctx.close()
}
