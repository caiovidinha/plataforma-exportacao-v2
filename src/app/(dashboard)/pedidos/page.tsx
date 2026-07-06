'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ClipboardList, Check, X, Loader2, GitBranch, PackageOpen } from 'lucide-react'
import { getOrders, confirmOrder, rejectOrder } from '@/lib/api'
import { useMockSession } from '@/lib/mock-session'
import { formatNumber } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const STATUS_STYLE: Record<OrderStatus, string> = {
  AGUARDANDO_CONFIRMACAO: 'text-amber-700 bg-amber-500/10 border-amber-500/30',
  CONFIRMADO: 'text-emerald-700 bg-emerald-700/10 border-emerald-700/25',
  RECUSADO: 'text-red-700 bg-red-500/10 border-red-500/25',
  EM_EXPORTACAO: 'text-[#3e2e1e] bg-[#584531]/10 border-[#584531]/25',
  CONCLUIDO: 'text-emerald-800 bg-emerald-700/10 border-emerald-700/25',
  CANCELADO: 'text-slate-500 bg-slate-400/10 border-slate-400/25',
}

export default function PedidosPage() {
  const t = useTranslations('pedidos')
  const { entityType } = useMockSession()
  const isExporter = entityType === 'exportador'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const statusLabel = useMemo(
    () => (s: OrderStatus) =>
      ({
        AGUARDANDO_CONFIRMACAO: t('statusAwaiting'),
        CONFIRMADO: t('statusConfirmed'),
        RECUSADO: t('statusRejected'),
        EM_EXPORTACAO: t('statusExporting'),
        CONCLUIDO: t('statusDone'),
        CANCELADO: t('statusCancelled'),
      })[s],
    [t],
  )

  async function handleAccept(order: Order) {
    setBusyId(order.id)
    try {
      const updated = await confirmOrder(order.id)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
      setBanner(t('confirmedToast'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(order: Order) {
    setBusyId(order.id)
    try {
      const updated = await rejectOrder(order.id)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
      setBanner(t('rejectedToast'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#584531]" /> {t('pageTitle')}
        </h1>
        <p className="text-sm text-[#584531] mt-1">
          {isExporter ? t('subtitleExporter') : t('subtitleImporter')}
        </p>
      </div>

      {banner && (
        <div className="bg-emerald-700/10 border border-emerald-700/25 text-emerald-800 text-sm px-4 py-2.5">
          {banner}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#584531] py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> …
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <PackageOpen className="w-8 h-8 text-[#584531]/50 mx-auto" />
          <p className="text-sm text-[#584531]">{t('empty')}</p>
          <Link href="/vitrine" className="btn-primary inline-flex">
            {t('exploreShowcase')}
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#584531]/70 border-b border-[#3e2e1e]/15">
                <th className="py-2.5 pr-4 font-medium">{t('colProduct')}</th>
                <th className="py-2.5 pr-4 font-medium">{t('colCounterparty')}</th>
                <th className="py-2.5 pr-4 font-medium text-right">{t('colQuantity')}</th>
                <th className="py-2.5 pr-4 font-medium text-right">{t('colTotal')}</th>
                <th className="py-2.5 pr-4 font-medium">{t('colStatus')}</th>
                <th className="py-2.5 font-medium text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const counterparty = isExporter ? o.importer : o.exporter
                const canAct = isExporter && o.status === 'AGUARDANDO_CONFIRMACAO'
                return (
                  <tr key={o.id} className="border-b border-[#3e2e1e]/8 last:border-0">
                    <td className="py-3 pr-4 text-[#3e2e1e] font-medium">{o.product_name}</td>
                    <td className="py-3 pr-4 text-[#584531]">
                      {counterparty.company_name}
                      <span className="text-[#584531]/50"> · {counterparty.country}</span>
                    </td>
                    <td className="py-3 pr-4 text-right text-[#3e2e1e]">{formatNumber(o.quantity_kg)} kg</td>
                    <td className="py-3 pr-4 text-right text-[#3e2e1e] font-medium">
                      USD {formatNumber(o.total_usd)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block border px-2 py-0.5 text-xs ${STATUS_STYLE[o.status]}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {canAct ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleAccept(o)}
                            disabled={busyId === o.id}
                            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-2.5 py-1.5 disabled:opacity-60"
                          >
                            {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {t('accept')}
                          </button>
                          <button
                            onClick={() => handleReject(o)}
                            disabled={busyId === o.id}
                            className="inline-flex items-center gap-1 border border-red-500/40 text-red-700 hover:bg-red-500/10 text-xs px-2.5 py-1.5 disabled:opacity-60"
                          >
                            <X className="w-3.5 h-3.5" />
                            {t('reject')}
                          </button>
                        </div>
                      ) : o.workflow_id ? (
                        <Link
                          href={`/workflow/${o.workflow_id}`}
                          className="inline-flex items-center gap-1 text-xs text-[#584531] hover:text-[#3e2e1e] underline-offset-2 hover:underline"
                        >
                          <GitBranch className="w-3.5 h-3.5" /> {t('viewWorkflow')}
                        </Link>
                      ) : (
                        <span className="text-[#584531]/40 text-xs">—</span>
                      )}
                    </td>
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
