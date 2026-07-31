'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMockSession } from '@/lib/mock-session'

// Só o exportador publica anúncios - importador só compra
export function NewListingButton() {
  const t = useTranslations('vitrine')
  const { entityType } = useMockSession()

  if (entityType !== 'exportador') return null

  return (
    <Link href="/vitrine/nova" className="btn-primary">
      <TrendingUp className="w-4 h-4" /> {t('newOffer')}
    </Link>
  )
}
