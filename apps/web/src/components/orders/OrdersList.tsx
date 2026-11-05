'use client'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import type { OrderDto } from '@amazon-trade/shared'
import { EmptyState, PageHeader, PageLoader, StatusBadge } from '@/components/ui/primitives'
import { fmtDate, fmtKg, fmtMoney } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'
import type { ShipmentViewer } from '@/components/shipments/ShipmentDetail'

const base = (v: ShipmentViewer) => (v === 'exporter' ? '/exporter/orders' : v === 'importer' ? '/store/orders' : '/admin/orders')

export function OrdersList({ viewer }: { viewer: ShipmentViewer }) {
  const t = useT()
  const locale = useIntlLocale()
  const { data, isLoading } = useGet<OrderDto[]>(viewer === 'admin' ? '/admin/orders' : '/orders')
  if (isLoading) return <PageLoader />
  return (
    <div>
      <PageHeader title={t('orders.title')} subtitle={t(viewer === 'exporter' ? 'orders.subtitle.exporter' : 'orders.subtitle.importer')} />
      {!data?.length ? (
        <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title={t('orders.empty')} description={t(viewer === 'exporter' ? 'orders.empty.exporter' : 'orders.empty.importer')} />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t('orders.number')}</th>
                <th>{t('orders.product')}</th>
                <th className="hidden md:table-cell">{viewer === 'exporter' ? t('orders.importer') : t('orders.exporter')}</th>
                <th className="hidden lg:table-cell text-right">{t('orders.quantity')}</th>
                <th className="text-right">{t('orders.total')}</th>
                <th>{t('common.status')}</th>
                <th className="hidden md:table-cell">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`${base(viewer)}/${o.id}`} className="font-medium text-brand-700 hover:underline">{o.number}</Link>
                  </td>
                  <td className="max-w-[16rem] truncate">{o.productName}</td>
                  <td className="hidden md:table-cell">{viewer === 'exporter' ? o.importer.name : o.exporter.name}</td>
                  <td className="hidden text-right tabular-nums lg:table-cell">{fmtKg(o.quantityKg, locale)}</td>
                  <td className="text-right tabular-nums">{fmtMoney(o.totalLandedUsd, 'USD', locale, 0)}</td>
                  <td><StatusBadge group="order" value={o.status} /></td>
                  <td className="hidden text-ink-500 md:table-cell">{fmtDate(o.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
