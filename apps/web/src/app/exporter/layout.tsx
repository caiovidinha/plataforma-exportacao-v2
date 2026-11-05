'use client'
import { Bell, ClipboardList, LayoutDashboard, PackageSearch, ShoppingBag, Ship, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { SidebarShell, type NavItem } from '@/components/layout/SidebarShell'
import { useGuard } from '@/lib/session'

const NAV: NavItem[] = [
  { href: '/exporter', label: 'nav.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/exporter/products', label: 'nav.products', icon: PackageSearch },
  { href: '/exporter/orders', label: 'nav.orders', icon: ShoppingBag },
  { href: '/exporter/shipments', label: 'nav.shipments', icon: Ship },
  { href: '/exporter/onboarding', label: 'nav.onboarding', icon: ClipboardList },
  { href: '/exporter/team', label: 'nav.team', icon: Users },
  { href: '/exporter/notifications', label: 'nav.notifications', icon: Bell },
]

export default function ExporterLayout({ children }: { children: ReactNode }) {
  const { user } = useGuard('EXPORTER')
  return (
    <SidebarShell user={user} area="exporter" nav={NAV} onboardingHref="/exporter/onboarding">
      {children}
    </SidebarShell>
  )
}
