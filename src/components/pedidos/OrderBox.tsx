'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'
import { Ship, MapPin, Package, CheckCircle2, XCircle, Clock, Ban, GitBranch } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'
import type { EntitySlug } from '@/lib/entity-config'

interface Props {
  order: Order
  entityType: EntitySlug
}

const STATUS_CFG: Record<OrderStatus, { icon: React.ElementType; cls: string; labelKey: string }> = {
  AGUARDANDO_CONFIRMACAO: { icon: Clock,        cls: 'text-brand-400 bg-brand-400/10 border-brand-400/30',       labelKey: 'statusAwaitingConfirmation' },
  CONFIRMADO:             { icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-700/10 border-emerald-700/30', labelKey: 'statusConfirmed' },
  RECUSADO:               { icon: XCircle,      cls: 'text-red-600 bg-red-600/10 border-red-600/30',            labelKey: 'statusRejected' },
  CANCELADO:              { icon: Ban,          cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30',      labelKey: 'statusCancelled' },
}

export function OrderBox({ order, entityType }: Props) {
  const t = useTranslations('pedidos')
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  const cfg = STATUS_CFG[status]
  const canDecide = entityType === 'exportador' && status === 'AGUARDANDO_CONFIRMACAO'

  async function handleDecision(decision: 'accept' | 'reject') {
    setLoading(decision)
    await new Promise((r) => setTimeout(r, 600))
    if (decision === 'accept') {
      setStatus('CONFIRMADO')
      toast.success(t('acceptToast'))
    } else {
      setStatus('RECUSADO')
      toast.error(t('rejectToast'))
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#584531] uppercase tracking-wide">{t('orderSummary')}</h3>
          <span className={cn('badge', cfg.cls)}>
            <cfg.icon className="w-3 h-3" /> {t(cfg.labelKey as 'statusAwaitingConfirmation')}
          </span>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-dark-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#3e2e1e] leading-snug">{order.product_name}</p>
            <p className="text-xs text-[#584531] mt-1">
              {order.exporter.company_name} → {order.importer.company_name}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[#3e2e1e] font-bold text-sm">USD {order.price_per_kg_usd.toFixed(2)}/kg</span>
              <span className="text-[#584531]/70 text-xs flex items-center gap-1">
                <Ship className="w-3 h-3" /> {order.incoterm}
              </span>
              <span className="text-[#584531]/70 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {order.origin_port} → {order.destination_port}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#3e2e1e]/10">
          <div>
            <p className="text-xs text-[#584531]/60">{t('qtyLabel')}</p>
            <p className="text-sm font-semibold text-[#3e2e1e]">{order.quantity_kg.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-xs text-[#584531]/60">{t('totalLabel')}</p>
            <p className="text-sm font-semibold text-[#3e2e1e]">USD {order.total_usd.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[#584531]/60">{t('createdLabel')}</p>
            <p className="text-sm text-[#3e2e1e]">{formatDate(order.created_at)}</p>
          </div>
          {order.confirmed_at && (
            <div>
              <p className="text-xs text-[#584531]/60">{t('confirmedLabel')}</p>
              <p className="text-sm text-[#3e2e1e]">{formatDate(order.confirmed_at)}</p>
            </div>
          )}
        </div>
      </div>

      {canDecide && (
        <div className="flex gap-3">
          <button
            className="btn-ghost flex-1 justify-center"
            disabled={loading !== null}
            onClick={() => handleDecision('reject')}
          >
            <XCircle className="w-4 h-4" /> {loading === 'reject' ? t('rejecting') : t('rejectBtn')}
          </button>
          <button
            className="btn-primary flex-1 justify-center"
            disabled={loading !== null}
            onClick={() => handleDecision('accept')}
          >
            <CheckCircle2 className="w-4 h-4" /> {loading === 'accept' ? t('accepting') : t('acceptBtn')}
          </button>
        </div>
      )}

      {status === 'CONFIRMADO' && (
        <Link href="/workflow" className="card flex items-center gap-3 hover:border-[#3e2e1e]/30 transition-all">
          <GitBranch className="w-5 h-5 text-[#584531]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#3e2e1e]">{t('workflowStartedTitle')}</p>
            <p className="text-xs text-[#584531]">{t('workflowStartedDesc')}</p>
          </div>
        </Link>
      )}
    </div>
  )
}
