import { DashboardView } from '@/components/pages/DashboardView'
import { TeamPage } from '@/components/pages/TeamPage'
import { StorePage } from '@/components/layout/StorePage'

export const metadata = { title: 'Minha conta' }
export default function Page() {
  return (
    <StorePage>
      <DashboardView base="/store" />
      <div className="mt-10">
        <TeamPage />
      </div>
    </StorePage>
  )
}
