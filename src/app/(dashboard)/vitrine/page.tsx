import { getOffers } from '@/lib/api'
import { Ship, Package, Star, MapPin, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cn, formatNumber } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import type { Offer } from '@/types'

export const metadata = { title: 'Vitrine de Ofertas' }

function OfferCard({ offer }: { offer: Offer }) {
  const t = useTranslations('vitrine')
  const statusLabel = {
    ATIVA: { label: t('statusAvailable'), cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    NEGOCIANDO: { label: t('statusNegotiating'), cls: 'text-brand-400 bg-brand-400/10 border-brand-400/30' },
    VENDIDA: { label: t('statusSold'), cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
    EXPIRADA: { label: t('statusExpired'), cls: 'text-red-400 bg-red-400/10 border-red-400/30' },
  }[offer.status]

  return (
    <Link href={`/vitrine/${offer.id}`} className="card hover:border-slate-600 transition-all hover:translate-y-[-2px] group block">
      {/* Imagem do produto */}
      <div className="w-full h-40 bg-dark-100 mb-4 overflow-hidden">
        {offer.product.images?.[0] ? (
          <img src={offer.product.images[0]} alt={offer.product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-600" />
          </div>
        )}
      </div>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white leading-tight">{offer.product.name}</h3>
        <span className={cn('badge flex-shrink-0', statusLabel.cls)}>{statusLabel.label}</span>
      </div>

      {/* Exporter */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs text-slate-500">{offer.exporter.company_name}</span>
        <span className="text-slate-700">•</span>
        <div className="flex items-center gap-0.5">
          <Star className="w-3 h-3 text-brand-400 fill-brand-400" />
          <span className="text-xs text-slate-400">{offer.exporter.rating}</span>
        </div>
        {!offer.exporter.mapa_registered && (
          <span className="text-xs text-amber-500 ml-1">{t('noMapa')}</span>
        )}
      </div>

      {/* Dados chave */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-dark-100 px-2.5 py-2">
          <p className="text-xs text-slate-500">{t('availableQty')}</p>
          <p className="text-sm font-semibold text-white">{formatNumber(offer.available_quantity_kg)} kg</p>
        </div>
        <div className="bg-dark-100 px-2.5 py-2">
          <p className="text-xs text-slate-500">{t('pricePerKg')}</p>
          <p className="text-sm font-semibold text-brand-300">USD {offer.price_per_kg_usd.toFixed(2)}</p>
        </div>
      </div>

      {/* Detalhes */}
      <div className="space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          <span>{offer.origin_port}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Ship className="w-3 h-3" />
          <span>{t('incotermLabel')} <strong className="text-slate-300">{offer.incoterm}</strong></span>
          <span className="ml-auto">{offer.delivery_days} {t('deliveryDays')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          <span>{t('harvest')} {offer.harvest_year}</span>
          <span className={cn('ml-auto badge', offer.sale_modality === 'SPOT'
            ? 'text-blue-400 border-blue-400/30'
            : 'text-violet-400 border-violet-400/30'
          )}>
            {offer.sale_modality === 'SPOT' ? t('spotLabel') : t('longTermLabel')}
          </span>
        </div>
      </div>
    </Link>
  )
}

function FeaturedOfferCard({ offer }: { offer: Offer }) {
  const t = useTranslations('vitrine')

  return (
    <Link
      href={`/vitrine/${offer.id}`}
      className="relative flex border border-amber-600/40 bg-dark-50 shadow-[0_0_28px_rgba(217,119,6,0.14)] hover:border-amber-500/60 hover:shadow-[0_0_40px_rgba(217,119,6,0.22)] transition-all duration-200 group overflow-hidden"
    >
      {/* Left gold accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 rounded-l-xl" />

      {/* Product image */}
      <div className="relative w-60 flex-shrink-0 ml-1 overflow-hidden">
        {/* DESTAQUE badge */}
        <div className="absolute top-3 left-0 z-10 flex items-center gap-1 bg-gradient-to-r from-amber-600 to-yellow-500 text-white text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-r-full shadow-lg">
          <Star className="w-3 h-3 fill-white" />
          {t('featuredBadge')}
        </div>
        {offer.product.images?.[0] ? (
          <img
            src={offer.product.images[0]}
            alt={offer.product.name}
            className="w-full h-full object-cover"
            style={{ minHeight: '200px' }}
          />
        ) : (
          <div className="w-full flex items-center justify-center bg-dark-100" style={{ minHeight: '200px' }}>
            <Package className="w-16 h-16 text-slate-600" />
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-2.5">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors leading-snug">
            {offer.product.name}
          </h2>
          <span className="badge flex-shrink-0 text-emerald-400 bg-emerald-400/10 border-emerald-400/30">
            {t('statusAvailable')}
          </span>
        </div>

        {/* Description */}
        {offer.product.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{offer.product.description}</p>
        )}

        {/* Price block */}
        <div className="flex items-end gap-6">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('pricePerKg')}</p>
            <p className="text-2xl font-extrabold text-amber-300 leading-none">
              USD {offer.price_per_kg_usd.toFixed(2)}
              <span className="text-sm font-normal text-slate-400">/kg</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('availableQty')}</p>
            <p className="text-sm font-semibold text-slate-200">{formatNumber(offer.available_quantity_kg)} kg</p>
          </div>
          <span className={cn('ml-auto badge self-start', offer.sale_modality === 'SPOT'
            ? 'text-blue-400 border-blue-400/30'
            : 'text-violet-400 border-violet-400/30'
          )}>
            {offer.sale_modality === 'SPOT' ? t('spotLabel') : t('longTermLabel')}
          </span>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 bg-dark-100 px-2.5 py-1 text-[11px] text-slate-300">
            <Ship className="w-3 h-3 text-slate-500" />
            {t('incotermLabel')} <strong className="text-slate-200">{offer.incoterm}</strong>
          </span>
          <span className="flex items-center gap-1 bg-dark-100 px-2.5 py-1 text-[11px] text-slate-300">
            <MapPin className="w-3 h-3 text-slate-500" />
            {offer.origin_port}
          </span>
          <span className="flex items-center gap-1 bg-dark-100 px-2.5 py-1 text-[11px] text-slate-300">
            <Calendar className="w-3 h-3 text-slate-500" />
            {offer.delivery_days} {t('deliveryDays')}
          </span>
        </div>

        {/* Destination ports */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t('featuredDestPorts')}</span>
          {offer.destination_ports.map(port => (
            <span key={port} className="badge text-sky-400 border-sky-400/30 text-[10px]">{port}</span>
          ))}
        </div>

        {/* Footer: exporter + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
            <span className="text-xs font-semibold text-slate-300">{offer.exporter.rating}</span>
            <span className="text-slate-700">•</span>
            <span className="text-xs text-slate-500">{offer.exporter.company_name}</span>
            {offer.exporter.mapa_registered && (
              <span className="badge text-emerald-400 border-emerald-400/30 text-[10px]">MAPA ✓</span>
            )}
          </div>
          <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
            {t('featuredViewOffer')}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function VitrinePage() {
  const { data: offers } = await getOffers()
  const t = await getTranslations('vitrine')
  const featuredOffers = offers.filter(o => o.featured)
  const regularOffers = offers.filter(o => !o.featured)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('pageTitle')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('offersCount', { count: offers.length })}</p>
        </div>
        <Link href="/vitrine/nova" className="btn-primary">
          <TrendingUp className="w-4 h-4" /> {t('newOffer')}
        </Link>
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap gap-3">
        <input className="input w-48" placeholder={t('searchPlaceholder')} />
        <select className="input w-36">
          <option value="">{t('filterIncoterm')}</option>
          <option value="FOB">FOB</option>
          <option value="CIF">CIF</option>
        </select>
        <select className="input w-40">
          <option value="">{t('filterOriginPort')}</option>
          <option value="belem">Porto de Belém</option>
          <option value="santos">Porto de Santos</option>
        </select>
        <select className="input w-36">
          <option value="">{t('filterHarvest')}</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>

      {/* Ofertas em Destaque */}
      {featuredOffers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200 tracking-wide">{t('featuredSection')}</h2>
          </div>
          <div className="space-y-4">
            {featuredOffers.map(offer => (
              <FeaturedOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>
      )}

      {/* Grid de ofertas regulares */}
      {regularOffers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {regularOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {offers.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">{t('noOffers')}</p>
        </div>
      )}
    </div>
  )
}
