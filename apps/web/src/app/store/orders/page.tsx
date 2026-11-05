import { OrdersList } from '@/components/orders/OrdersList'
import { StorePage } from '@/components/layout/StorePage'

export const metadata = { title: 'Meus pedidos' }
export default function Page() {
  return (
    <StorePage>
      <OrdersList viewer="importer" />
    </StorePage>
  )
}
