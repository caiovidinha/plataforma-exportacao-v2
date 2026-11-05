import {
  DEFAULT_MAX_KG_PER_CONTAINER,
  INCOTERM_RULES,
  portByCode,
  type Currency,
  type PricingService,
  type SimulationInput,
  type SimulationLine,
  type SimulationResult,
} from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { AppError, badRequest, unprocessable } from '../../lib/errors'
import { NoTariffError, PartnerPricingUnavailable, partnerProvider, tableProvider, type PriceQuote, type PriceRequest } from './providers'
import { USD_PER_UNIT, getPricingConfig, round2 } from './tariffs'

export interface SimProduct {
  id: string
  originPort: string
  originState: string | null
  basePriceUsdPerKg: number
  minOrderKg: number
  availableKg: number
  incoterms: string[]
}

export const SIMULATION_TTL_HOURS = 24

/**
 * Precifica UM serviço respeitando a chave de origem (TABELA × API do parceiro) e o fallback.
 * Retorna a cotação com a fonte efetivamente usada.
 */
export async function priceService(ctx: AppContext, req: PriceRequest): Promise<PriceQuote & { fallbackUsed?: boolean; warning?: string }> {
  const cfg = await getPricingConfig(ctx, req.service)
  if (cfg.mode === 'TABLE') return tableProvider.quote(ctx, req)
  try {
    return await partnerProvider.quote(ctx, req)
  } catch (e) {
    if (!(e instanceof PartnerPricingUnavailable)) throw e
    if (!cfg.fallbackToTable) throw new AppError(503, 'partner_pricing_unavailable', `Cotação do parceiro indisponível para ${req.service}: ${e.message}`)
    const quote = await tableProvider.quote(ctx, req)
    return { ...quote, fallbackUsed: true, warning: `Cotação do parceiro indisponível; usada a tabela (${e.message})` }
  }
}

/** Serviços opcionais: sem tarifa, a simulação segue com a linha zerada e um aviso. */
const OPTIONAL: PricingService[] = ['IMPORT_CHARGES', 'PLATFORM_FEE']

async function optionalPrice(ctx: AppContext, req: PriceRequest) {
  try {
    return await priceService(ctx, req)
  } catch (e) {
    if (e instanceof NoTariffError && OPTIONAL.includes(req.service)) return null
    throw e
  }
}

