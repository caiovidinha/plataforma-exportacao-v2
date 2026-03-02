import { MapaRegistrationAlert } from '@/components/ui/MapaRegistrationAlert'
import { getWorkflows, getOffers, getNegotiations, getMapaNotices, getMe } from '@/lib/api'
import {
  TrendingUp,
  Package,
  GitBranch,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bell,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Visão Geral' }

async function DashboardStats() {
  const [workflows, offers, negotiations] = await Promise.all([
    getWorkflows(),
    getOffers(),
    getNegotiations(),
  ])

  const offersList = offers.data ?? []

  const stats = [
    {
      label: 'Workflows Ativos',
      value: workflows.filter((w) => w.overall_status === 'EM_ANDAMENTO').length,
      icon: GitBranch,
      color: 'text-brand-400',
      bg: 'bg-brand-400/10',
      href: '/workflow',
    },
    {
      label: 'Ofertas na Vitrine',
      value: offersList.filter((o) => o.status === 'ATIVA').length,
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      href: '/vitrine',
    },
    {
      label: 'Negociações Abertas',
      value: negotiations.filter((n) => n.status === 'ABERTA' || n.status === 'ACORDO_PENDENTE').length,
      icon: MessageSquare,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
      href: '/negociacao',
    },
    {
      label: 'Acordos Fechados',
      value: negotiations.filter((n) => n.status === 'ACORDO_FECHADO').length,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      href: '/negociacao',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Link key={s.label} href={s.href} className="card hover:border-slate-600 transition-colors group">
          <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <p className="text-2xl font-display font-bold text-white group-hover:text-brand-300 transition-colors">
            {s.value}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
        </Link>
      ))}
    </div>
  )
}

async function RecentWorkflows() {
  const workflows = await getWorkflows()
  const statusIcon = {
    EM_ANDAMENTO: <Clock className="w-3.5 h-3.5 text-brand-400" />,
    CONCLUIDO: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    ATRASADO: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
    CANCELADO: <AlertCircle className="w-3.5 h-3.5 text-slate-500" />,
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Workflows Recentes</h3>
        <Link href="/workflow" className="text-xs text-brand-400 hover:text-brand-300">Ver todos →</Link>
      </div>
      <div className="space-y-2">
        {workflows.slice(0, 5).map((w) => (
          <Link key={w.id} href={`/workflow/${w.id}`}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-dark-100 transition-colors group">
            <div className="flex items-center gap-3">
              {statusIcon[w.overall_status]}
              <div>
                <p className="text-sm text-slate-200 group-hover:text-white transition-colors">{w.negotiation.product_name}</p>
                <p className="text-xs text-slate-500">{w.negotiation.origin_port} → {w.negotiation.destination_port}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-400 font-medium">{w.incoterm}</p>
              <p className="text-xs text-slate-500">Prev. {formatDate(w.estimated_completion)}</p>
            </div>
          </Link>
        ))}
        {workflows.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">Nenhum workflow ativo.</p>
        )}
      </div>
    </div>
  )
}

async function MapaNoticesWidget() {
  const notices = await getMapaNotices()
  const categoryColor = {
    ALERTA: 'text-red-400 bg-red-400/10 border-red-400/30',
    NORMATIVA: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    INFORMATIVO: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-400" /> Informativos MAPA
        </h3>
        <Link href="/mercado" className="text-xs text-brand-400 hover:text-brand-300">Ver todos →</Link>
      </div>
      <div className="space-y-2.5">
        {notices.slice(0, 4).map((n) => (
          <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
            className="block py-2.5 px-3 rounded-lg hover:bg-dark-100 transition-colors group">
            <div className="flex items-start gap-2">
              <span className={`badge flex-shrink-0 mt-0.5 ${categoryColor[n.category]}`}>{n.category}</span>
              <div>
                <p className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(n.date)}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await getMe()

  return (
    <div>
      <MapaRegistrationAlert show={!user.mapa_registered} variant="banner" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="page-title">Bom dia, {user.name.split(' ')[0]}!</h1>
          <p className="text-sm text-slate-400 mt-1">{user.company_name} — {user.role}</p>
        </div>

        {/* MAPA card warning (apenas se não cadastrado) */}
        {!user.mapa_registered && (
          <MapaRegistrationAlert show variant="card" />
        )}

        {/* Stats */}
        <DashboardStats />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentWorkflows />
          <MapaNoticesWidget />
        </div>
      </div>
    </div>
  )
}
