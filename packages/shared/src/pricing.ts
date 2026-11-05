import { z } from 'zod'
import { CURRENCIES, INCOTERMS, PRICING_SERVICES } from './enums'
import type { Currency, Incoterm, PriceSource, PricingService } from './enums'

export const CONTAINER_TYPES = ['20DC', '40DC', '40HC'] as const
export type ContainerType = (typeof CONTAINER_TYPES)[number]

/** Carga útil de referência por contêiner (kg) — pode ser sobrescrita na tarifa. */
export const DEFAULT_MAX_KG_PER_CONTAINER: Record<ContainerType, number> = {
  '20DC': 18000,
  '40DC': 26000,
  '40HC': 26000,
}

const money = z.number().nonnegative()
const currency = z.enum(CURRENCIES)

/** Esquemas de `match` (chave de busca) e `pricing` (valores) por serviço. */
export const TARIFF_SCHEMAS = {
  FREIGHT_MARITIME: {
    match: z.object({ originPort: z.string(), destinationPort: z.string(), containerType: z.enum(CONTAINER_TYPES) }),
    pricing: z.object({
      ratePerContainer: money,
      currency,
      transitDays: z.number().int().positive(),
      maxKgPerContainer: z.number().positive().optional(),
      surchargePerContainer: money.optional(),
    }),
  },
  FREIGHT_LAND: {
    match: z.object({ originState: z.string(), destinationPort: z.string() }),
    pricing: z.object({ ratePerTon: money, minCharge: money.optional(), currency, transitDays: z.number().int().positive().optional() }),
  },
  INSURANCE: {
    match: z.object({ coverage: z.string().default('ALL_RISKS') }),
    pricing: z.object({
      ratePct: z.number().nonnegative(),
      minPremium: money,
      currency,
      insuredValueMarkupPct: z.number().nonnegative().default(10),
    }),
  },
  FX: {
    match: z.object({ currency }),
    pricing: z.object({ spreadPct: z.number().nonnegative(), fixedFee: money, currency }),
  },
  CUSTOMS_BROKER: {
    match: z.object({ originPort: z.string().optional() }),
    pricing: z.object({ fixedFee: money, pctOfValue: z.number().nonnegative().default(0), currency }),
  },
  ORIGIN_HANDLING: {
    match: z.object({ originPort: z.string() }),
    pricing: z.object({ perContainer: money, currency }),
  },
  IMPORT_CHARGES: {
    match: z.object({ country: z.string() }),
    pricing: z.object({
      dutyPct: z.number().nonnegative(),
      vatPct: z.number().nonnegative(),
      otherPct: z.number().nonnegative().default(0),
    }),
  },
  PLATFORM_FEE: {
    match: z.object({}),
    pricing: z.object({ pct: z.number().nonnegative(), minFee: money, currency }),
  },
} as const satisfies Record<PricingService, { match: z.ZodType; pricing: z.ZodType }>

export const tariffInputSchema = z.object({
  service: z.enum(PRICING_SERVICES),
  match: z.record(z.string(), z.unknown()),
  pricing: z.record(z.string(), z.unknown()),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  label: z.string().max(200).optional(),
  isSample: z.boolean().default(false),
})
export type TariffInput = z.infer<typeof tariffInputSchema>

/** Quem arca com cada perna do frete por incoterm (a partir da base FOB do exportador). */
export const INCOTERM_RULES: Record<Incoterm, { freightIncludedInPrice: boolean; insuranceIncludedInPrice: boolean }> = {
  FOB: { freightIncludedInPrice: false, insuranceIncludedInPrice: false },
  CFR: { freightIncludedInPrice: true, insuranceIncludedInPrice: false },
  CIF: { freightIncludedInPrice: true, insuranceIncludedInPrice: true },
}

export const simulationInputSchema = z.object({
  productId: z.uuid(),
  quantityKg: z.number().positive().max(10_000_000),
  destinationPort: z.string().min(5).max(5),
  incoterm: z.enum(INCOTERMS),
  currency: z.enum(CURRENCIES).default('USD'),
  containerType: z.enum(CONTAINER_TYPES).default('40HC'),
})
export type SimulationInput = z.infer<typeof simulationInputSchema>

export interface SimulationLine {
  code: string
  service: PricingService | 'PRODUCT'
  label: string
  /** Valor em USD. */
  amountUsd: number
  source: PriceSource
  /** Esta linha compõe o valor da fatura do exportador (vs. custo pago a terceiros). */
  includedInInvoice: boolean
  detail?: Record<string, unknown>
  /** Quando a fonte pedida (PARTNER_API) falhou e usamos a tabela. */
  fallbackUsed?: boolean
  warning?: string
}

export interface SimulationResult {
  productId: string
  quantityKg: number
  incoterm: Incoterm
  destinationPort: string
  originPort: string
  containerType: ContainerType
  containers: number
  currency: Currency
  /** Valor da fatura do exportador no incoterm escolhido (USD). */
  invoiceValueUsd: number
  /** Custos pagos a terceiros além da fatura (USD). */
  extraCostsUsd: number
  /** Custo total estimado de chegada (USD). */
  totalLandedUsd: number
  /** Total na moeda escolhida (conversão informativa). */
  totalInCurrency: number
  fxRateUsed: number
  transitDays: number | null
  lines: SimulationLine[]
  validUntil: string
  disclaimer: string
}
