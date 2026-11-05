import { DEFAULT_MAX_KG_PER_CONTAINER, PARTNER_META, TARIFF_SCHEMAS, type ContainerType, type PartnerType, type PricingService } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { AppError } from '../../lib/errors'
import { AdapterError, type QuoteRequest } from '../integrations/types'
import { findTariff, round2, toUsd } from './tariffs'

/** Contexto de uma precificação (derivado do produto + entrada do importador). */
export interface PriceRequest {
  service: PricingService
  originPort: string
  originState?: string
  destinationPort: string
  destinationCountry: string
  quantityKg: number
  containers: number
  containerType: ContainerType
  /** Valor FOB da mercadoria (USD). */
  productValueUsd: number
  /** Base de cálculo do serviço (seguro/câmbio/impostos/taxa), em USD. */
  baseValueUsd: number
}

export interface PriceQuote {
  amountUsd: number
  source: 'TABLE' | 'PARTNER'
  detail: Record<string, unknown>
  transitDays?: number
  validUntil?: string
}

export class NoTariffError extends AppError {
  constructor(service: PricingService, query: Record<string, unknown>) {
    super(422, 'no_tariff', `Sem tarifa vigente para ${service}`, { service, query })
  }
}
export class PartnerPricingUnavailable extends Error {}

export interface PricingProvider {
  readonly source: 'TABLE' | 'PARTNER'
  quote(ctx: AppContext, req: PriceRequest): Promise<PriceQuote>
}

// ------------------------------------------------------------------ TABELA
export const tableProvider: PricingProvider = {
  source: 'TABLE',
  async quote(ctx, req) {
    const S = TARIFF_SCHEMAS
    switch (req.service) {
      case 'FREIGHT_MARITIME': {
        const query = { originPort: req.originPort, destinationPort: req.destinationPort, containerType: req.containerType }
        const t = await findTariff(ctx, 'FREIGHT_MARITIME', query)
        if (!t) throw new NoTariffError('FREIGHT_MARITIME', query)
        const p = S.FREIGHT_MARITIME.pricing.parse(t.pricing)
        const perContainer = toUsd(p.ratePerContainer + (p.surchargePerContainer ?? 0), p.currency)
        return { amountUsd: round2(perContainer * req.containers), source: 'TABLE', transitDays: p.transitDays, detail: { containers: req.containers, containerType: req.containerType, perContainerUsd: round2(perContainer), tariffId: t.id, sample: t.isSample } }
      }
      case 'FREIGHT_LAND': {
        const query = { originState: req.originState ?? '', destinationPort: req.originPort }
        const t = await findTariff(ctx, 'FREIGHT_LAND', query)
        if (!t) throw new NoTariffError('FREIGHT_LAND', query)
        const p = S.FREIGHT_LAND.pricing.parse(t.pricing)
        const amount = Math.max(toUsd(p.ratePerTon * (req.quantityKg / 1000), p.currency), toUsd(p.minCharge ?? 0, p.currency))
        return { amountUsd: round2(amount), source: 'TABLE', transitDays: p.transitDays, detail: { tons: req.quantityKg / 1000, tariffId: t.id, sample: t.isSample } }
      }
      case 'INSURANCE': {
        const query = { coverage: 'ALL_RISKS' }
        const t = await findTariff(ctx, 'INSURANCE', query)
        if (!t) throw new NoTariffError('INSURANCE', query)
        const p = S.INSURANCE.pricing.parse(t.pricing)
        const insured = req.baseValueUsd * (1 + p.insuredValueMarkupPct / 100)
        const premium = Math.max(toUsd(p.minPremium, p.currency), (insured * p.ratePct) / 100)
        return { amountUsd: round2(premium), source: 'TABLE', detail: { insuredValueUsd: round2(insured), ratePct: p.ratePct, tariffId: t.id, sample: t.isSample } }
      }
      case 'FX': {
        const query = { currency: 'USD' }
        const t = await findTariff(ctx, 'FX', query)
        if (!t) throw new NoTariffError('FX', query)
        const p = S.FX.pricing.parse(t.pricing)
        return { amountUsd: round2((req.baseValueUsd * p.spreadPct) / 100 + toUsd(p.fixedFee, p.currency)), source: 'TABLE', detail: { spreadPct: p.spreadPct, tariffId: t.id, sample: t.isSample } }
      }
      case 'CUSTOMS_BROKER': {
        const query = { originPort: req.originPort }
        const t = await findTariff(ctx, 'CUSTOMS_BROKER', query)
        if (!t) throw new NoTariffError('CUSTOMS_BROKER', query)
        const p = S.CUSTOMS_BROKER.pricing.parse(t.pricing)
        return { amountUsd: round2(toUsd(p.fixedFee, p.currency) + (req.baseValueUsd * p.pctOfValue) / 100), source: 'TABLE', detail: { tariffId: t.id, sample: t.isSample } }
      }
      case 'ORIGIN_HANDLING': {
        const query = { originPort: req.originPort }
        const t = await findTariff(ctx, 'ORIGIN_HANDLING', query)
        if (!t) throw new NoTariffError('ORIGIN_HANDLING', query)
        const p = S.ORIGIN_HANDLING.pricing.parse(t.pricing)
        return { amountUsd: round2(toUsd(p.perContainer, p.currency) * req.containers), source: 'TABLE', detail: { tariffId: t.id, sample: t.isSample } }
      }
      case 'IMPORT_CHARGES': {
        const query = { country: req.destinationCountry }
        const t = await findTariff(ctx, 'IMPORT_CHARGES', query)
        if (!t) throw new NoTariffError('IMPORT_CHARGES', query)
        const p = S.IMPORT_CHARGES.pricing.parse(t.pricing)
        const duty = (req.baseValueUsd * p.dutyPct) / 100
        const vat = ((req.baseValueUsd + duty) * p.vatPct) / 100
        const other = (req.baseValueUsd * p.otherPct) / 100
        return { amountUsd: round2(duty + vat + other), source: 'TABLE', detail: { dutyUsd: round2(duty), vatUsd: round2(vat), otherUsd: round2(other), informational: true, tariffId: t.id, sample: t.isSample } }
      }
      case 'PLATFORM_FEE': {
        const t = await findTariff(ctx, 'PLATFORM_FEE', {})
        if (!t) throw new NoTariffError('PLATFORM_FEE', {})
        const p = S.PLATFORM_FEE.pricing.parse(t.pricing)
        return { amountUsd: round2(Math.max(toUsd(p.minFee, p.currency), (req.baseValueUsd * p.pct) / 100)), source: 'TABLE', detail: { pct: p.pct, tariffId: t.id, sample: t.isSample } }
      }
    }
  },
}

