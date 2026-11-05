'use client'
import { AlertTriangle, Info } from 'lucide-react'
import type { SimulationResult } from '@amazon-trade/shared'
import { Badge } from '@/components/ui/primitives'
import { fmtDate, fmtMoney, portName } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'

/** Decomposição transparente do custo: cada linha mostra de onde veio o preço (tabela, API do parceiro ou sistema). */
export function SimulationBreakdown({ result, compact, narrow }: { result: SimulationResult; compact?: boolean; narrow?: boolean }) {
  const t = useT()
  const locale = useIntlLocale()
  const usd = (v: number) => fmtMoney(v, 'USD', locale)
  const anySample = result.lines.some((l) => (l.detail as { sample?: boolean } | undefined)?.sample)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-ink-200">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t('sim.item')}</th>
              <th className={narrow ? 'hidden' : 'hidden sm:table-cell'}>{t('sim.source')}</th>
              <th className="text-right">{t('sim.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((l) => {
              const sample = (l.detail as { sample?: boolean } | undefined)?.sample
              return (
                <tr key={l.code}>
                  <td>
                    <p className="font-medium text-ink-900">{l.label}</p>
                    <p className="text-xs text-ink-500">
                      {l.includedInInvoice ? t('sim.inInvoice') : t('sim.extraCost')}
                      {l.service === 'FREIGHT_MARITIME' && ` · ${result.containers}× ${result.containerType}`}
                    </p>
                    {l.warning && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {l.warning}
                      </p>
                    )}
                    <div className={narrow ? 'mt-1 flex flex-wrap gap-1' : 'mt-1 flex flex-wrap gap-1 sm:hidden'}>
                      <Badge tone={l.source === 'PARTNER' ? 'blue' : l.source === 'SYSTEM' ? 'gray' : 'brand'}>{t(`sim.src.${l.source}` as never)}</Badge>
                      {l.fallbackUsed && <Badge tone="amber">{t('sim.fallback')}</Badge>}
                      {sample && <Badge tone="amber">{t('sim.sample')}</Badge>}
                    </div>
                  </td>
                  <td className={narrow ? 'hidden' : 'hidden sm:table-cell'}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={l.source === 'PARTNER' ? 'blue' : l.source === 'SYSTEM' ? 'gray' : 'brand'}>{t(`sim.src.${l.source}` as never)}</Badge>
                      {l.fallbackUsed && <Badge tone="amber">{t('sim.fallback')}</Badge>}
                      {sample && <Badge tone="amber">{t('sim.sample')}</Badge>}
                    </div>
                  </td>
                  <td className="text-right font-medium tabular-nums text-ink-900">{usd(l.amountUsd)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink-200 bg-ink-50 text-sm">
              <td colSpan={narrow ? 1 : 2} className="px-4 py-2.5 text-ink-600">{t('sim.invoice')}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{usd(result.invoiceValueUsd)}</td>
            </tr>
            <tr className="bg-ink-50 text-sm">
              <td colSpan={narrow ? 1 : 2} className="px-4 py-2.5 text-ink-600">{t('sim.extra')}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{usd(result.extraCostsUsd)}</td>
            </tr>
            <tr className="bg-brand-50">
              <td colSpan={narrow ? 1 : 2} className="px-4 py-3 font-semibold text-brand-900">{t('sim.total')}</td>
              <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-brand-900">{usd(result.totalLandedUsd)}</td>
            </tr>
            {result.currency !== 'USD' && (
              <tr className="bg-brand-50">
                <td colSpan={narrow ? 1 : 2} className="px-4 pb-3 text-xs text-brand-800">{t('sim.inCurrency', { currency: result.currency, rate: result.fxRateUsed.toFixed(4) })}</td>
                <td className="px-4 pb-3 text-right text-sm font-semibold tabular-nums text-brand-900">{fmtMoney(result.totalInCurrency, result.currency, locale)}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      {!compact && (
        <div className="space-y-2 text-xs text-ink-500">
          <p>
            {result.transitDays != null && <>{t('sim.transit', { days: result.transitDays })} · </>}
            {portName(result.originPort)} → {portName(result.destinationPort)} · {t('sim.validUntil', { date: fmtDate(result.validUntil, locale) })}
          </p>
          {anySample && (
            <p className="flex items-start gap-1.5 text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t('sim.sampleWarning')}
            </p>
          )}
          <p className="flex items-start gap-1.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}
