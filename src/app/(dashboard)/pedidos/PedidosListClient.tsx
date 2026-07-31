'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ClipboardList, CheckCircle2, Clock, XCircle, Ban } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useMockStore } from '@/lib/mock-store'
import type { Order, OrderStatus } from '@/types'

export function PedidosListClient({ initialOrders }: { initialOrders: Order[] }) {
  const t = useTranslations('pedidos')

  // Mesmo padrão do OrderBox: espelha cada pedido pelo store (que reflete
  // aceitar/recusar feito na tela de detalhe) e cai no valor vindo do
  // server component quando o pedido ainda não está no store.
  const getOrder = useMockStore((s) => s.getOrder)
  const orders = initialOrders.map((o) => getOrder(o.id) ?? o)

  const statusCfg: Record<OrderStatus, { label: string; cls: string; icon: React.ElementType }> = {
    AGUARDANDO_CONFIRMACAO: { label: t('statusAwaitingConfirmation'), cls: 'text-brand-400 bg-brand-400/10 border-brand-400/30', icon: Clock },
    CONFIRMADO:             { label: t('statusConfirmed'),           cls: 'text-emerald-700 bg-emerald-700/10 border-emerald-700/30', icon: CheckCircle2 },
    RECUSADO:               { label: t('statusRejected'),            cls: 'text-red-600 bg-red-600/10 border-red-600/30', icon: XCircle },
    CANCELADO:              { label: t('statusCancelled'),           cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30', icon: Ban },
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="page-title">{t('pageTitle')}</h1>

      <div className="space-y-3">
        {orders.map((o) => {
          const cfg = statusCfg[o.status]
          return (
            <Link key={o.id} href={`/pedidos/${o.id}`}
              className="card hover:border-[#3e2e1e]/30 transition-all flex gap-4 group">
              <div className="w-10 h-10 bg-[#584531]/15 border border-[#584531]/25 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 text-[#584531]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[#3e2e1e] group-hover:text-[#1c1208] truncate">
                    {o.product_name}
                  </span>
                  <span className={cn('badge flex-shrink-0 ml-2', cfg.cls)}>
                    <cfg.icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-[#584531]">
                  {o.exporter.company_name} → {o.importer.company_name}
                </p>
                <p className="text-xs text-[#584531]/60 mt-1">
                  {formatDate(o.created_at)} · {o.quantity_kg.toLocaleString()} kg · {o.incoterm}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-[#3e2e1e]">USD {o.price_per_kg_usd.toFixed(2)}/kg</p>
                <p className="text-xs text-[#584531]/60 mt-0.5">USD {o.total_usd.toLocaleString()}</p>
              </div>
            </Link>
          )
        })}

        {orders.length === 0 && (
          <div className="card text-center py-12">
            <ClipboardList className="w-10 h-10 mx-auto text-[#584531]/40 mb-2" />
            <p className="text-[#584531] text-sm">{t('noOrders')}</p>
            <Link href="/vitrine" className="btn-primary mx-auto mt-4">{t('exploreShowcase')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}
