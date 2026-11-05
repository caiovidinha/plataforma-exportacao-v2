'use client'
import { Menu, X, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import type { SessionUser } from '@amazon-trade/shared'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'
import { useT, type MessageKey } from '@/lib/i18n'
import { PageLoader } from '@/components/ui/primitives'
import { AccountBanners } from './Banners'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'

export interface NavItem {
  href: string
  label: MessageKey
  icon: LucideIcon
  /** só marca como ativo quando a rota é idêntica (ex.: dashboard) */
  exact?: boolean
}

/** Shell de dashboard: sidebar neutra (exportador e backoffice). */
export function SidebarShell({
  user,
  area,
  nav,
  tag,
  onboardingHref,
  children,
}: {
  user: SessionUser | null
  area: 'exporter' | 'admin'
  nav: NavItem[]
  tag?: string
  onboardingHref?: string
  children: ReactNode
}) {
  const t = useT()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  if (!user) return <PageLoader />

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button className="rounded-md p-1 text-ink-500 hover:bg-ink-100 lg:hidden" onClick={() => setOpen(false)} aria-label="close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      {tag && <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{tag}</p>}
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', active ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900')}
              >
                <item.icon className={cn('h-[18px] w-[18px]', active ? 'text-brand-600' : 'text-ink-400')} />
                {t(item.label)}
              </Link>
            </li>
          )
        })}
      </ul>
      {user.company && (
        <div className="border-t border-ink-100 p-4">
          <p className="truncate text-xs font-medium text-ink-800">{user.company.legalName}</p>
          <p className="text-[11px] text-ink-500">{t(`companyType.${user.company.type}` as MessageKey)}</p>
        </div>
      )}
    </nav>
  )

  return (
    <div className="min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink-200 bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-pop">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <button className="rounded-md p-2 text-ink-600 hover:bg-ink-100 lg:hidden" onClick={() => setOpen(true)} aria-label="open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <NotificationBell area={area} />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          {onboardingHref && <div className="mb-6 empty:hidden"><AccountBanners user={user} onboardingHref={onboardingHref} /></div>}
          {children}
        </main>
      </div>
    </div>
  )
}
