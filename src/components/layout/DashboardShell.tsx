'use client'

import { useMockSession } from '@/lib/mock-session'
import { Sidebar } from '@/components/layout/Sidebar'
import { MockEntitySwitcher } from '@/components/dev/MockEntitySwitcher'
import { featureFlags } from '@/lib/feature-flags'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, entityType } = useMockSession()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        entityType={entityType}
        userName={user.name}
        companyName={user.company_name}
        mapaRegistered={user.mapa_registered}
        roleLabel={user.role_label}
      />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
      {featureFlags.useMockData && <MockEntitySwitcher />}
    </div>
  )
}
