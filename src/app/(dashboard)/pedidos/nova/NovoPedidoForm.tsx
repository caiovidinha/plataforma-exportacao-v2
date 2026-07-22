'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { formatNumber } from '@/lib/utils'
import { Ship, MapPin, Package, Star, Loader2 } from 'lucide-react'
import type { Listing } from '@/types'

// Mapeia anúncios para pedidos mockados já existentes, para fins de demo
const LISTING_TO_ORDER: Record<string, string> = {
  list_001: 'ord_001',
  list_002: 'ord_002',
  list_003: 'ord_003',
}

export function NovoPedidoForm({ listing }: { listing: Listing }) {
  const t = useTranslations('pedidos')
  const router = useRouter()

  const [qty, setQty] = useState(listing.available_quantity_kg)
  const [destPort, setDestPort] = useState(listing.destination_ports[0] ?? '')
  const [loading, setLoading] = useState(false)

  const total = qty * listing.price_per_kg_usd

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Simula o envio do pedido a preço fixo para confirmação do exportador
    await new Promise((r) => setTimeout(r, 800))
    const orderId = LISTING_TO_ORDER[listing.id]
    router.push(orderId ? `/pedidos/${orderId}` : '/pedidos')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Listing summary card */}
      <div className="card bg-white/40 space-y-3">
        <h3 className="text-xs font-semibold text-[#584531] uppercase tracking-wide">{t('novaListingSummary')}</h3>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 overflow-hidden bg-dark-100 flex-shrink-0">
            {listing.product.images?.[0] ? (
              <img src={listing.product.images[0]} alt={listing.product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#3e2e1e] leading-snug">{listing.product.name}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#584531]">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{listing.exporter.rating}</span>
              <span className="text-[#584531]/40">•</span>
              <span>{listing.exporter.company_name}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[#3e2e1e] font-bold text-sm">USD {listing.price_per_kg_usd.toFixed(2)}/kg</span>
              <span className="text-[#584531]/70 text-xs flex items-center gap-1">
                <Ship className="w-3 h-3" /> {listing.incoterm}
              </span>
              <span className="text-[#584531]/70 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {listing.origin_port}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-[#584531]/70 leading-relaxed">{t('novaFixedPriceNotice')}</p>
      </div>

      {/* Quantity */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#584531]">{t('novaQtyLabel')}</label>
        <input
          type="number"
          className="input w-full"
          value={qty}
          min={0}
          max={listing.available_quantity_kg}
          step={100}
          onChange={(e) => setQty(Number(e.target.value))}
          required
        />
        <p className="text-xs text-[#584531]/60">{t('novaQtyHint', { max: formatNumber(listing.available_quantity_kg) })}</p>
      </div>

      {/* Destination port */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#584531]">{t('novaDestLabel')}</label>
        <select
          className="input w-full"
          value={destPort}
          onChange={(e) => setDestPort(e.target.value)}
          required
        >
          <option value="" disabled>{t('novaPickDest')}</option>
          {listing.destination_ports.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Estimated total */}
      <div className="bg-[#584531]/10 border border-[#584531]/20 px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-[#584531]">{t('novaTotalLabel')}</span>
        <span className="text-lg font-display font-bold text-[#3e2e1e]">
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
              {t('novaSending')}
            </>
          ) : (
            t('novaConfirmBtn')
          )}
        </button>
      </div>
    </form>
  )
}
