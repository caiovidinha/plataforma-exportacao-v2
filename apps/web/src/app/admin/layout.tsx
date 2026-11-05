'use client'
import { Activity, Bell, Building2, Database, GaugeCircle, Handshake, ListChecks, Scale, ShieldCheck, ShoppingBag, Ship, Tags, Users } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { SidebarShell, type NavItem } from '@/components/layout/SidebarShell'
import { useGuard } from '@/lib/session'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useGuard('STAFF')
  const nav = useMemo<NavItem[]>(() => {
    const role = user?.platformRole
    const ops = role === 'OPERATIONS' || role === 'PLATFORM_ADMIN'
    const compliance = role === 'COMPLIANCE' || role === 'PLATFORM_ADMIN'
    return [
      { href: '/admin', label: 'nav.overview', icon: GaugeCircle, exact: true },
      ...(compliance || ops ? [{ href: '/admin/compliance', label: 'nav.compliance' as const, icon: ShieldCheck }, { href: '/admin/companies', label: 'nav.companies' as const, icon: Building2 }] : []),
      ...(ops
        ? [
            { href: '/admin/orders', label: 'nav.orders' as const, icon: ShoppingBag },
            { href: '/admin/shipments', label: 'nav.shipments' as const, icon: Ship },
            { href: '/admin/partners', label: 'nav.partners' as const, icon: Handshake },
            { href: '/admin/jobs', label: 'nav.jobs' as const, icon: ListChecks },
            { href: '/admin/logs', label: 'nav.logs' as const, icon: Activity },
            { href: '/admin/data-shares', label: 'nav.dataShares' as const, icon: Database },
            { href: '/admin/pricing', label: 'nav.pricing' as const, icon: Scale },
            { href: '/admin/tariffs', label: 'nav.tariffs' as const, icon: Tags },
          ]
        : []),
      ...(role === 'PLATFORM_ADMIN' ? [{ href: '/admin/users', label: 'nav.users' as const, icon: Users }] : []),
      { href: '/admin/notifications', label: 'nav.notifications', icon: Bell },
    ]
  }, [user?.platformRole])
  return (
    <SidebarShell user={user} area="admin" nav={nav} tag="Backoffice">
      {children}
    </SidebarShell>
  )
}

