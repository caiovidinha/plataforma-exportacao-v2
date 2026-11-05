import { OrderDetail } from '@/components/orders/OrderDetail'
import { StorePage } from '@/components/layout/StorePage'

export default function Page({ params }: { params: { id: string } }) {
  return (
    <StorePage>
      <OrderDetail id={params.id} viewer="importer" />
    </StorePage>
  )
}
