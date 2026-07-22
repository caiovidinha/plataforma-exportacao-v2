'use client'

import { Ship, Package, Star, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { cn, formatNumber } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Listing } from '@/types'

interface ListingCardProps {
  listing: Listing
  /** 'list' = card horizontal (gestão/exportador), 'grid' = tile vertical (vitrine de compras/importador) */
  variant?: 'list' | 'grid'
}

export function ListingCard({ listing, variant = 'list' }: ListingCardProps) {
  const t = useTranslations('vitrine')
  const statusLabel = {
    ATIVA: { label: t('statusAvailable'), cls: 'text-white bg-emerald-600 border-emerald-700' },
    VENDIDA: { label: t('statusSold'), cls: 'text-white bg-slate-500 border-slate-600' },
    EXPIRADA: { label: t('statusExpired'), cls: 'text-[#ede5dc] bg-[#3e2e1e] border-[#3e2e1e]' },
  }[listing.status]

  if (variant === 'grid') {
    return (
      <Link
        href={`/vitrine/${listing.id}`}
        className="flex flex-col bg-white border border-[#3e2e1e]/15 shadow-sm hover:shadow-lg hover:border-brand-400/50 transition-all duration-200 group overflow-hidden"
      >
        {/* Imagem */}
        <div className="relative w-full aspect-square overflow-hidden bg-dark-100">
          {listing.featured && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-brand-400 text-[#3e2e1e] text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 shadow">
              <Star className="w-2.5 h-2.5 fill-[#3e2e1e]" />
              {t('featuredBadge')}
            </div>
          )}
          <span className={cn('badge absolute top-2 right-2 z-10 text-[9px]', statusLabel.cls)}>
            {statusLabel.label}
          </span>
          {listing.product.images?.[0] ? (
            <img
              src={listing.product.images[0]}
              alt={listing.product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <h2 className="text-sm font-semibold text-[#3e2e1e] leading-snug line-clamp-2 min-h-[2.4em]">
            {listing.product.name}
          </h2>

          <p className="text-lg font-extrabold text-[#3e2e1e] leading-none">
            USD {listing.price_per_kg_usd.toFixed(2)}
            <span className="text-xs font-normal text-[#584531]/60">/kg</span>
          </p>

          <div className="flex items-center gap-1.5 text-[10px] text-[#584531]/70">
            <Ship className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">{listing.incoterm}</span>
            <span className="text-[#584531]/30">•</span>
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{listing.origin_port}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-auto pt-1.5 border-t border-[#3e2e1e]/10 text-[10px] text-[#584531]">
            <Star className="w-3 h-3 text-brand-400 fill-brand-400 flex-shrink-0" />
            <span className="font-medium">{listing.exporter.rating}</span>
            <span className="truncate">· {listing.exporter.company_name}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/vitrine/${listing.id}`}
      className="relative flex border border-[#3e2e1e]/20 bg-dark-50 shadow-md hover:border-[#3e2e1e]/40 hover:shadow-lg transition-all duration-200 group overflow-hidden"
    >
      {/* Left accent strip */}
      {listing.featured && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3e2e1e]" />}

      {/* Product image */}
      <div className={cn('relative w-60 flex-shrink-0 overflow-hidden', listing.featured && 'ml-1')}>
        {/* DESTAQUE badge - only for featured */}
        {listing.featured && (
          <div className="absolute top-3 left-0 z-10 flex items-center gap-1 bg-[#3e2e1e] text-[#ede5dc] text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 shadow-lg">
            <Star className="w-3 h-3 fill-white" />
            {t('featuredBadge')}
          </div>
        )}
        {listing.product.images?.[0] ? (
          <img
            src={listing.product.images[0]}
            alt={listing.product.name}
            className="w-full h-full object-cover"
            style={{ minHeight: '220px' }}
          />
        ) : (
          <div className="w-full flex items-center justify-center bg-dark-100" style={{ minHeight: '220px' }}>
            <Package className="w-16 h-16 text-slate-600" />
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-2.5">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-bold text-[#3e2e1e] group-hover:text-[#1c1208] transition-colors leading-snug">
            {listing.product.name}
          </h2>
          <span className={cn('badge flex-shrink-0', statusLabel.cls)}>
            {statusLabel.label}
          </span>
        </div>

        {/* Description */}
        {listing.product.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{listing.product.description}</p>
        )}

        {/* Price block */}
        <div className="flex items-end gap-6">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('pricePerKg')}</p>
            <p className="text-2xl font-extrabold text-[#3e2e1e] leading-none">
              USD {listing.price_per_kg_usd.toFixed(2)}
              <span className="text-sm font-normal text-slate-400">/kg</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('availableQty')}</p>
            <p className="text-sm font-semibold text-[#3e2e1e]">{formatNumber(listing.available_quantity_kg)} kg</p>
          </div>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 bg-dark-100 px-2.5 py-1 text-[11px] text-slate-300">
            <Ship className="w-3 h-3 text-slate-500" />
            {t('incotermLabel')} <strong className="text-slate-200">{listing.incoterm}</strong>
          </span>
          <span className="flex items-center gap-1 bg-dark-100 px-2.5 py-1 text-[11px] text-slate-300">
            <MapPin className="w-3 h-3 text-slate-500" />
            {listing.origin_port}
          </span>
          <span className="flex items-center gap-1 bg-dark-100 px-2.5 py-1 text-[11px] text-slate-300">
            <Calendar className="w-3 h-3 text-slate-500" />
            {listing.delivery_days} {t('deliveryDays')}
          </span>
        </div>

        {/* Destination ports */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t('featuredDestPorts')}</span>
          {listing.destination_ports.map(port => (
            <span key={port} className="badge text-[#584531] border-[#584531]/30 text-[10px]">{port}</span>
          ))}
        </div>

        {/* Footer: exporter + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
            <span className="text-xs font-semibold text-slate-300">{listing.exporter.rating}</span>
            <span className="text-slate-700">•</span>
            <span className="text-xs text-slate-500">{listing.exporter.company_name}</span>
            {listing.exporter.mapa_registered && (
              <span className="badge text-emerald-700 border-emerald-700/30 text-[10px]">MAPA ✓</span>
            )}
          </div>
          <span className="text-xs font-bold text-[#3e2e1e] group-hover:text-[#1c1208] transition-colors">
            {t('featuredViewOffer')}
          </span>
        </div>
      </div>
    </Link>
  )
}
