'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search,
  ShoppingBag,
  ClipboardList,
  GitBranch,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

interface MarketplaceHeaderProps {
  userName?: string
  companyName?: string
}

const SECONDARY_NAV = [
  { href: '/vitrine',     labelKey: 'offers',       icon: ShoppingBag },
  { href: '/pedidos',     labelKey: 'orders',       icon: ClipboardList },
  { href: '/workflow',    labelKey: 'workflow',     icon: GitBranch },
  { href: '/liquidacao',  labelKey: 'settlement',   icon: DollarSign },
  { href: '/mercado',     labelKey: 'market',       icon: BarChart2 },
  { href: '/cadastro',    labelKey: 'registrations',icon: Settings },
  { href: '/minha-conta', labelKey: 'myAccount',    icon: User },
] as const

export function MarketplaceHeader({ userName = '', companyName = '' }: MarketplaceHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(query ? `/vitrine?q=${encodeURIComponent(query)}` : '/vitrine')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#ede5dc] shadow-sm">
      {/* Linha principal */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-[#3e2e1e]/10">
        <Link href="/dashboard" className="flex items-center flex-shrink-0">
          <Image src="/img/logo-cor.webp" alt="Brazil X Hub" width={96} height={32} className="object-contain h-8 w-auto" />
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#584531]/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-3 py-2 text-sm text-[#3e2e1e] bg-white placeholder:text-[#584531]/40 border border-[#3e2e1e]/15 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400"
            />
          </div>
        </form>

        <Link href="/pedidos" className="flex items-center gap-1.5 text-sm font-medium text-[#584531] hover:text-[#3e2e1e] transition-colors flex-shrink-0">
          <ClipboardList className="w-4 h-4" /> {t('orders')}
        </Link>

        <div className="hidden sm:block text-right flex-shrink-0">
          <p className="text-xs font-semibold text-[#3e2e1e] truncate max-w-[140px]">{userName || 'User'}</p>
          <p className="text-[10px] text-[#584531]/70 truncate max-w-[140px]">{companyName}</p>
        </div>

        <LanguageSwitcher />

        <button
          onClick={() => router.push('/entrar')}
          className="flex items-center gap-1.5 text-sm text-[#584531] hover:text-[#3e2e1e] transition-colors flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Linha secundária de navegação */}
      <nav className="flex items-center gap-1 px-5 overflow-x-auto bg-white">
        {SECONDARY_NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2',
                active
                  ? 'text-[#3e2e1e] border-brand-400 font-semibold'
                  : 'text-[#584531]/70 border-transparent hover:text-[#3e2e1e] hover:border-brand-400/30',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
