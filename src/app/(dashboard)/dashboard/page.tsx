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
  Bell,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  { text: 'text-[#584531]', bg: 'bg-[#584531]/10', href: '/vitrine' },
  { text: 'text-[#3e2e1e]', bg: 'bg-[#3e2e1e]/10', href: '/pedidos' },
  { text: 'text-emerald-700', bg: 'bg-emerald-700/10', href: '/liquidacao' },
]

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
    <Link href={href} className="card hover:border-[#3e2e1e]/30 transition-colors group">
      <div className={cn('w-10 h-10 flex items-center justify-center mb-3', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className={cn('text-2xl font-display font-bold', color)}>
        {value}
        {unit && <span className="text-sm ml-1 font-normal text-[#584531]">{unit}</span>}
      </p>
      <p className="text-xs text-[#584531] mt-0.5">{label}</p>
    </Link>
  )
}


export default function DashboardPage() {
  const { user, entityType } = useMockSession()
  const t = useTranslations('dashboard')
  const colors = STAT_COLORS

  const mapaNotices = [
    { id: '1', title: 'Instrução Normativa 83/2024 - Novos requisitos fitossanitários', date: '2024-06-01', category: 'NORMATIVA' },
    { id: '2', title: 'Alerta: Suspensão temporária de exportações para mercados afetados', date: '2024-05-28', category: 'ALERTA' },
    { id: '3', title: 'Resultado da campanha de monitoramento de aflatoxinas Q2', date: '2024-05-15', category: 'INFORMATIVO' },
  ]

  const categoryColor: Record<string, string> = {
    ALERTA: 'text-[#3e2e1e] bg-[#3e2e1e]/10 border-[#3e2e1e]/30',
    NORMATIVA: 'text-[#584531] bg-[#584531]/10 border-[#584531]/30',
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
          <p className="text-sm text-[#584531] mt-1">{user.company_name} - {user.role_label}</p>
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
          <>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#584531]" /> {t('recentWorkflows')}
                  </h3>
                  <Link href="/workflow" className="text-xs text-[#584531] hover:text-[#3e2e1e] underline-offset-2 hover:underline">{t('viewWorkflows')}</Link>
                </div>
                <div className="space-y-1">
                  {[
                  { id: '1', primary: 'Castanha Natural 20t', secondary: 'Belém → Rotterdam · FOB', badge: t('inProgress') },
                    { id: '2', primary: 'Castanha Processada 5t', secondary: 'Santos → Hamburg · CIF', badge: t('completed') },
                    { id: '3', primary: 'Óleo de Castanha 2t', secondary: 'Santos → Miami · EXW', badge: t('inProgress') },
                  ].map((item) => (
                    <Link key={item.id} href={`/workflow/${item.id}`}
                      className="flex items-center justify-between py-2.5 px-3 hover:bg-dark-100 transition-colors group">
                      <div>
                        <p className="text-sm text-[#3e2e1e] group-hover:text-[#1c1208]">{item.primary}</p>
                        <p className="text-xs text-[#584531]/70">{item.secondary}</p>
                      </div>
                      <span className="text-xs text-brand-400 font-medium">{item.badge}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#584531]" /> {t('mapaNotices')}
                  </h3>
                  <Link href="/mercado" className="text-xs text-[#584531] hover:text-[#3e2e1e] underline-offset-2 hover:underline">{t('viewMarket')}</Link>
                </div>
                <div className="space-y-2.5">
                  {mapaNotices.map((n) => (
                    <div key={n.id} className="py-2.5 px-3 hover:bg-dark-100 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={cn('badge flex-shrink-0 mt-0.5 border', categoryColor[n.category])}>
                          {n.category}
                        </span>
                        <div>
                          <p className="text-xs text-[#3e2e1e] leading-relaxed">{n.title}</p>
                          <p className="text-xs text-[#584531]/60 mt-0.5">{new Date(n.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
        </div>
      </div>
    </div>
  )
}
