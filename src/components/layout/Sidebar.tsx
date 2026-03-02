'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { featureFlags } from '@/lib/feature-flags'

const nav = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/vitrine', label: 'Vitrine de Ofertas', icon: ShoppingBag },
  { href: '/negociacao', label: 'Negociações', icon: MessageSquare },
  { href: '/workflow', label: 'Workflow Logístico', icon: GitBranch },
  { href: '/liquidacao', label: 'Liquidação', icon: DollarSign },
  { href: '/mercado', label: 'Inteligência de Mercado', icon: BarChart2 },
  { href: '/servicos', label: 'Marketplace Serviços', icon: Package },
  { href: '/cadastro', label: 'Cadastros', icon: Settings },
]

interface SidebarProps {
  mapaRegistered?: boolean
}

export function Sidebar({ mapaRegistered = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-50 border-r border-slate-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm leading-tight">PlataformaExport</p>
          <p className="text-xs text-slate-400">Castanha & Agro B2B</p>
        </div>
      </div>

      {/* MAPA Warning */}
      {!mapaRegistered && featureFlags.mapaRegistrationWarning && (
        <Link
          href="/cadastro/mapa"
          className="mx-3 mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 hover:bg-amber-500/20 transition-colors group"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-300">Cadastro MAPA pendente</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Finalize o cadastro para exportar. <span className="underline group-hover:no-underline">Clique aqui</span>
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
        {featureFlags.useMockData && (
          <div className="flex items-center gap-1.5 mb-3 bg-violet-500/10 border border-violet-500/20 rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-300 font-medium">Modo Mock Ativo</span>
          </div>
        )}
        <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
