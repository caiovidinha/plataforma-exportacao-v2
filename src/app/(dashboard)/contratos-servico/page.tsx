'use client'

import { useMockSession } from '@/lib/mock-session'
import { useTranslations } from 'next-intl'
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Package,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONTRATADO: 'Contratado',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

const STATUS_STYLES: Record<string, string> = {
  PENDENTE: 'text-amber-400 bg-amber-400/10 border border-amber-400/30',
  CONTRATADO: 'text-blue-400 bg-blue-400/10 border border-blue-400/30',
  EM_ANDAMENTO: 'text-blue-400 bg-blue-400/10 border border-blue-400/30',
  CONCLUIDO: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30',
  CANCELADO: 'text-slate-400 bg-slate-400/10 border border-slate-400/30',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'CONTRATADO') return <Clock className="w-3.5 h-3.5 text-blue-400" />
  if (status === 'CONCLUIDO') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  if (status === 'CANCELADO') return <XCircle className="w-3.5 h-3.5 text-slate-500" />
  return <Clock className="w-3.5 h-3.5 text-amber-400" />
}

export default function ContratosServicoPage() {
  const { user } = useMockSession()
  const t = useTranslations('contracts')
  const contracts = user.service_contracts ?? []

  const pendentes = contracts.filter((c) => c.status === 'PENDENTE')
  const contratados = contracts.filter((c) => c.status === 'CONTRATADO' || c.status === 'EM_ANDAMENTO')
  const historico = contracts.filter((c) => c.status === 'CONCLUIDO' || c.status === 'CANCELADO')

  const total = contracts.reduce((acc, c) => acc + c.value_brl, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{t('totalPortfolio')}</p>
          <p className="text-xl font-display font-bold text-emerald-400">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: `${pendentes.length} ${t('PENDENTE')}`,  count: pendentes.length,  color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
          { label: t('activeCount', { count: contratados.length }), count: contratados.length, color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
          { label: `${historico.filter(c=>c.status==='CONCLUIDO').length} ${t('CONCLUIDO')}`, count: historico.filter(c=>c.status==='CONCLUIDO').length, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
        ].map(({ label, count, color }) => (
          <span key={label} className={cn('border rounded-full px-3 py-1 text-xs font-medium', color)}>
            {count} {label}
          </span>
        ))}
      </div>

      {/* Pending section */}
      {pendentes.length > 0 && (
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            {t('awaitingConfirmation')}
          </h2>
          <div className="space-y-3">
            {pendentes.map((c) => (
              <div key={c.id} className="card border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{c.service_type ?? c.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t('requester', { name: c.requester_name ?? c.exporter })}</p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" /> {c.product_name ?? c.importer}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          R$ {c.value_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="btn-secondary text-xs py-1.5 px-3 border-red-500/40 text-red-400 hover:bg-red-400/10">
                      {t('reject')}
                    </button>
                    <button className="btn-primary text-xs py-1.5 px-3">
                      {t('accept')}
                    </button>
                  </div>
                </div>
                {c.workflow_id && (
                  <div className="mt-3 pt-3 border-t border-amber-500/10">
                    <Link href={`/workflow/${c.workflow_id}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
                      {t('viewWorkflow')} #{c.workflow_id} <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active contracts */}
      {contratados.length > 0 && (
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            {t('activeContracts')}
          </h2>
          <div className="space-y-2">
            {contratados.map((c) => (
              <div key={c.id} className="card hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon status={c.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200">{c.service_type ?? c.description}</p>
                      <p className="text-xs text-slate-500">{c.requester_name ?? c.exporter} · {c.product_name ?? c.importer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs font-medium text-emerald-400">
                      R$ {c.value_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_STYLES[c.status])}>
                      {STATUS_LABELS[c.status]}
                    </span>
                    {c.workflow_id && (
                      <Link href={`/workflow/${c.workflow_id}`}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                        Workflow <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {historico.length > 0 && (
        <section>
          <h2 className="section-title mb-3 text-slate-500">{t('history')}</h2>
          <div className="space-y-2">
            {historico.map((c) => (
              <div key={c.id} className="card opacity-60 hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon status={c.status} />
                    <div>
                      <p className="text-sm text-slate-300">{c.service_type ?? c.description}</p>
                      <p className="text-xs text-slate-500">{c.requester_name ?? c.exporter} · {c.product_name ?? c.importer}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_STYLES[c.status])}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {contracts.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">{t('noContracts')}</p>
          <p className="text-xs text-slate-500 mt-1">
            {t('noContractsDesc')}
          </p>
          <Link href="/servicos" className="btn-primary inline-flex mt-4 text-sm">
            {t('viewMarketplace')}
          </Link>
        </div>
      )}
    </div>
  )
}
