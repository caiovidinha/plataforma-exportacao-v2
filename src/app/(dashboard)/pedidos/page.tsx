import { getOrders } from '@/lib/api'
import { PedidosListClient } from './PedidosListClient'

export const metadata = { title: 'Pedidos' }

export default async function PedidosPage() {
  const orders = await getOrders()
  return <PedidosListClient initialOrders={orders} />
}
