'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { formatNumber } from '@/lib/utils'
import { simulateOrder } from '@/lib/api'
import { useMockStore } from '@/lib/mock-store'
import { Ship, MapPin, Package, Star, Loader2, ArrowLeft, ShieldCheck, Clock3 } from 'lucide-react'
import type { Listing, OrderSimulation } from '@/types'

// Mapeia anúncios para pedidos mockados já existentes, para fins de demo
const LISTING_TO_ORDER: Record<string, string> = {
  list_001: 'ord_001',
  list_002: 'ord_002',
  list_003: 'ord_003',
}

export function NovoPedidoForm({ listing }: { listing: Listing }) {
  const t = useTranslations('pedidos')
  const router = useRouter()
  const attachSimulation = useMockStore((s) => s.attachSimulation)

  const [step, setStep] = useState<'form' | 'simulacao'>('form')
  const [qty, setQty] = useState(listing.available_quantity_kg)
  const [destPort, setDestPort] = useState(listing.destination_ports[0] ?? '')
  const [loadingSim, setLoadingSim] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [simulation, setSimulation] = useState<OrderSimulation | null>(null)

  const total = qty * listing.price_per_kg_usd

  async function handleGoToSimulation(e: React.FormEvent) {
    e.preventDefault()
    setLoadingSim(true)
    // Frete e seguro são designados automaticamente pela plataforma entre
    // os parceiros fixos (Cia de Navegação / Seguradora) - não há escolha
    // do comprador aqui.
    const sim = await simulateOrder(listing, qty)
    setSimulation(sim)
    setLoadingSim(false)
    setStep('simulacao')
  }

  const insuranceUsd = simulation ? simulation.insurance.premium_brl / simulation.exchange_rate : 0
  const totalEstimated = simulation ? simulation.product_usd + simulation.freight.price_usd + insuranceUsd : total

  async function handleConfirm() {
    if (!simulation) return
    setConfirming(true)
    await new Promise((r) => setTimeout(r, 800))

    const orderId = LISTING_TO_ORDER[listing.id]
    if (orderId) {
      attachSimulation(orderId, {
        carrier_name: simulation.freight.carrier_name,
        transit_days: simulation.freight.transit_days,
        freight_usd: simulation.freight.price_usd,
        insurer_name: simulation.insurance.insurer_name,
        insurance_type: simulation.insurance.type,
        insurance_premium_brl: simulation.insurance.premium_brl,
        exchange_rate: simulation.exchange_rate,
        total_usd: Math.round(totalEstimated),
      })
    }

    router.push(orderId ? `/pedidos/${orderId}` : '/pedidos')
  }

  // ---- Passo 2: Simulação de compra (frete + seguro + câmbio) ----
  if (step === 'simulacao' && simulation) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setStep('form')} className="btn-ghost text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('novaBackToForm')}
        </button>

        <div>
          <h3 className="text-sm font-semibold text-[#3e2e1e]">{t('simTitle')}</h3>
          <p className="text-xs text-[#584531] mt-0.5">{t('simSubtitle')}</p>
        </div>

        {/* Frete - designado automaticamente pela Cia de Navegação parceira */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#584531] uppercase tracking-wide">{t('simFreightTitle')}</p>
          <div className="w-full flex items-center gap-3 border border-[#3e2e1e]/15 bg-white/40 px-3 py-2.5">
            <Ship className="w-4 h-4 text-[#584531]/60 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3e2e1e]">{simulation.freight.carrier_name}</p>
              <p className="text-xs text-[#584531]/70 flex items-center gap-1">
                <Clock3 className="w-3 h-3" /> {t('simTransitDays', { days: simulation.freight.transit_days })}
              </p>
            </div>
            <span className="text-sm font-bold text-[#3e2e1e] flex-shrink-0">
              USD {formatNumber(simulation.freight.price_usd)}
            </span>
          </div>
        </div>

        {/* Seguro - designado automaticamente pela Seguradora parceira */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#584531] uppercase tracking-wide">{t('simInsuranceTitle')}</p>
          <div className="w-full flex items-center gap-3 border border-[#3e2e1e]/15 bg-white/40 px-3 py-2.5">
            <ShieldCheck className="w-4 h-4 text-[#584531]/60 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3e2e1e]">{simulation.insurance.insurer_name}</p>
              <p className="text-xs text-[#584531]/70">
                {t('simCoverage', { value: formatNumber(simulation.insurance.coverage_usd) })}
              </p>
            </div>
            <span className="text-sm font-bold text-[#3e2e1e] flex-shrink-0">
              R$ {formatNumber(simulation.insurance.premium_brl)}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#584531]/60 italic">{t('simAutoAssignedNote')}</p>

        {/* Breakdown de custos */}
        <div className="bg-[#584531]/10 border border-[#584531]/20 px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-[#584531] uppercase tracking-wide mb-1">{t('simBreakdownTitle')}</p>
          <div className="flex justify-between text-xs">
            <span className="text-[#584531]">{t('simProductLabel')}</span>
            <span className="text-[#3e2e1e] font-medium">USD {formatNumber(Math.round(simulation.product_usd))}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#584531]">{t('simFreightLabel')}</span>
            <span className="text-[#3e2e1e] font-medium">USD {formatNumber(simulation.freight.price_usd)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#584531]">{t('simInsuranceLabel')}</span>
            <span className="text-[#3e2e1e] font-medium">
              R$ {formatNumber(simulation.insurance.premium_brl)} (≈ USD {formatNumber(Math.round(insuranceUsd))})
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#584531]">{t('simExchangeRateLabel')}</span>
            <span className="text-[#3e2e1e] font-medium">R$ {simulation.exchange_rate.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 mt-1 border-t border-[#3e2e1e]/15">
            <span className="text-xs text-[#584531]">{t('simTotalLabel')}</span>
            <span className="text-lg font-display font-bold text-[#3e2e1e]">
              USD {formatNumber(Math.round(totalEstimated))}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            className="btn-ghost flex-1 justify-center"
            onClick={() => setStep('form')}
            disabled={confirming}
          >
            {t('novaCancelBtn')}
          </button>
          <button
            type="button"
            className="btn-primary flex-1 justify-center"
            onClick={handleConfirm}
            disabled={confirming || !simulation}
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('novaSending')}
              </>
            ) : (
              t('simConfirmBtn')
            )}
          </button>
        </div>
      </div>
    )
  }

  // ---- Passo 1: Quantidade e porto de destino ----
  return (
    <form onSubmit={handleGoToSimulation} className="space-y-5">
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

      {/* Estimated total (produto apenas - frete e seguro definidos na simulação) */}
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
          disabled={loadingSim}
        >
          {t('novaCancelBtn')}
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 justify-center"
          disabled={loadingSim || qty <= 0 || !destPort}
        >
          {loadingSim ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('novaSending')}
            </>
          ) : (
            t('novaNextBtn')
          )}
        </button>
      </div>
    </form>
  )
}
