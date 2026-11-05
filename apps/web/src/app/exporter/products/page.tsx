'use client'
import { Plus, PackageSearch } from 'lucide-react'
import Link from 'next/link'
import type { ProductDto } from '@amazon-trade/shared'
import { Button, EmptyState, PageHeader, PageLoader, StatusBadge } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { fmtKg, fmtMoney, portName } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'
import { useSession } from '@/lib/session'

export default function ProductsPage() {
  const t = useT()
  const locale = useIntlLocale()
  const approved = useSession().data?.company?.onboardingStatus === 'APPROVED'
  const { data, isLoading } = useGet<ProductDto[]>('/products/mine')
  const setStatus = useSend(({ id, status }: { id: string; status: string }) => api(`/products/${id}/status`, { method: 'PATCH', body: { status } }), { invalidate: ['/products', '/catalog', '/dashboard'] })
  if (isLoading) return <PageLoader />
  return (
    <div>
      <PageHeader title={t('nav.products')} subtitle={t('products.subtitle')} actions={<Link href="/exporter/products/new" className="btn-primary"><Plus className="h-4 w-4" /> {t('product.new')}</Link>} />
      {!approved && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('products.needsApproval')}</p>}
      {!data?.length ? (
        <EmptyState icon={<PackageSearch className="h-8 w-8" />} title={t('products.empty')} description={t('products.empty.text')} action={<Link href="/exporter/products/new" className="btn-primary">{t('product.new')}</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead>
              <tr><th>{t('product.name')}</th><th className="hidden md:table-cell">{t('product.originPort')}</th><th className="text-right">{t('product.price')}</th><th className="hidden text-right lg:table-cell">{t('product.available')}</th><th>{t('common.status')}</th><th /></tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images[0] ? <img src={p.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink-100 text-ink-400"><PackageSearch className="h-4 w-4" /></span>}
                      <div className="min-w-0">
                        <Link href={`/exporter/products/${p.id}`} className="block truncate font-medium text-brand-700 hover:underline">{p.name}</Link>
                        <p className="text-xs text-ink-500">NCM {p.ncm} · {t('product.harvest')} {p.harvestYear}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden text-ink-600 md:table-cell">{portName(p.originPort)}</td>
                  <td className="text-right tabular-nums">{fmtMoney(p.basePriceUsdPerKg, 'USD', locale)}<span className="text-xs text-ink-400">/kg</span></td>
                  <td className="hidden text-right tabular-nums lg:table-cell">{fmtKg(p.availableKg, locale)}</td>
                  <td><StatusBadge group="product" value={p.status} /></td>
                  <td className="text-right">
                    {p.status === 'PUBLISHED' ? (
                      <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: p.id, status: 'PAUSED' })}>{t('products.pause')}</Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled={!approved} onClick={() => setStatus.mutate({ id: p.id, status: 'PUBLISHED' })}>{t('products.publish')}</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
