'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { TrendingUp } from 'lucide-react'
import { getExchangeRatesWithMeta } from '@/lib/api'
import { formatDateRelative } from '@/lib/utils'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY'] as const

export function ExchangeRateWidget() {
  const t = useTranslations('cambio')
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getExchangeRatesWithMeta().then(({ rates, updated_at }) => {
      if (!active) return
      setRates(rates)
      setUpdatedAt(updated_at)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-title flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#584531]" /> {t('title')}
        </h3>
        {updatedAt && <span className="text-xs text-[#584531]/50">{formatDateRelative(updatedAt)}</span>}
      </div>

      {!rates ? (
        <p className="text-xs text-[#584531]/60">{t('loading')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CURRENCIES.map((code) => (
            <div key={code} className="bg-[#f0e8de] px-3 py-2.5">
              <p className="text-xs text-[#584531]">{code} / BRL</p>
              <p className="text-base font-display font-bold text-[#3e2e1e]">
                R$ {rates[code].toFixed(rates[code] < 1 ? 3 : 2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
