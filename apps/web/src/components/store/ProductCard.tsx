'use client'
import { MapPin, PackageSearch } from 'lucide-react'
import Link from 'next/link'
import type { ProductDto } from '@amazon-trade/shared'
import { Badge } from '@/components/ui/primitives'
import { flag, fmtKg, fmtMoney, portName } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'

export function ProductCard({ p }: { p: ProductDto }) {
  const t = useT()
  const locale = useIntlLocale()
  return (
    <Link href={`/store/products/${p.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0].url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-ink-300"><PackageSearch className="h-10 w-10" /></div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-ink-700 shadow-sm">{p.harvestYear}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-ink-500">
          {flag(p.exporter.country)} {p.exporter.name}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink-900 group-hover:text-brand-700">{p.name}</h3>
        <p className="mt-2 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3 w-3" /> {portName(p.originPort)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {p.incoterms.map((i) => (
            <Badge key={i} tone="gray">{i}</Badge>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-xl font-semibold tabular-nums text-ink-900">
              {fmtMoney(p.basePriceUsdPerKg, 'USD', locale)}
              <span className="text-xs font-normal text-ink-500"> /kg</span>
            </p>
            <p className="text-[11px] text-ink-400">{t('store.priceFob')}</p>
          </div>
          <div className="text-right text-xs text-ink-500">
            <p>{t('store.moq')} {fmtKg(p.minOrderKg, locale)}</p>
            <p>{fmtKg(p.availableKg, locale)} {t('store.available')}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
