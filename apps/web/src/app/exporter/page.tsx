import { DashboardView } from '@/components/pages/DashboardView'

export const metadata = { title: 'Visão geral' }
export default function Page() {
  return <DashboardView base="/exporter" />
}
