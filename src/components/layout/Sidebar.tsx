'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  GitBranch,
  DollarSign,
  BarChart2,
  Package,
  Settings,
  LogOut,
  AlertTriangle,
  Leaf,
  FileText,
  User,
  Truck,
  Ship,
  Briefcase,
  Landmark,
  Warehouse,
  ShieldCheck,
  Award,
  FlaskConical,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { featureFlags } from '@/lib/feature-flags'
import type { EntitySlug } from '@/lib/entity-config'

const TRADING_ENTITIES: EntitySlug[] = ['exportador', 'importador']

// Entity icon map for the user footer badge
const ENTITY_ICONS: Record<EntitySlug, React.ElementType> = {
  exportador: Leaf,
  importador: ShoppingBag,
  transportadora: Truck,
  'companhia-navegacao': Ship,
  despachante: Briefcase,
  corretora: Landmark,
  terminal: Warehouse,
  seguradora: ShieldCheck,
  certificadora: Award,
  laboratorio: FlaskConical,
}

interface SidebarProps {
  entityType?: EntitySlug
  userName?: string
  companyName?: string
  mapaRegistered?: boolean
  roleLabel?: string
}

export function Sidebar({
  entityType = 'exportador',
  userName = '',
  companyName = '',
  mapaRegistered = false,
  roleLabel = 'Exporter',
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations()
  const isTrading = TRADING_ENTITIES.includes(entityType)
  const EntityIcon = ENTITY_ICONS[entityType] ?? Leaf

  // ─── Nav items built with translations ──────────────────────────────────
  const tradingNav = [
    { href: '/dashboard',        label: t('nav.overview'),       icon: LayoutDashboard },
    { href: '/vitrine',          label: t('nav.offers'),         icon: ShoppingBag },
    { href: '/negociacao',       label: t('nav.negotiations'),   icon: MessageSquare },
    { href: '/workflow',         label: t('nav.workflow'),       icon: GitBranch },
    { href: '/liquidacao',       label: t('nav.settlement'),     icon: DollarSign },
    { href: '/mercado',          label: t('nav.market'),         icon: BarChart2 },
    { href: '/servicos',         label: t('nav.marketplace'),    icon: Package },
    { href: '/cadastro',         label: t('nav.registrations'),  icon: Settings },
    { href: '/minha-conta',      label: t('nav.myAccount'),      icon: User },
  ]

  const providerNav = [
    { href: '/dashboard',        label: t('nav.overview'),          icon: LayoutDashboard },
    { href: '/contratos-servico',label: t('nav.serviceContracts'),  icon: FileText },
    { href: '/servicos',         label: t('nav.marketplace'),       icon: Package },
    { href: '/minha-conta',      label: t('nav.myAccount'),         icon: User },
  ]

  const nav = isTrading ? tradingNav : providerNav

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-50 border-r border-slate-700/50 flex flex-col z-40">
      {/* Logo — links back to landing page */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50 hover:bg-dark-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm leading-tight">{t('sidebar.brandName')}</p>
          <p className="text-xs text-slate-400">{t('sidebar.brandTagline')}</p>
        </div>
      </Link>

      {/* MAPA Warning – only for exportador without MAPA registration */}
      {entityType === 'exportador' && !mapaRegistered && featureFlags.mapaRegistrationWarning && (
        <Link
          href="/cadastro/mapa"
          className="mx-3 mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 hover:bg-amber-500/20 transition-colors group"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-300">{t('mapa.sidebarTitle')}</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              {t('mapa.sidebarDesc')}{' '}
              <span className="underline group-hover:no-underline">{t('mapa.sidebarLink')}</span>
            </p>
          </div>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5',
                active
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-100',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        {/* Entity badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-dark-100 border border-slate-600 flex items-center justify-center flex-shrink-0">
            <EntityIcon className="w-4 h-4 text-brand-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{companyName || roleLabel}</p>
          </div>
        </div>

        {featureFlags.useMockData && (
          <div className="flex items-center gap-1.5 mb-3 bg-violet-500/10 border border-violet-500/20 rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-300 font-medium">
              {t('sidebar.mockLabel', { role: roleLabel })}
            </span>
          </div>
        )}

        <button
          onClick={() => router.push('/entrar')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  )
}
