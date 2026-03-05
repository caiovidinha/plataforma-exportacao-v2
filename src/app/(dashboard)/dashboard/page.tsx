'use client'

import { useMockSession } from '@/lib/mock-session'
import { MapaRegistrationAlert } from '@/components/ui/MapaRegistrationAlert'
import { useTranslations } from 'next-intl'
import {
  TrendingUp,
  Package,
  GitBranch,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bell,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { MockServiceContract } from '@/mock/mock-users'

const ICON_MAP: Record<string, React.ElementType> = {
  GitBranch,
  Package,
  MessageSquare,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  BarChart2,
}

const STAT_COLORS = [
  { text: 'text-brand-400', bg: 'bg-brand-400/10', href: '/workflow' },
  { text: 'text-blue-400', bg: 'bg-blue-400/10', href: '/vitrine' },
  { text: 'text-violet-400', bg: 'bg-violet-400/10', href: '/negociacao' },
  { text: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/liquidacao' },
]

const PROVIDER_STAT_COLORS = [
  { text: 'text-brand-400', bg: 'bg-brand-400/10', href: '/contratos-servico' },
  { text: 'text-blue-400', bg: 'bg-blue-400/10', href: '/contratos-servico' },
  { text: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/contratos-servico' },
  { text: 'text-violet-400', bg: 'bg-violet-400/10', href: '/minha-conta' },
]

const TRADING_ENTITIES = ['exportador', 'importador']

function StatCard({
  label,
  value,
  unit,
  icon,
  color,
  bg,
  href,
}: {
  label: string
  value: number | string
  unit?: string
  icon?: string
  color: string
  bg: string
  href: string
}) {
  const Icon = (icon && ICON_MAP[icon]) ? ICON_MAP[icon] : Package
  return (
    <Link href={href} className="card hover:border-slate-600 transition-colors group">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className={cn('text-2xl font-display font-bold', color)}>
        {value}
        {unit && <span className="text-sm ml-1 font-normal text-slate-400">{unit}</span>}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </Link>
  )
}

function ContractsMiniList({ contracts }: { contracts: MockServiceContract[] }) {
  const t = useTranslations('dashboard')
  const STATUS_COLOR: Record<string, string> = {
    PENDENTE: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    CONTRATADO: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    CONCLUIDO: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    CANCELADO: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  }
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" /> {t('recentContracts')}
        </h3>
        <Link href="/contratos-servico" className="text-xs text-brand-400 hover:text-brand-300">
          {t('viewContracts')}
        </Link>
      </div>
      <div className="space-y-2">
        {contracts.slice(0, 5).map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-dark-100 transition-colors">
            <div className="min-w-0">
              <p className="text-sm text-slate-200 truncate">{c.service_type ?? c.description}</p>
              <p className="text-xs text-slate-500">{c.requester_name ?? c.exporter} · {c.product_name ?? c.importer}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <span className="text-xs font-medium text-emerald-400">
                R$&nbsp;{c.value_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className={cn('border text-xs px-2 py-0.5 rounded-full', STATUS_COLOR[c.status])}>
                {c.status === 'PENDENTE' ? t('statusPendente') : c.status === 'CONTRATADO' ? t('statusContratado') : c.status === 'CONCLUIDO' ? t('statusConcluido') : t('statusCancelado')}
              </span>
            </div>
          </div>
        ))}
        {contracts.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">{t('noContracts')}</p>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, entityType } = useMockSession()
  const t = useTranslations('dashboard')
  const isTrading = TRADING_ENTITIES.includes(entityType)
  const colors = isTrading ? STAT_COLORS : PROVIDER_STAT_COLORS
  const contracts = user.service_contracts ?? []

  const mapaNotices = [
    { id: '1', title: 'Instrução Normativa 83/2024 — Novos requisitos fitossanitários', date: '2024-06-01', category: 'NORMATIVA' },
    { id: '2', title: 'Alerta: Suspensão temporária de exportações para mercados afetados', date: '2024-05-28', category: 'ALERTA' },
    { id: '3', title: 'Resultado da campanha de monitoramento de aflatoxinas Q2', date: '2024-05-15', category: 'INFORMATIVO' },
  ]

  const categoryColor: Record<string, string> = {
    ALERTA: 'text-red-400 bg-red-400/10 border-red-400/30',
    NORMATIVA: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    INFORMATIVO: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  }

  return (
    <div>
      {entityType === 'exportador' && !user.mapa_registered && (
        <MapaRegistrationAlert show variant="banner" />
      )}

      <div className="p-6 space-y-6">
        <div>
          <h1 className="page-title">{t('greetingMorning', { name: user.name.split(' ')[0] })}</h1>
          <p className="text-sm text-slate-400 mt-1">{user.company_name} — {user.role_label}</p>
        </div>

        {entityType === 'exportador' && !user.mapa_registered && (
          <MapaRegistrationAlert show variant="card" />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {user.stats.map((stat, i) => {
            const c = colors[i] ?? STAT_COLORS[0]
            return (
              <StatCard
                key={stat.label}
                label={t(`stats.${stat.label}` as any)}
                value={stat.value}
                unit={stat.unit}
                icon={stat.icon}
                color={c.text}
                bg={c.bg}
                href={c.href}
              />
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isTrading ? (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-brand-400" /> {t('recentWorkflows')}
                  </h3>
                  <Link href="/workflow" className="text-xs text-brand-400 hover:text-brand-300">{t('viewWorkflows')}</Link>
                </div>
                <div className="space-y-1">
                  {[
                  { id: '1', primary: 'Castanha Natural 20t', secondary: 'Belém → Rotterdam · FOB', badge: t('inProgress') },
                    { id: '2', primary: 'Castanha Processada 5t', secondary: 'Santos → Hamburg · CIF', badge: t('completed') },
                    { id: '3', primary: 'Óleo de Castanha 2t', secondary: 'Santos → Miami · EXW', badge: t('inProgress') },
                  ].map((item) => (
                    <Link key={item.id} href={`/workflow/${item.id}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-dark-100 transition-colors group">
                      <div>
                        <p className="text-sm text-slate-200 group-hover:text-white">{item.primary}</p>
                        <p className="text-xs text-slate-500">{item.secondary}</p>
                      </div>
                      <span className="text-xs text-brand-400 font-medium">{item.badge}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-400" /> {t('mapaNotices')}
                  </h3>
                  <Link href="/mercado" className="text-xs text-brand-400 hover:text-brand-300">{t('viewMarket')}</Link>
                </div>
                <div className="space-y-2.5">
                  {mapaNotices.map((n) => (
                    <div key={n.id} className="py-2.5 px-3 rounded-lg hover:bg-dark-100 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={cn('badge flex-shrink-0 mt-0.5 border', categoryColor[n.category])}>
                          {n.category}
                        </span>
                        <div>
                          <p className="text-xs text-slate-300 leading-relaxed">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(n.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <ContractsMiniList contracts={contracts} />

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-brand-400" /> {t('marketOpportunities')}
                  </h3>
                  <Link href="/servicos" className="text-xs text-brand-400 hover:text-brand-300">{t('viewAllOpportunities')}</Link>
                </div>
                <div className="space-y-2">
                  {[
                    { id: '1', text: 'Exportador em Santos busca transportadora para lote de 15t', type: 'TRANSPORTE', urgency: 'URGENTE' },
                    { id: '2', text: 'Empresa alemã solicita certificação orgânica USDA urgente', type: 'CERTIFICAÇÃO', urgency: 'URGENTE' },
                    { id: '3', text: 'Operação de câmbio USD 80.000 aguardando proposta', type: 'CÂMBIO', urgency: 'NORMAL' },
                  ].map((item) => (
                    <Link key={item.id} href="/servicos"
                      className="flex items-start justify-between py-2.5 px-3 rounded-lg hover:bg-dark-100 transition-colors group gap-3">
                      <p className="text-xs text-slate-300 group-hover:text-white leading-relaxed">{item.text}</p>
                      <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                        <span className="badge border border-brand-500/30 text-brand-400 bg-brand-400/10">{item.type}</span>
                        {item.urgency === 'URGENTE' && (
                          <span className="badge border border-red-400/30 text-red-400 bg-red-400/10">{t('urgentBadge')}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/servicos"
                  className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-400 hover:text-brand-300 border border-brand-500/20 rounded-lg py-2 hover:bg-brand-400/5 transition-colors">
                  Ver todas as oportunidades <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
