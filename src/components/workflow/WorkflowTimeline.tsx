'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  CalendarDays,
  User,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { cn, formatDate, stepStatusColors, stepStatusLabel, documentTypeLabel } from '@/lib/utils'
import type { ExportWorkflow, WorkflowStep, WorkflowStepStatus } from '@/types'

// ---- Ícone por status ------------------------------------------
function StepIcon({ status, size = 'md' }: { status: WorkflowStepStatus; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  if (status === 'CONCLUIDO') return <CheckCircle2 className={cn(cls, 'text-emerald-400')} />
  if (status === 'EM_ANDAMENTO') return <Clock className={cn(cls, 'text-brand-400 animate-pulse-slow')} />
  if (status === 'ATRASADO') return <AlertCircle className={cn(cls, 'text-red-400')} />
  if (status === 'BLOQUEADO') return <XCircle className={cn(cls, 'text-orange-400')} />
  return <div className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', 'rounded-full border-2 border-slate-600')} />
}

// ---- Badge de status -------------------------------------------
function StatusBadge({ status }: { status: WorkflowStepStatus }) {
  return (
    <span className={cn('badge', stepStatusColors[status])}>
      <StepIcon status={status} size="sm" />
      {stepStatusLabel[status]}
    </span>
  )
}

// ---- Linha de data prevista vs realizada -----------------------
function DateRow({ label, planned, actual, late }: { label: string; planned: string; actual?: string; late?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-slate-400">{formatDate(planned)}</span>
        {actual ? (
          <span className={cn('font-medium', late ? 'text-red-400' : 'text-emerald-400')}>
            {formatDate(actual)} {late && '(atraso)'}
          </span>
        ) : (
          <span className="text-slate-600 italic">—</span>
        )}
      </div>
    </div>
  )
}

// ---- Linha de documento ----------------------------------------
function DocumentRow({ doc }: { doc: ExportWorkflow['steps'][0]['documents'][0] }) {
  const statusClass = {
    PENDENTE: 'text-slate-400',
    EMITIDO: 'text-brand-400',
    ASSINADO: 'text-violet-400',
    APROVADO: 'text-emerald-400',
    REJEITADO: 'text-red-400',
  }[doc.status]

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-dark-100 group">
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-300">{documentTypeLabel[doc.type] ?? doc.type}</span>
        <span className="text-xs text-slate-500">— {doc.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-medium', statusClass)}>{doc.status}</span>
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Download className="w-3.5 h-3.5 text-slate-400 hover:text-brand-400" />
          </a>
        )}
      </div>
    </div>
  )
}

