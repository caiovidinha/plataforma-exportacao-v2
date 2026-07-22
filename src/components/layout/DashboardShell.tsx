'use client'

import { useMockSession } from '@/lib/mock-session'
import { Sidebar } from '@/components/layout/Sidebar'
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader'
import { MockEntitySwitcher } from '@/components/dev/MockEntitySwitcher'
import { featureFlags } from '@/lib/feature-flags'
import { ENTITY_CONFIG } from '@/lib/entity-config'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, entityType } = useMockSession()

  if (entityType === 'importador') {
    return (
      <div className="min-h-screen">
        <MarketplaceHeader userName={user.name} companyName={user.company_name} />
        <main className="min-h-screen pt-[104px]">
          {children}
        </main>
        {featureFlags.useMockData && <MockEntitySwitcher />}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        entityType={entityType}
        userName={user.name}
        companyName={user.company_name}
        mapaRegistered={user.mapa_registered}
        roleLabel={ENTITY_CONFIG[entityType].label}
      />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
      {featureFlags.useMockData && <MockEntitySwitcher />}
    </div>
  )
}
