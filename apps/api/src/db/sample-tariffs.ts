import type { TariffInput } from '@amazon-trade/shared'

/**
 * TARIFAS DE AMOSTRA — valores ilustrativos só para desenvolvimento/demonstração.
 * Devem ser substituídas pelas tabelas reais negociadas com cada parceiro (ver guia de integração).
 * Todas são gravadas com `isSample = true` e aparecem sinalizadas no backoffice e nos detalhes da simulação.
 */
const from = '2026-01-01'
const base = { validFrom: from, validTo: null, isSample: true } as const

const freight = (origin: string, dest: string, ct: '20DC' | '40DC' | '40HC', rate: number, days: number): TariffInput => ({
  ...base,
  service: 'FREIGHT_MARITIME',
  match: { originPort: origin, destinationPort: dest, containerType: ct },
  pricing: { ratePerContainer: rate, currency: 'USD', transitDays: days, surchargePerContainer: 180 },
  label: `Frete ${origin}→${dest} ${ct} (amostra)`,
})

export const SAMPLE_TARIFFS: TariffInput[] = [
  // frete marítimo
  freight('BRBEL', 'NLRTM', '40HC', 3200, 22),
  freight('BRBEL', 'DEHAM', '40HC', 3350, 24),
  freight('BRBEL', 'USMIA', '40HC', 2400, 12),
  freight('BRBEL', 'ESBCN', '40HC', 3000, 20),
  freight('BRSSZ', 'NLRTM', '40HC', 2800, 18),
  freight('BRSSZ', 'DEHAM', '40HC', 2950, 20),
  freight('BRSSZ', 'USNYC', '40HC', 3400, 20),
  freight('BRSSZ', 'CNSHA', '40HC', 3900, 32),
  freight('BRSSZ', 'AEJEA', '40HC', 3600, 28),
  freight('BRBEL', 'NLRTM', '20DC', 2300, 22),
  freight('BRSSZ', 'NLRTM', '20DC', 2000, 18),
  // seguro
  { ...base, service: 'INSURANCE', match: { coverage: 'ALL_RISKS' }, pricing: { ratePct: 0.35, minPremium: 150, currency: 'USD', insuredValueMarkupPct: 10 }, label: 'Seguro carga all risks (amostra)' },
  // câmbio
  { ...base, service: 'FX', match: { currency: 'USD' }, pricing: { spreadPct: 0.8, fixedFee: 35, currency: 'USD' }, label: 'Câmbio USD (amostra)' },
  // taxa da plataforma
  { ...base, service: 'PLATFORM_FEE', match: {}, pricing: { pct: 1, minFee: 100, currency: 'USD' }, label: 'Taxa de serviço (amostra)' },
  // estimativa de tributos de destino (indicativa)
  { ...base, service: 'IMPORT_CHARGES', match: { country: 'DE' }, pricing: { dutyPct: 4, vatPct: 7, otherPct: 0.5 }, label: 'Importação DE (amostra)' },
  { ...base, service: 'IMPORT_CHARGES', match: { country: 'NL' }, pricing: { dutyPct: 4, vatPct: 9, otherPct: 0.5 }, label: 'Importação NL (amostra)' },
  { ...base, service: 'IMPORT_CHARGES', match: { country: 'US' }, pricing: { dutyPct: 0, vatPct: 0, otherPct: 0.5 }, label: 'Importação US (amostra)' },
  // lado exportador (usados em estimativas de custo de origem e no guia)
  { ...base, service: 'FREIGHT_LAND', match: { originState: 'PA', destinationPort: 'BRBEL' }, pricing: { ratePerTon: 95, minCharge: 800, currency: 'BRL', transitDays: 2 }, label: 'Terrestre PA→Belém (amostra)' },
  { ...base, service: 'FREIGHT_LAND', match: { originState: 'AM', destinationPort: 'BRMAO' }, pricing: { ratePerTon: 60, minCharge: 600, currency: 'BRL', transitDays: 1 }, label: 'Terrestre AM→Manaus (amostra)' },
  { ...base, service: 'CUSTOMS_BROKER', match: { originPort: 'BRBEL' }, pricing: { fixedFee: 2800, pctOfValue: 0.2, currency: 'BRL' }, label: 'Despachante Belém (amostra)' },
  { ...base, service: 'CUSTOMS_BROKER', match: { originPort: 'BRSSZ' }, pricing: { fixedFee: 3200, pctOfValue: 0.2, currency: 'BRL' }, label: 'Despachante Santos (amostra)' },
  { ...base, service: 'ORIGIN_HANDLING', match: { originPort: 'BRBEL' }, pricing: { perContainer: 900, currency: 'BRL' }, label: 'Terminal/laudos Belém (amostra)' },
  { ...base, service: 'ORIGIN_HANDLING', match: { originPort: 'BRSSZ' }, pricing: { perContainer: 1100, currency: 'BRL' }, label: 'Terminal/laudos Santos (amostra)' },
]
