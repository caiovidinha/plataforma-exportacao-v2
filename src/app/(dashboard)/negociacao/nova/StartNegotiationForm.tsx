'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { formatNumber } from '@/lib/utils'
import { Ship, MapPin, Package, Star, Loader2 } from 'lucide-react'
import type { Offer } from '@/types'

// Maps offer IDs to existing mock negotiations for demo purposes
const OFFER_TO_NEG: Record<string, string> = {
  off_001: 'neg_001',
}

export function StartNegotiationForm({ offer }: { offer: Offer }) {
  const t = useTranslations('negociacao')
  const router = useRouter()

  const [qty, setQty] = useState(offer.available_quantity_kg)
  const [destPort, setDestPort] = useState(offer.destination_ports[0] ?? '')
  const [payment, setPayment] = useState('30_70_bl')
  const [loading, setLoading] = useState(false)

  const total = qty * offer.price_per_kg_usd

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 800))
    const negId = OFFER_TO_NEG[offer.id]
    router.push(negId ? `/negociacao/${negId}` : '/negociacao')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Offer summary card */}
      <div className="card bg-dark-100/50 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('novaOfferSummary')}</h3>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 overflow-hidden bg-dark-100 flex-shrink-0">
            {offer.product.images?.[0] ? (
              <img src={offer.product.images[0]} alt={offer.product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 leading-snug">{offer.product.name}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <Star className="w-3 h-3 text-brand-400 fill-brand-400" />
              <span>{offer.exporter.rating}</span>
              <span className="text-slate-700">•</span>
              <span>{offer.exporter.company_name}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-brand-300 font-bold text-sm">USD {offer.price_per_kg_usd.toFixed(2)}/kg</span>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Ship className="w-3 h-3" /> {offer.incoterm}
              </span>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {offer.origin_port}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">{t('novaQtyLabel')}</label>
        <input
          type="number"
          className="input w-full"
          value={qty}
          min={1}
          max={offer.available_quantity_kg}
          step={100}
          onChange={(e) => setQty(Number(e.target.value))}
          required
        />
        <p className="text-xs text-slate-500">{t('novaQtyHint', { max: formatNumber(offer.available_quantity_kg) })}</p>
      </div>

      {/* Destination port */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">{t('novaDestLabel')}</label>
        <select
          className="input w-full"
          value={destPort}
          onChange={(e) => setDestPort(e.target.value)}
          required
        >
          <option value="" disabled>{t('novaPickDest')}</option>
          {offer.destination_ports.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Payment conditions */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">{t('novaPaymentLabel')}</label>
        <select
          className="input w-full"
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          required
        >
          <option value="" disabled>{t('novaPickPayment')}</option>
          <option value="30_70_bl">{t('novaPayment1')}</option>
          <option value="lc">{t('novaPayment2')}</option>
          <option value="tt">{t('novaPayment3')}</option>
        </select>
      </div>

      {/* Estimated total */}
      <div className="bg-brand-500/10 border border-brand-500/20 px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{t('novaTotalLabel')}</span>
        <span className="text-lg font-display font-bold text-white">
          USD {formatNumber(Math.round(total))}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          className="btn-ghost flex-1 justify-center"
          onClick={() => router.back()}
          disabled={loading}
        >
          {t('novaCancelBtn')}
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 justify-center"
          disabled={loading || qty <= 0 || !destPort}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('novaStarting')}
            </>
          ) : (
            t('novaConfirmBtn')
          )}
        </button>
      </div>
    </form>
  )
}
