import { getWorkflows } from '@/lib/api'
import { GitBranch, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import type { WorkflowOverallStatus } from '@/types'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Workflow Logístico' }

const statusVisual: Record<WorkflowOverallStatus, { icon: React.ElementType; cls: string }> = {
  EM_ANDAMENTO: { icon: Clock,        cls: 'text-brand-400 bg-brand-400/10 border-brand-400/30' },
  CONCLUIDO:    { icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  ATRASADO:     { icon: AlertCircle,  cls: 'text-red-400 bg-red-400/10 border-red-400/30' },
  CANCELADO:    { icon: AlertCircle,  cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
}

export default async function WorkflowPage() {
  const [workflows, t] = await Promise.all([getWorkflows(), getTranslations('workflow')])

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
          <p className="text-sm text-slate-400 mt-1">{t('exportCount', { count: workflows.length })}</p>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="card text-center py-16">
          <GitBranch className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 mb-4">{t('noWorkflows')}</p>
          <Link href="/vitrine" className="btn-primary mx-auto">{t('findOffer')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => {
            const vis = statusVisual[w.overall_status]
            const label = statusLabels[w.overall_status]
            const concluded = w.steps.filter((s) => s.status === 'CONCLUIDO').length
            const pct = Math.round((concluded / w.steps.length) * 100)
            const currentStep = w.steps.find((s) => s.code === w.current_step_code)

            return (
              <Link key={w.id} href={`/workflow/${w.id}`}
                className="card hover:border-slate-600 transition-all flex flex-col md:flex-row gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('badge', vis.cls)}>
                      <vis.icon className="w-3 h-3" /> {label}
                    </span>
                    <span className="badge text-brand-400 border-brand-400/30 bg-brand-400/10">{w.incoterm}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white truncate">
                    {w.negotiation.product_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {w.negotiation.quantity_kg.toLocaleString('pt-BR')} kg •{' '}
                    {w.negotiation.origin_port} → {w.negotiation.destination_port}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('currentStep')} <strong className="text-slate-300">{currentStep?.title ?? '-'}</strong>
                  </p>
                </div>

                <div className="md:w-48 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>{t('stepsCount', { done: concluded, total: w.steps.length })}</span>
                    <span className="font-semibold text-slate-200">{pct}%</span>
                  </div>
                  <div className="h-2 bg-dark-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
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
