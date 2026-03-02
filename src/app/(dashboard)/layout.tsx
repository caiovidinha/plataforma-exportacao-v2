import { Sidebar } from '@/components/layout/Sidebar'

// In production, fetch user from auth session
// For now, read from mock
import mockData from '@/mock/data.json'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const mapaRegistered = mockData.user.mapa_registered

  return (
    <div className="flex min-h-screen">
      <Sidebar mapaRegistered={mapaRegistered} />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
