'use client'
import { Ship } from 'lucide-react'
import Link from 'next/link'
import { getStageDef, type ShipmentDto } from '@amazon-trade/shared'
import { EmptyState, PageHeader, PageLoader, ProgressBar, StatusBadge } from '@/components/ui/primitives'
import { fmtDate, fmtKg, portName } from '@/lib/format'
import { useIntlLocale, useL, useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'
import type { ShipmentViewer } from './ShipmentDetail'

const base = (v: ShipmentViewer) => (v === 'exporter' ? '/exporter/shipments' : v === 'importer' ? '/store/shipments' : '/admin/shipments')

export function ShipmentsList({ viewer }: { viewer: ShipmentViewer }) {
  const t = useT()
  const tl = useL()
  const locale = useIntlLocale()
  const { data, isLoading } = useGet<ShipmentDto[]>(viewer === 'admin' ? '/admin/shipments' : '/shipments')
  if (isLoading) return <PageLoader />
  return (
    <div>
      <PageHeader title={t('shipments.title')} subtitle={t('shipments.subtitle')} />
      {!data?.length ? (
        <EmptyState icon={<Ship className="h-8 w-8" />} title={t('shipments.empty')} description={t('shipments.empty.text')} />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t('shipments.number')}</th>
                <th>{t('orders.product')}</th>
                <th className="hidden lg:table-cell">{t('orders.route')}</th>
                <th className="hidden md:table-cell">{t('shipments.progress')}</th>
                <th>{t('common.status')}</th>
                <th className="hidden md:table-cell">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => {
                const def = getStageDef(s.stage)
                const done = s.tasks.filter((x) => x.status === 'DONE').length
                return (
                  <tr key={s.id}>
                    <td><Link href={`${base(viewer)}/${s.id}`} className="font-medium text-brand-700 hover:underline">{s.number}</Link></td>
                    <td className="max-w-[14rem]"><p className="truncate">{s.productName}</p><p className="text-xs text-ink-500">{fmtKg(s.quantityKg, locale)}</p></td>
                    <td className="hidden text-ink-600 lg:table-cell">{portName(s.originPort)} → {portName(s.destinationPort)}</td>
                    <td className="hidden w-52 md:table-cell">
                      <p className="mb-1 text-xs text-ink-600">{tl(def.title)}</p>
                      <ProgressBar value={s.status === 'COMPLETED' ? 100 : (done / Math.max(s.tasks.length, 1)) * 100} className="h-1.5" />
                    </td>
                    <td><StatusBadge group="shipment" value={s.status} /></td>
                    <td className="hidden text-ink-500 md:table-cell">{fmtDate(s.createdAt, locale)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
