import { NotificationsPage } from '@/components/pages/NotificationsPage'
import { StorePage } from '@/components/layout/StorePage'

export default function Page() {
  return (
    <StorePage>
      <NotificationsPage area="store" />
    </StorePage>
  )
}
