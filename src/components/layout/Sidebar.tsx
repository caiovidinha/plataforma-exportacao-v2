'use client'

import Link from 'next/link'
import Image from 'next/image'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { featureFlags } from '@/lib/feature-flags'
import type { EntitySlug } from '@/lib/entity-config'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const TRADING_ENTITIES: EntitySlug[] = ['exportador', 'importador']

// Entity icon map for the user footer badge
const ENTITY_ICONS: Record<EntitySlug, React.ElementType> = {
  exportador: Package,
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
  const EntityIcon = ENTITY_ICONS[entityType] ?? Package

  // Locale-aware entity name using static keys so next-intl resolves correctly
  const entityName = ({
    exportador:            t('entities.exportador'),
    importador:            t('entities.importador'),
    transportadora:        t('entities.transportadora'),
    'companhia-navegacao': t('entities.companhia-navegacao'),
    despachante:           t('entities.despachante'),
    corretora:             t('entities.corretora'),
    terminal:              t('entities.terminal'),
    seguradora:            t('entities.seguradora'),
    certificadora:         t('entities.certificadora'),
    laboratorio:           t('entities.laboratorio'),
  } satisfies Record<EntitySlug, string>)[entityType]

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
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{ backgroundColor: '#2c1e12', borderRight: '1px solid rgba(219,203,186,0.12)' }}>
      {/* Logo - links back to landing page */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 transition-all hover:brightness-110"
        style={{ borderBottom: '1px solid rgba(219,203,186,0.12)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
      >
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <Image src="/img/logo-branca-icon.webp" alt="brazilXHUB" width={36} height={36} className="object-contain" />
        </div>
        <div>
          <p className="font-display font-bold text-[#ede5dc] text-sm leading-tight">{t('sidebar.brandName')}</p>
          <p className="text-xs" style={{ color: 'rgba(219,203,186,0.55)' }}>{t('sidebar.brandTagline')}</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all mb-0.5',
                active
                  ? 'text-[#ede5dc]'
                  : 'text-[#dbcbba]/60 hover:text-[#ede5dc] hover:bg-white/[0.06] hover:brightness-110',
              )}
              style={active
                ? { backgroundColor: 'rgba(237,229,220,0.12)', borderLeft: '2px solid #dbcbba', paddingLeft: '10px' }
                : undefined
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(219,203,186,0.12)' }}>
        {/* Entity badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(219,203,186,0.10)', border: '1px solid rgba(219,203,186,0.20)' }}>
            <EntityIcon className="w-4 h-4 text-[#dbcbba]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#ede5dc] truncate">{userName || 'User'}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(219,203,186,0.55)' }}>{companyName || roleLabel}</p>
          </div>
        </div>

        {featureFlags.useMockData && (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1"
            style={{ backgroundColor: 'rgba(219,203,186,0.10)', border: '1px solid rgba(219,203,186,0.20)' }}>
            <span className="w-1.5 h-1.5 bg-[#dbcbba]/70 animate-pulse" />
            <span className="text-xs text-[#dbcbba]/70 font-medium">
              {t('sidebar.mockLabel', { role: entityName })}
            </span>
          </div>
        )}

        <button
          onClick={() => router.push('/entrar')}
          className="flex items-center gap-2 text-sm transition-colors w-full"
          style={{ color: 'rgba(219,203,186,0.55)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ede5dc')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(219,203,186,0.55)')}
        >
          <LogOut className="w-4 h-4" />
          {t('sidebar.logout')}
        </button>

        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(219,203,186,0.12)' }}>
          <LanguageSwitcher className="w-full" />
        </div>
      </div>
    </aside>
  )
}