// ------------------------------------------------------------------ API DO PARCEIRO
/** Cotação em tempo real pelo adapter do parceiro responsável pelo serviço. */
export const partnerProvider: PricingProvider = {
  source: 'PARTNER',
  async quote(ctx, req) {
    const partnerType = (Object.values(PARTNER_META).find((m) => m.pricingService === req.service)?.type) as PartnerType | undefined
    if (!partnerType) throw new PartnerPricingUnavailable(`Nenhum parceiro cotável para ${req.service}`)
    const resolved = await ctx.adapters.resolveByType(ctx, partnerType)
    if (!resolved || !resolved.adapter.quote) throw new PartnerPricingUnavailable(`Parceiro ${partnerType} sem integração de cotação ativa`)
    const quoteReq: QuoteRequest = {
      service: req.service,
      originPort: req.originPort,
      destinationPort: req.destinationPort,
      originState: req.originState,
      quantityKg: req.quantityKg,
      containers: req.containers,
      containerType: req.containerType,
      valueUsd: req.baseValueUsd,
      currency: 'USD',
    }
    const started = Date.now()
    try {
      const res = await resolved.adapter.quote(resolved.adapterCtx, quoteReq)
      await resolved.adapterCtx.log({ operation: 'QUOTE', direction: 'OUTBOUND', ok: true, durationMs: Date.now() - started, request: quoteReq, response: res })
      return { amountUsd: round2(toUsd(res.amount, res.currency)), source: 'PARTNER', transitDays: res.transitDays, validUntil: res.validUntil, detail: { partner: resolved.partner.name, adapter: resolved.adapter.id } }
    } catch (e) {
      await resolved.adapterCtx.log({ operation: 'QUOTE', direction: 'OUTBOUND', ok: false, durationMs: Date.now() - started, request: quoteReq, error: (e as Error).message })
      if (e instanceof AdapterError || e instanceof Error) throw new PartnerPricingUnavailable((e as Error).message)
      throw e
    }
  },
}

void DEFAULT_MAX_KG_PER_CONTAINER
