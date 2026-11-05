import { OrdersList } from '@/components/orders/OrdersList'

export const metadata = { title: 'Pedidos' }
export default function Page() {
  return <OrdersList viewer="exporter" />
}
