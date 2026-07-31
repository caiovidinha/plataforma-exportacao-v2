'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, ClipboardList, Ship, Sparkles } from 'lucide-react'
import { getListings } from '@/lib/api'
import { ListingCard } from '@/components/vitrine/ListingCard'
import { ExchangeRateWidget } from '@/components/ui/ExchangeRateWidget'
import type { Listing } from '@/types'
import type { MockUser } from '@/mock/mock-users'

const CATEGORY_CHIPS = [
  { labelKey: 'chipFob', href: '/vitrine?incoterm=FOB' },
  { labelKey: 'chipCif', href: '/vitrine?incoterm=CIF' },
  { labelKey: 'chipSantos', href: '/vitrine?port=santos' },
  { labelKey: 'chipBelem', href: '/vitrine?port=belem' },
] as const

export function ImportadorHome({ user }: { user: MockUser }) {
  const t = useTranslations('importadorHome')
  const tStats = useTranslations('dashboard')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getListings().then(({ data }) => {
      if (active) {
        setListings(data.filter((l) => l.status === 'ATIVA').slice(0, 6))
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  return (
    <div className="space-y-8">
      {/* Banner - "quebra" o padding do wrapper para o fundo ir até a borda da tela */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 bg-[#584531] py-10">
        <div className="px-[12%] space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#ede5dc]/60">{t('eyebrow')}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#ede5dc]">
            {t('greeting', { name: user.name.split(' ')[0] })}
          </h1>
          <p className="text-sm text-[#ede5dc]/80 max-w-lg">{t('subtitle')}</p>
          <Link href="/vitrine" className="inline-flex items-center gap-2 bg-[#ede5dc] hover:bg-[#dbcbba] text-[#584531] px-5 py-2 text-sm font-semibold transition-colors">
            {t('ctaBrowse')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="p-6 space-y-8">
        {/* Atalho pedidos */}
        <Link href="/pedidos" className="card flex items-center gap-3 hover:border-[#3e2e1e]/30 transition-all">
          <ClipboardList className="w-5 h-5 text-[#584531]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#3e2e1e]">{t('myOrdersTitle')}</p>
            <p className="text-xs text-[#584531]">{t('myOrdersDesc')}</p>
          </div>
          <Ship className="w-4 h-4 text-[#584531]/40" />
        </Link>

        {/* Stats compactos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {user.stats.map((stat) => (
            <div key={stat.label} className="card text-center py-3">
              <p className="text-lg font-display font-bold text-[#3e2e1e]">{stat.value}</p>
              <p className="text-[11px] text-[#584531] mt-0.5">{tStats(`stats.${stat.label}` as never)}</p>
            </div>
          ))}
        </div>

        <ExchangeRateWidget />

        {/* Categorias / atalhos */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_CHIPS.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="px-3 py-1.5 text-xs font-medium bg-[#584531]/10 border border-[#584531]/25 text-[#584531] hover:bg-[#584531]/20 transition-colors"
            >
              {t(chip.labelKey)}
            </Link>
          ))}
        </div>

        {/* Anúncios em destaque */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#584531]" /> {t('featuredTitle')}
            </h2>
            <Link href="/vitrine" className="text-xs text-[#584531] hover:text-[#3e2e1e] underline-offset-2 hover:underline">
              {t('viewAll')}
            </Link>
          </div>

          {loading && <p className="text-sm text-[#584531]/60 py-6 text-center">{t('loading')}</p>}

          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} variant="grid" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
