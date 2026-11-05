'use client'

import { useMockSession } from '@/lib/mock-session'
import { OrderBox } from '@/components/pedidos/OrderBox'
import type { Order } from '@/types'

export function PedidoDetailClient({ order }: { order: Order }) {
  const { entityType } = useMockSession()
  return <OrderBox order={order} entityType={entityType} />
}