// ---- Card de cada etapa ----------------------------------------
function WorkflowStepCard({
  step,
  index,
  isLast,
  isCurrent,
}: {
  step: WorkflowStep
  index: number
  isLast: boolean
  isCurrent: boolean
}) {
  const [expanded, setExpanded] = useState(
    step.status === 'EM_ANDAMENTO' || step.status === 'ATRASADO' || step.status === 'BLOQUEADO',
  )

  const late = !!(step.actual_date && step.planned_date && step.actual_date > step.planned_date)

  return (
    <div className="flex gap-4">
      {/* Linha vertical + ícone */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 relative',
            step.status === 'CONCLUIDO' && 'bg-emerald-500/10 border-emerald-400',
            step.status === 'EM_ANDAMENTO' && 'bg-brand-500/10 border-brand-400',
            step.status === 'ATRASADO' && 'bg-red-500/10 border-red-400',
            step.status === 'BLOQUEADO' && 'bg-orange-500/10 border-orange-400',
            step.status === 'PENDENTE' && 'bg-slate-800 border-slate-600',
            isCurrent && 'ring-2 ring-offset-2 ring-offset-dark ring-brand-500/50',
          )}
        >
          <span className="text-xs font-bold text-slate-300">{index + 1}</span>
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 mt-0.5',
              step.status === 'CONCLUIDO' ? 'bg-emerald-500/40' : 'bg-slate-700/60',
            )}
          />
        )}
      </div>

      {/* Conteúdo */}
      <div className={cn('flex-1 mb-4 rounded-xl border transition-colors',
        isCurrent
          ? 'border-brand-500/40 bg-brand-500/5'
          : 'border-slate-700/50 bg-dark-50',
      )}>
        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <StepIcon status={step.status} />
            <div>
              <h3 className={cn('text-sm font-semibold', isCurrent ? 'text-brand-300' : 'text-slate-100')}>
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{step.responsible_party}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={step.status} />
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-slate-700/40 space-y-3 animate-fade-in">
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{step.description}</p>

            {/* Datas */}
            <div className="bg-dark-100 rounded-lg px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Datas</span>
                <div className="flex gap-6">
                  <span>Previsto</span>
                  <span>Realizado</span>
                </div>
              </div>
              <DateRow label="Início" planned={step.planned_date} actual={step.actual_date} late={late} />
            </div>

            {/* Documentos */}
            {step.documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Documentos
                </p>
                <div className="rounded-lg border border-slate-700/40 overflow-hidden">
                  {step.documents.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            )}

            {/* Referência externa */}
            {step.external_ref && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-dark-100 rounded-lg px-3 py-2">
                <ExternalLink className="w-3 h-3 text-brand-400" />
                <span>Referência: <strong className="text-brand-300">{step.external_ref}</strong></span>
              </div>
            )}

            {/* Bloqueadores */}
            {step.blockers && step.blockers.length > 0 && (
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-2.5">
                <p className="text-xs font-medium text-orange-400 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Pendências / Bloqueadores
                </p>
                <ul className="space-y-1">
                  {step.blockers.map((b, i) => (
                    <li key={i} className="text-xs text-orange-300/80 flex gap-2">
                      <span className="text-orange-500 mt-0.5">•</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notas */}
            {step.notes && (
              <div className="flex items-start gap-2 text-xs text-slate-400 italic">
                <User className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {step.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Barra de progresso geral ----------------------------------
function ProgressBar({ steps }: { steps: WorkflowStep[] }) {
  const concluded = steps.filter((s) => s.status === 'CONCLUIDO').length
  const total = steps.length
  const pct = Math.round((concluded / total) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{concluded} de {total} etapas concluídas</span>
        <span className="font-semibold text-slate-200">{pct}%</span>
      </div>
      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---- Componente principal --------------------------------------
export function WorkflowTimeline({ workflow }: { workflow: ExportWorkflow }) {
  const overallColor = {
    EM_ANDAMENTO: 'text-brand-400',
    CONCLUIDO: 'text-emerald-400',
    ATRASADO: 'text-red-400',
    CANCELADO: 'text-slate-500',
  }[workflow.overall_status]

  const overallLabel = {
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    ATRASADO: 'Atrasado',
    CANCELADO: 'Cancelado',
  }[workflow.overall_status]

  return (
    <div className="space-y-6">
      {/* Cabeçalho do workflow */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              {workflow.negotiation.product_name}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {workflow.negotiation.quantity_kg.toLocaleString('pt-BR')} kg •{' '}
              <span className="text-brand-400 font-medium">{workflow.incoterm}</span> •{' '}
              {workflow.negotiation.origin_port} → {workflow.negotiation.destination_port}
            </p>
          </div>
          <div className="text-right">
            <span className={cn('text-sm font-semibold', overallColor)}>{overallLabel}</span>
            <p className="text-xs text-slate-500 mt-0.5">
              Previsão: {formatDate(workflow.estimated_completion)}
            </p>
          </div>
        </div>

        <ProgressBar steps={workflow.steps} />

        {/* Partes */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-dark-100 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-500 mb-0.5">Exportador</p>
            <p className="text-sm font-medium text-slate-200">{workflow.exporter.company_name}</p>
            <p className="text-xs text-slate-500">{workflow.exporter.country}</p>
          </div>
          <div className="bg-dark-100 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-500 mb-0.5">Importador</p>
            <p className="text-sm font-medium text-slate-200">{workflow.importer.company_name}</p>
            <p className="text-xs text-slate-500">{workflow.importer.country}</p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs text-slate-500 font-medium">Legenda:</span>
        {(['CONCLUIDO', 'EM_ANDAMENTO', 'ATRASADO', 'BLOQUEADO', 'PENDENTE'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <StepIcon status={s} size="sm" />
            <span className="text-xs text-slate-400">{stepStatusLabel[s]}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        {workflow.steps.map((step, i) => (
          <WorkflowStepCard
            key={step.id}
            step={step}
            index={i}
            isLast={i === workflow.steps.length - 1}
            isCurrent={step.code === workflow.current_step_code}
          />
        ))}
      </div>
    </div>
  )
}
