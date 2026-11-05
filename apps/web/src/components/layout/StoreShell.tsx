'use client'
import { Menu, Package, Search, ShoppingBag, Ship, Store, UserRound, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'
import type { SessionUser } from '@amazon-trade/shared'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import { PageLoader } from '@/components/ui/primitives'
import { LocaleSwitch } from './LocaleSwitch'
import { AccountBanners } from './Banners'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'

/**
 * Shell de "loja" do importador: cabeçalho no topo (busca + navegação), conteúdo com ~12% de respiro lateral
 * (banners e rodapé vão de ponta a ponta) e rodapé institucional.
 */
export function StoreShell({ user, children }: { user: SessionUser | null; children: ReactNode }) {
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  if (!user) return <PageLoader />

  const nav = [
    { href: '/store', label: t('store.nav.catalog'), icon: Store, exact: true },
    { href: '/store/orders', label: t('store.nav.orders'), icon: ShoppingBag },
    { href: '/store/shipments', label: t('store.nav.shipments'), icon: Ship },
    { href: '/store/account', label: t('store.nav.account'), icon: UserRound },
  ]
  const search = (e: FormEvent) => {
    e.preventDefault()
    router.push(`/store${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white">
        <div className="store-gutter flex h-16 items-center gap-4">
          <Link href="/store" className="shrink-0">
            <Logo />
          </Link>
          <form onSubmit={search} className="relative mx-auto hidden max-w-xl flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('store.search')} className="input bg-ink-50 py-2.5 pl-10 pr-4" />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitch className="mr-2 hidden lg:inline-flex" />
            <div>
              <NotificationBell area="store" />
            </div>
            <UserMenu user={user} />
            <button className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <nav className={cn('border-t border-ink-100 bg-white', open ? 'block' : 'hidden md:block')}>
          <ul className="store-gutter flex flex-col md:flex-row md:gap-1">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href)
              return (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => setOpen(false)} className={cn('flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors', active ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800')}>
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <div className="flex-1">
        <div className="store-gutter pt-6 empty:hidden">
          <AccountBanners user={user} onboardingHref="/store/onboarding" />
        </div>
        {children}
      </div>

      <footer className="mt-16 border-t border-ink-200 bg-white text-ink-600">
        <div className="store-gutter grid gap-8 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">{t('store.footer.about')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t('store.footer.shop')}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/store" className="hover:text-brand-700">{t('store.nav.catalog')}</Link></li>
              <li><Link href="/store/orders" className="hover:text-brand-700">{t('store.nav.orders')}</Link></li>
              <li><Link href="/store/shipments" className="hover:text-brand-700">{t('store.nav.shipments')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t('store.footer.account')}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/store/account" className="hover:text-brand-700">{t('store.nav.account')}</Link></li>
              <li><Link href="/store/onboarding" className="hover:text-brand-700">{t('nav.onboarding')}</Link></li>
              <li><Link href="/store/notifications" className="hover:text-brand-700">{t('nav.notifications')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
          <Package className="mr-1.5 inline h-3 w-3" /> © {new Date().getFullYear()} Amazon Trade
        </div>
      </footer>
    </div>
  )
}
