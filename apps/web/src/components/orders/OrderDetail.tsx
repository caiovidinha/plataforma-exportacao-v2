'use client'
import { Check, FileSignature, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { OrderDto } from '@amazon-trade/shared'
import type { ShipmentViewer } from '@/components/shipments/ShipmentDetail'
import { ConfirmDialog } from '@/components/ui/overlay'
import { Alert, Button, Dl, PageHeader, PageLoader, Section, StatusBadge } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { fmtDate, fmtKg, portName } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'
import { SimulationBreakdown } from './SimulationBreakdown'

type OrderFull = OrderDto & { contract: { termsHash: string; importerAcceptedAt: string | null; exporterAcceptedAt: string | null } | null }

export function OrderDetail({ id, viewer }: { id: string; viewer: ShipmentViewer }) {
  const t = useT()
  const locale = useIntlLocale()
  const { data: order, isLoading } = useGet<OrderFull>(`/orders/${id}`)
  const [dialog, setDialog] = useState<'ACCEPT' | 'REJECT' | 'CANCEL' | null>(null)
  const done = () => setDialog(null)
  const invalidate = ['/orders', '/shipments', '/dashboard', '/notifications']
  const decide = useSend((v: { decision: 'ACCEPT' | 'REJECT'; reason?: string }) => api(`/orders/${id}/decision`, { method: 'POST', body: v }), {
    invalidate,
    onSuccess: (_r, v) => {
      toast.success(v.decision === 'ACCEPT' ? t('orders.accepted') : t('orders.rejected'))
      done()
    },
  })
  const cancel = useSend(() => api(`/orders/${id}/cancel`, { method: 'POST' }), { invalidate, onSuccess: done })
  if (isLoading || !order) return <PageLoader />

  const backHref = viewer === 'exporter' ? '/exporter/orders' : viewer === 'importer' ? '/store/orders' : '/admin/orders'
  const shipmentHref = order.shipmentId ? (viewer === 'exporter' ? `/exporter/shipments/${order.shipmentId}` : viewer === 'importer' ? `/store/shipments/${order.shipmentId}` : `/admin/shipments/${order.shipmentId}`) : null
  const pending = order.status === 'AWAITING_CONFIRMATION'

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.number} <StatusBadge group="order" value={order.status} />
          </span>
        }
        subtitle={order.productName}
        actions={
          <>
            <Link href={backHref} className="btn-ghost">← {t('common.back')}</Link>
            {shipmentHref && <Link href={shipmentHref} className="btn-primary">{t('orders.viewShipment')}</Link>}
            {pending && viewer === 'exporter' && (
              <>
                <Button variant="secondary" onClick={() => setDialog('REJECT')}><X className="h-4 w-4" /> {t('orders.reject')}</Button>
                <Button onClick={() => setDialog('ACCEPT')}><Check className="h-4 w-4" /> {t('orders.accept')}</Button>
              </>
            )}
            {pending && viewer === 'importer' && <Button variant="secondary" onClick={() => setDialog('CANCEL')}>{t('orders.cancel')}</Button>}
          </>
        }
      />

      {pending && viewer === 'exporter' && <Alert tone="info" title={t('orders.awaitingYou.title')}>{t('orders.awaitingYou.text')}</Alert>}
      {pending && viewer === 'importer' && <Alert tone="info">{t('orders.awaitingExporter')}</Alert>}
      {order.status === 'REJECTED' && <Alert tone="error" title={t('orders.rejectedTitle')}>{order.decisionReason}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title={t('orders.costBreakdown')}>
          <SimulationBreakdown result={order.result} />
        </Section>
        <div className="space-y-6">
          <Section title={t('orders.details')}>
            <Dl
              items={[
                { label: t('orders.exporter'), value: order.exporter.name },
                { label: t('orders.importer'), value: order.importer.name },
                { label: t('orders.quantity'), value: fmtKg(order.quantityKg, locale) },
                { label: 'Incoterm', value: order.incoterm },
                { label: t('orders.route'), value: `${portName(order.originPort)} → ${portName(order.destinationPort)}` },
                { label: t('orders.shipDate'), value: fmtDate(order.requestedShipDate, locale) },
                { label: t('common.date'), value: fmtDate(order.createdAt, locale, true) },
                { label: t('orders.notes'), value: order.importerNotes },
              ]}
            />
          </Section>
          {order.contract && (
            <Section title={t('orders.contract')} description={t('orders.contractHint')}>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-brand-600" /> {t('orders.contract.importer')}: {fmtDate(order.contract.importerAcceptedAt, locale, true)}</li>
                <li className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-brand-600" /> {t('orders.contract.exporter')}: {order.contract.exporterAcceptedAt ? fmtDate(order.contract.exporterAcceptedAt, locale, true) : t('orders.contract.pending')}</li>
              </ul>
              <p className="mt-3 break-all font-mono text-[11px] text-ink-400">SHA-256 {order.contract.termsHash}</p>
            </Section>
          )}
        </div>
      </div>

      <ConfirmDialog open={dialog === 'ACCEPT'} onClose={done} loading={decide.isPending} title={t('orders.accept.title')} description={t('orders.accept.text')} confirmLabel={t('orders.accept')} onConfirm={() => decide.mutate({ decision: 'ACCEPT' })} />
      <ConfirmDialog open={dialog === 'REJECT'} onClose={done} loading={decide.isPending} danger title={t('orders.reject.title')} confirmLabel={t('orders.reject')} reason={{ label: t('orders.reject.reason'), required: true }} onConfirm={(reason) => decide.mutate({ decision: 'REJECT', reason })} />
      <ConfirmDialog open={dialog === 'CANCEL'} onClose={done} loading={cancel.isPending} danger title={t('orders.cancel.title')} confirmLabel={t('orders.cancel')} onConfirm={() => cancel.mutate()} />
    </div>
  )
}
