import { and, desc, eq, gte, isNull, lte, or } from 'drizzle-orm'
import {
  TARIFF_SCHEMAS,
  type Currency,
  type PricingConfigDto,
  type PricingMode,
  type PricingService,
  type TariffDto,
  type TariffInput,
} from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { pricingConfig, tariffs } from '../../db/schema'
import { badRequest, notFound } from '../../lib/errors'

/** Taxas INDICATIVAS (unidades de USD por 1 unidade da moeda). Substituir por fonte real de câmbio. */
export const USD_PER_UNIT: Record<Currency, number> = { USD: 1, EUR: 1.08, BRL: 0.18 }
export const toUsd = (amount: number, currency: Currency) => amount * USD_PER_UNIT[currency]
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

const toDto = (r: typeof tariffs.$inferSelect): TariffDto => ({
  id: r.id,
  service: r.service,
  match: r.match,
  pricing: r.pricing,
  validFrom: r.validFrom,
  validTo: r.validTo,
  label: r.label ?? undefined,
  isSample: r.isSample,
  createdAt: r.createdAt.toISOString(),
})

export async function createTariff(ctx: AppContext, input: TariffInput, userId?: string) {
  const schemas = TARIFF_SCHEMAS[input.service]
  const match = schemas.match.safeParse(input.match)
  const pricing = schemas.pricing.safeParse(input.pricing)
  if (!match.success || !pricing.success) {
    const issues = [...(match.success ? [] : match.error.issues.map((i) => ({ path: `match.${i.path.join('.')}`, message: i.message }))), ...(pricing.success ? [] : pricing.error.issues.map((i) => ({ path: `pricing.${i.path.join('.')}`, message: i.message })))]
    throw badRequest('invalid_tariff', 'Tarifa inválida para o serviço', issues)
  }
  const [row] = await ctx.db
    .insert(tariffs)
    .values({ service: input.service, match: match.data as Record<string, unknown>, pricing: pricing.data as Record<string, unknown>, validFrom: input.validFrom, validTo: input.validTo ?? null, label: input.label, isSample: input.isSample, createdBy: userId })
    .returning()
  return toDto(row!)
}

export async function listTariffs(ctx: AppContext, service?: PricingService) {
  const rows = await ctx.db.select().from(tariffs).where(service ? eq(tariffs.service, service) : undefined).orderBy(desc(tariffs.validFrom))
  return rows.map(toDto)
}

export async function deleteTariff(ctx: AppContext, id: string) {
  const res = await ctx.db.delete(tariffs).where(eq(tariffs.id, id)).returning({ id: tariffs.id })
  if (!res.length) throw notFound('tariff_not_found')
}

/**
 * Tarifa vigente mais específica: todas as chaves de `match` da tarifa devem bater com a consulta
 * (chave ausente na tarifa = coringa); desempata por mais chaves e vigência mais recente.
 */
export async function findTariff(ctx: AppContext, service: PricingService, query: Record<string, unknown>, onDate = ctx.now()) {
  const day = onDate.toISOString().slice(0, 10)
  const rows = await ctx.db
    .select()
    .from(tariffs)
    .where(and(eq(tariffs.service, service), lte(tariffs.validFrom, day), or(isNull(tariffs.validTo), gte(tariffs.validTo, day))))
    .orderBy(desc(tariffs.validFrom))
  const matches = rows.filter((r) => Object.entries(r.match).every(([k, v]) => v === undefined || v === null || query[k] === v))
  matches.sort((a, b) => Object.keys(b.match).length - Object.keys(a.match).length)
  return matches[0] ?? null
}

// ---------------------------------------------------------------- chave TABELA / API do parceiro
export async function getPricingConfig(ctx: AppContext, service: PricingService): Promise<PricingConfigDto> {
  const [row] = await ctx.db.select().from(pricingConfig).where(eq(pricingConfig.service, service)).limit(1)
  return row
    ? { service, mode: row.mode, fallbackToTable: row.fallbackToTable }
    : { service, mode: ctx.config.PRICING_DEFAULT_MODE as PricingMode, fallbackToTable: true }
}

export async function listPricingConfigs(ctx: AppContext): Promise<PricingConfigDto[]> {
  const { PRICING_SERVICES } = await import('@amazon-trade/shared')
  return Promise.all(PRICING_SERVICES.map((s) => getPricingConfig(ctx, s)))
}

export async function setPricingConfig(ctx: AppContext, input: PricingConfigDto, userId?: string) {
  await ctx.db
    .insert(pricingConfig)
    .values({ service: input.service, mode: input.mode, fallbackToTable: input.fallbackToTable, updatedBy: userId })
    .onConflictDoUpdate({ target: pricingConfig.service, set: { mode: input.mode, fallbackToTable: input.fallbackToTable, updatedBy: userId, updatedAt: ctx.now() } })
  return getPricingConfig(ctx, input.service)
}
