'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { GitBranch, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useMockStore } from '@/lib/mock-store'
import type { ExportWorkflow, WorkflowOverallStatus } from '@/types'

const statusVisual: Record<WorkflowOverallStatus, { icon: React.ElementType; cls: string }> = {
  EM_ANDAMENTO: { icon: Clock,        cls: 'text-brand-400 bg-brand-400/10 border-brand-400/30' },
  CONCLUIDO:    { icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-700/10 border-emerald-700/30' },
  ATRASADO:     { icon: AlertCircle,  cls: 'text-red-400 bg-red-400/10 border-red-400/30' },
  CANCELADO:    { icon: AlertCircle,  cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
}

export function WorkflowListClient({ initialWorkflows }: { initialWorkflows: ExportWorkflow[] }) {
  const t = useTranslations('workflow')

  // O store espelha o mesmo mock na primeira renderização (skipHydration),
  // então bate com o HTML do servidor; depois reflete tanto edições em
  // workflows existentes quanto workflows novos criados ao aceitar pedidos.
  const storeWorkflows = useMockStore((s) => s.workflows)
  const workflows = storeWorkflows.length > 0 ? storeWorkflows : initialWorkflows

  const statusLabels: Record<WorkflowOverallStatus, string> = {
    EM_ANDAMENTO: t('statusInProgress'),
    CONCLUIDO:    t('statusCompleted'),
    ATRASADO:     t('statusDelayed'),
    CANCELADO:    t('statusCancelled'),
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('logisticsTitle')}</h1>
          <p className="text-sm text-[#584531] mt-1">{t('exportCount', { count: workflows.length })}</p>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="card text-center py-16">
          <GitBranch className="w-12 h-12 mx-auto text-[#584531]/40 mb-3" />
          <p className="text-[#584531] mb-4">{t('noWorkflows')}</p>
          <Link href="/vitrine" className="btn-primary mx-auto">{t('findOffer')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => {
            const vis = statusVisual[w.overall_status]
            const label = statusLabels[w.overall_status]
            const concluded = w.stages.filter((s) => s.status === 'CONCLUIDO').length
            const pct = Math.round((concluded / w.stages.length) * 100)
            const currentStage = w.stages.find((s) => s.stage === w.current_stage)

            return (
              <Link key={w.id} href={`/workflow/${w.id}`}
                className="card hover:border-[#3e2e1e]/30 transition-all flex flex-col md:flex-row gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('badge', vis.cls)}>
                      <vis.icon className="w-3 h-3" /> {label}
                    </span>
                    <span className="badge text-brand-400 border-brand-400/30 bg-brand-400/10">{w.incoterm}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#3e2e1e] group-hover:text-[#1c1208] truncate">
                    {w.order.product_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {w.order.quantity_kg.toLocaleString('pt-BR')} kg •{' '}
                    {w.order.origin_port} → {w.order.destination_port}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('currentStep')} <strong className="text-slate-300">{currentStage?.title ?? '-'}</strong>
                  </p>
                </div>

                <div className="md:w-48 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>{t('stepsCount', { done: concluded, total: w.stages.length })}</span>
                    <span className="font-semibold text-slate-200">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[#dbcbba] overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-[#584531] to-emerald-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{t('estimated')} {formatDate(w.estimated_completion)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