export async function simulate(ctx: AppContext, input: SimulationInput, product: SimProduct): Promise<SimulationResult> {
  const dest = portByCode(input.destinationPort)
  if (!dest || dest.country === 'BR') throw badRequest('invalid_destination_port', 'Porto de destino inválido')
  if (!product.incoterms.includes(input.incoterm)) throw unprocessable('incoterm_not_offered', `O exportador não oferece ${input.incoterm} para este produto`)
  if (input.quantityKg < product.minOrderKg) throw unprocessable('quantity_below_minimum', `Pedido mínimo: ${product.minOrderKg} kg`, { minOrderKg: product.minOrderKg })
  if (input.quantityKg > product.availableKg) throw unprocessable('quantity_above_available', `Disponível: ${product.availableKg} kg`, { availableKg: product.availableKg })

  const maxKg = DEFAULT_MAX_KG_PER_CONTAINER[input.containerType]
  const containers = Math.max(1, Math.ceil(input.quantityKg / maxKg))
  const productValue = round2(input.quantityKg * product.basePriceUsdPerKg)

  const base = {
    originPort: product.originPort,
    originState: product.originState ?? undefined,
    destinationPort: input.destinationPort,
    destinationCountry: dest.country,
    quantityKg: input.quantityKg,
    containers,
    containerType: input.containerType,
    productValueUsd: productValue,
  }

  // 1) frete marítimo (obrigatório)
  const freight = await priceService(ctx, { ...base, service: 'FREIGHT_MARITIME', baseValueUsd: productValue })
  // 2) seguro sobre CFR (produto + frete) (obrigatório)
  const cfrValue = round2(productValue + freight.amountUsd)
  const insurance = await priceService(ctx, { ...base, service: 'INSURANCE', baseValueUsd: cfrValue })

  const rules = INCOTERM_RULES[input.incoterm]
  const invoiceValue = round2(productValue + (rules.freightIncludedInPrice ? freight.amountUsd : 0) + (rules.insuranceIncludedInPrice ? insurance.amountUsd : 0))
  const cifValue = round2(cfrValue + insurance.amountUsd)

  // 3) câmbio sobre o valor da fatura (obrigatório); 4) estimativa de tributos de destino e 5) taxa da plataforma (opcionais)
  const fx = await priceService(ctx, { ...base, service: 'FX', baseValueUsd: invoiceValue })
  const importCharges = await optionalPrice(ctx, { ...base, service: 'IMPORT_CHARGES', baseValueUsd: cifValue })
  const platformFee = await optionalPrice(ctx, { ...base, service: 'PLATFORM_FEE', baseValueUsd: invoiceValue })

  const L = (code: string, service: SimulationLine['service'], label: string, q: PriceQuote & { fallbackUsed?: boolean; warning?: string }, includedInInvoice: boolean): SimulationLine => ({
    code,
    service,
    label,
    amountUsd: q.amountUsd,
    source: q.source,
    includedInInvoice,
    detail: q.detail,
    ...(q.fallbackUsed ? { fallbackUsed: true, warning: q.warning } : {}),
  })

  const lines: SimulationLine[] = [
    { code: 'PRODUCT', service: 'PRODUCT', label: 'Mercadoria (base FOB)', amountUsd: productValue, source: 'SYSTEM', includedInInvoice: true, detail: { unitPriceUsdPerKg: product.basePriceUsdPerKg, quantityKg: input.quantityKg } },
    L('FREIGHT_MARITIME', 'FREIGHT_MARITIME', 'Frete marítimo', freight, rules.freightIncludedInPrice),
    L('INSURANCE', 'INSURANCE', 'Seguro da mercadoria', insurance, rules.insuranceIncludedInPrice),
    L('FX', 'FX', 'Custo de câmbio', fx, false),
  ]
  if (importCharges) lines.push(L('IMPORT_CHARGES', 'IMPORT_CHARGES', 'Estimativa de tributos de importação (informativa)', importCharges, false))
  else lines.push({ code: 'IMPORT_CHARGES', service: 'IMPORT_CHARGES', label: 'Estimativa de tributos de importação (informativa)', amountUsd: 0, source: 'SYSTEM', includedInInvoice: false, warning: 'Sem tarifa cadastrada para o país de destino' })
  if (platformFee) lines.push(L('PLATFORM_FEE', 'PLATFORM_FEE', 'Taxa de serviço Amazon Trade', platformFee, false))

  const extraCosts = round2(lines.filter((l) => !l.includedInInvoice && l.service !== 'PRODUCT').reduce((s, l) => s + l.amountUsd, 0))
  const totalLanded = round2(invoiceValue + extraCosts)
  const rate = currencyRate(input.currency)

  return {
    productId: product.id,
    quantityKg: input.quantityKg,
    incoterm: input.incoterm,
    destinationPort: input.destinationPort,
    originPort: product.originPort,
    containerType: input.containerType,
    containers,
    currency: input.currency,
    invoiceValueUsd: invoiceValue,
    extraCostsUsd: extraCosts,
    totalLandedUsd: totalLanded,
    totalInCurrency: round2(totalLanded * rate),
    fxRateUsed: rate,
    transitDays: freight.transitDays ?? null,
    lines,
    validUntil: new Date(ctx.now().getTime() + SIMULATION_TTL_HOURS * 3600_000).toISOString(),
    disclaimer: 'Estimativa sujeita a confirmação das tarifas e da cotação de câmbio no fechamento. Tributos de destino são apenas indicativos.',
  }
}

/** Unidades da moeda por 1 USD (indicativo). */
function currencyRate(c: Currency) {
  return Math.round((1 / USD_PER_UNIT[c]) * 10000) / 10000
}
