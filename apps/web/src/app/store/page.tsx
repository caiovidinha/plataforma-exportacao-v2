'use client'
import { PackageSearch, ShieldCheck, Ship, Calculator } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { INCOTERMS, ORIGIN_PORTS, type PageResult, type ProductDto } from '@amazon-trade/shared'
import { ProductCard } from '@/components/store/ProductCard'
import { Select } from '@/components/ui/form'
import { Button, EmptyState, PageLoader } from '@/components/ui/primitives'
import { useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'

function Catalog() {
  const t = useT()
  const router = useRouter()
  const params = useSearchParams()
  const q = params.get('q') ?? ''
  const originPort = params.get('originPort') ?? ''
  const incoterm = params.get('incoterm') ?? ''
  const page = Number(params.get('page') ?? 1)
  const { data, isLoading } = useGet<PageResult<ProductDto>>('/catalog', { query: { q, originPort, incoterm, page, pageSize: 12 } })

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString())
    if (v) next.set(k, v)
    else next.delete(k)
    if (k !== 'page') next.delete('page')
    router.replace(`/store?${next.toString()}`)
  }
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <>
      {/* banner de ponta a ponta */}
      <section className="relative isolate overflow-hidden bg-brand-900 text-white">
        <Image src="/img/hero-background.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-50 mix-blend-luminosity" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/95 via-brand-900/80 to-brand-700/30" />
        <div className="store-gutter py-12 sm:py-16">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{t('store.hero.title')}</h1>
          <p className="mt-3 max-w-xl text-brand-50/85">{t('store.hero.subtitle')}</p>
          <ul className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-50/90">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-200" /> {t('store.hero.i1')}</li>
            <li className="flex items-center gap-2"><Calculator className="h-4 w-4 text-brand-200" /> {t('store.hero.i2')}</li>
            <li className="flex items-center gap-2"><Ship className="h-4 w-4 text-brand-200" /> {t('store.hero.i3')}</li>
          </ul>
        </div>
      </section>

      <div className="store-gutter py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink-900">{q ? t('store.results', { q }) : t('store.catalog')}</h2>
            {data && <p className="mt-0.5 text-sm text-ink-500">{t('store.count', { n: data.total })}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <Select className="w-52" placeholder={t('store.filter.port')} value={originPort} onChange={(e) => setParam('originPort', e.target.value)} options={ORIGIN_PORTS.map((p) => ({ value: p.code, label: p.name }))} />
            <Select className="w-40" placeholder={t('store.filter.incoterm')} value={incoterm} onChange={(e) => setParam('incoterm', e.target.value)} options={INCOTERMS.map((i) => ({ value: i, label: i }))} />
            {(q || originPort || incoterm) && <Button variant="ghost" onClick={() => router.replace('/store')}>{t('store.clear')}</Button>}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : !data?.items.length ? (
          <EmptyState icon={<PackageSearch className="h-8 w-8" />} title={t('store.empty')} description={t('store.empty.text')} />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {data.items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
            {pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>← {t('common.back')}</Button>
                <span className="text-sm text-ink-600">{page} / {pages}</span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setParam('page', String(page + 1))}>{t('common.next')} →</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default function StoreHome() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Catalog />
    </Suspense>
  )
}
