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
  CalendarDays,
  ExternalLink,
  AlertTriangle,
  Scale,
  ShieldCheck,
  DollarSign,
  Ship,
  FileCheck,
  Truck,
  BadgeCheck,
  Microscope,
  PartyPopper,
  Frown,
} from 'lucide-react'
import { cn, formatDate, stageStatusColors, stageStatusLabel } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { DocumentViewer } from '@/components/ui/DocumentViewer'
import { getPartner } from '@/lib/partners'
import type { ExportWorkflow, WorkflowStageDefinition, WorkflowStageStatus, PartnerType } from '@/types'

const PARTNER_ICONS: Record<PartnerType, React.ElementType> = {
  JURIDICO: Scale,
  SEGURADORA: ShieldCheck,
  CORRETORA_CAMBIO: DollarSign,
  CIA_NAVEGACAO: Ship,
  DESPACHANTE: FileCheck,
  LOGISTICA: Truck,
  CERTIFICADORA: BadgeCheck,
  LABORATORIO: Microscope,
}

// ---- Ícone por status ------------------------------------------
function StageIcon({ status, size = 'md' }: { status: WorkflowStageStatus; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  if (status === 'CONCLUIDO') return <CheckCircle2 className={cn(cls, 'text-emerald-700')} />
  if (status === 'EM_ANDAMENTO') return <Clock className={cn(cls, 'text-brand-400 animate-pulse-slow')} />
  if (status === 'ATRASADO') return <AlertCircle className={cn(cls, 'text-[#584531]')} />
  if (status === 'BLOQUEADO') return <XCircle className={cn(cls, 'text-[#3e2e1e]')} />
  return <div className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', 'border-2 border-[#584531]/40')} />
}

// ---- Badge de status -------------------------------------------
function StatusBadge({ status }: { status: WorkflowStageStatus }) {
  return (
    <span className={cn('badge', stageStatusColors[status])}>
      <StageIcon status={status} size="sm" />
      {stageStatusLabel[status]}
    </span>
  )
}

// ---- Badges dos parceiros responsáveis pela etapa ---------------
function PartnerBadges({ partners }: { partners: PartnerType[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {partners.map((type) => {
        const partner = getPartner(type)
        const Icon = PARTNER_ICONS[type]
        return (
          <span
            key={type}
            title={partner.description}
            className="flex items-center gap-1 bg-[#584531]/10 border border-[#584531]/20 px-2 py-0.5 text-[10px] text-[#584531] font-medium"
          >
            <Icon className="w-3 h-3" /> {partner.name}
          </span>
        )
      })}
    </div>
  )
}

// ---- Linha de data prevista vs realizada -----------------------
function DateRow({ label, planned, actual, late }: { label: string; planned: string; actual?: string; late?: boolean }) {
  const t = useTranslations('workflow')
  return (
    <div className="grid grid-cols-3 items-center text-xs py-1">
      <span className="text-[#584531]">{label}</span>
      <span className="text-[#3e2e1e] tabular-nums">{formatDate(planned)}</span>
      {actual ? (
        <span className={cn('font-medium tabular-nums', late ? 'text-[#584531]' : 'text-emerald-700')}>
          {formatDate(actual)}
          {late && (
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-[#584531]">
              {t('lateLabel')}
            </span>
          )}
        </span>
      ) : (
        <span className="text-[#584531]/50 italic">-</span>
      )}
    </div>
  )
}

// ---- Card de cada etapa ----------------------------------------
function WorkflowStageCard({
  stage,
  index,
  isLast,
  isCurrent,
}: {
  stage: WorkflowStageDefinition
  index: number
  isLast: boolean
  isCurrent: boolean
}) {
  const [expanded, setExpanded] = useState(
    stage.status === 'EM_ANDAMENTO' || stage.status === 'ATRASADO' || stage.status === 'BLOQUEADO',
  )

  const late = !!(stage.actual_date && stage.planned_date && stage.actual_date > stage.planned_date)
  const t = useTranslations('workflow')
  const isRecusada = stage.stage === 'MERCADORIA_RECUSADA'

  return (
    <div className="flex gap-4">
      {/* Linha vertical + ícone */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-9 h-9 flex items-center justify-center border-2 flex-shrink-0 z-10 relative',
            stage.status === 'CONCLUIDO' && !isRecusada && 'bg-emerald-700/10 border-emerald-700',
            stage.status === 'CONCLUIDO' && isRecusada && 'bg-red-600/10 border-red-600',
            stage.status === 'EM_ANDAMENTO' && 'bg-brand-500/10 border-brand-400',
            stage.status === 'ATRASADO' && 'bg-[#584531]/10 border-[#584531]',
            stage.status === 'BLOQUEADO' && 'bg-[#3e2e1e]/10 border-[#3e2e1e]',
            stage.status === 'PENDENTE' && 'bg-[#dbcbba] border-[#584531]/40',
            isCurrent && 'ring-2 ring-offset-2 ring-offset-[#dbcbba] ring-[#584531]/50',
          )}
        >
          <span className="text-xs font-bold text-[#584531]">{index + 1}</span>
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 mt-0.5',
              stage.status === 'CONCLUIDO' ? 'bg-emerald-700/40' : 'bg-slate-700/60',
            )}
          />
        )}
      </div>

      {/* Conteúdo */}
      <div className={cn('flex-1 mb-4 border transition-colors',
        isRecusada
          ? 'border-red-600/30 bg-red-600/5'
          : isCurrent
          ? 'border-[#584531]/35 bg-[#584531]/5'
          : 'border-[#3e2e1e]/12 bg-white/40',
      )}>
        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <StageIcon status={stage.status} />
            <div className="min-w-0">
              <h3 className={cn('text-sm font-semibold', isCurrent ? 'text-[#584531]' : 'text-[#3e2e1e]')}>
                {stage.title}
              </h3>
              <div className="mt-1">
                <PartnerBadges partners={stage.responsible_partners} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={stage.status} />
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-[#584531]/50" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#584531]/50" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-[#3e2e1e]/12 space-y-3 animate-fade-in">
            <p className="text-xs text-[#584531] mt-3 leading-relaxed">{stage.description}</p>

            {/* Datas */}
            <div className="bg-[#f0e8de] px-3 py-2.5">
              {/* Header */}
              <div className="grid grid-cols-3 items-center text-[10px] font-semibold uppercase tracking-wide text-[#584531]/60 pb-1.5 mb-1 border-b border-[#3e2e1e]/12">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {t('datesSection')}</span>
                <span>{t('planned')}</span>
                <span>{t('actual')}</span>
              </div>
              <DateRow label={t('startLabel')} planned={stage.planned_date} actual={stage.actual_date} late={late} />
            </div>

            {/* Documentos */}
            {stage.documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#584531] mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {t('documentsSection')}
                </p>
                <DocumentViewer documents={stage.documents} />
              </div>
            )}

            {/* Bloqueadores */}
            {stage.blockers && stage.blockers.length > 0 && (
              <div className="border border-[#3e2e1e]/20 bg-[#3e2e1e]/5 px-3 py-2.5">
                <p className="text-xs font-medium text-[#3e2e1e] flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {t('pendingBlockers')}
                </p>
                <ul className="space-y-1">
                  {stage.blockers.map((b, i) => (
                    <li key={i} className="text-xs text-[#584531]/70 flex gap-2">
                      <span className="text-[#584531] mt-0.5">•</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notas */}
            {stage.notes && (
              <div className="flex items-start gap-2 text-xs text-slate-400 italic">
                <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#584531]/60" />
                {stage.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Barra de progresso geral ----------------------------------
function ProgressBar({ stages }: { stages: WorkflowStageDefinition[] }) {
  const t = useTranslations('workflow')
  const concluded = stages.filter((s) => s.status === 'CONCLUIDO').length
  const total = stages.length
  const pct = Math.round((concluded / total) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{t('stepsProgress', { done: concluded, total })}</span>
        <span className="font-semibold text-slate-200">{pct}%</span>
      </div>
      <div className="h-2 bg-[#dbcbba] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#584531] to-emerald-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---- Faixa do desfecho terminal (Pagamento vs Mercadoria Recusada) ----
function OutcomeBanner({ workflow }: { workflow: ExportWorkflow }) {
  const t = useTranslations('workflow')
  const lastStage = workflow.stages[workflow.stages.length - 1]

  if (lastStage.stage === 'MERCADORIA_RECUSADA' && lastStage.status === 'CONCLUIDO') {
    return (
      <div className="flex items-center gap-3 border border-red-600/30 bg-red-600/5 px-4 py-3">
        <Frown className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">{t('outcomeRejectedTitle')}</p>
          <p className="text-xs text-[#584531]">{t('outcomeRejectedDesc')}</p>
        </div>
      </div>
    )
  }

  if (lastStage.stage === 'PAGAMENTO' && lastStage.status === 'CONCLUIDO') {
    return (
      <div className="flex items-center gap-3 border border-emerald-700/30 bg-emerald-700/5 px-4 py-3">
        <PartyPopper className="w-5 h-5 text-emerald-700 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">{t('outcomePaidTitle')}</p>
          <p className="text-xs text-[#584531]">{t('outcomePaidDesc')}</p>
        </div>
      </div>
    )
  }

  return null
}

// ---- Componente principal --------------------------------------
export function WorkflowTimeline({ workflow }: { workflow: ExportWorkflow }) {
  const t = useTranslations('workflow')
  const overallColor = {
    EM_ANDAMENTO: 'text-brand-400',
    CONCLUIDO: 'text-emerald-700',
    ATRASADO: 'text-[#584531]',
    CANCELADO: 'text-slate-500',
  }[workflow.overall_status]

  const overallLabel = {
    EM_ANDAMENTO: t('statusInProgress'),
    CONCLUIDO: t('statusCompleted'),
    ATRASADO: t('statusDelayed'),
    CANCELADO: t('statusCancelled'),
  }[workflow.overall_status]

  return (
    <div className="space-y-6">
      {/* Cabeçalho do workflow */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#3e2e1e]">
              {workflow.order.product_name}
            </h2>
            <p className="text-sm text-[#584531] mt-0.5">
              {workflow.order.quantity_kg.toLocaleString('pt-BR')} kg •{' '}
              <span className="text-[#3e2e1e] font-medium">{workflow.incoterm}</span> •{' '}
              {workflow.order.origin_port} → {workflow.order.destination_port}
            </p>
          </div>
          <div className="text-right">
            <span className={cn('text-sm font-semibold', overallColor)}>{overallLabel}</span>
            <p className="text-xs text-[#584531]/60 mt-0.5">
              {t('estCompletion')} {formatDate(workflow.estimated_completion)}
            </p>
          </div>
        </div>

        <ProgressBar stages={workflow.stages} />

        {/* Partes */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[#f0e8de] px-3 py-2">
            <p className="text-xs text-[#584531]/60 mb-0.5">{t('exporter')}</p>
            <p className="text-sm font-medium text-[#3e2e1e]">{workflow.exporter.company_name}</p>
            <p className="text-xs text-[#584531]/60">{workflow.exporter.country}</p>
          </div>
          <div className="bg-[#f0e8de] px-3 py-2">
            <p className="text-xs text-[#584531]/60 mb-0.5">{t('importer')}</p>
            <p className="text-sm font-medium text-[#3e2e1e]">{workflow.importer.company_name}</p>
            <p className="text-xs text-[#584531]/60">{workflow.importer.country}</p>
          </div>
        </div>
      </div>

      <OutcomeBanner workflow={workflow} />

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs text-[#584531]/60 font-medium">{t('legendLabel')}</span>
        {(['CONCLUIDO', 'EM_ANDAMENTO', 'ATRASADO', 'BLOQUEADO', 'PENDENTE'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <StageIcon status={s} size="sm" />
            <span className="text-xs text-[#584531]">{stageStatusLabel[s]}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        {workflow.stages.map((stage, i) => (
          <WorkflowStageCard
            key={stage.id}
            stage={stage}
            index={i}
            isLast={i === workflow.stages.length - 1}
            isCurrent={stage.stage === workflow.current_stage}
          />
        ))}
      </div>
    </div>
  )
}
