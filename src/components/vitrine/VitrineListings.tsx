'use client'

import { Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMockSession } from '@/lib/mock-session'
import { ListingCard } from '@/components/vitrine/ListingCard'
import type { Listing } from '@/types'

// Importador navega a vitrine como uma loja (grid de produtos);
// exportador vê a lista de gestão (cards horizontais) que já existia.
export function VitrineListings({ listings }: { listings: Listing[] }) {
  const t = useTranslations('vitrine')
  const { entityType } = useMockSession()
  const isImportador = entityType === 'importador'

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-slate-400">{t('noOffers')}</p>
      </div>
    )
  }

  if (isImportador) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} variant="grid" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} variant="list" />
      ))}
    </div>
  )
}
