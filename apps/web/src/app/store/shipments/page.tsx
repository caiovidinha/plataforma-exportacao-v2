import { ShipmentsList } from '@/components/shipments/ShipmentsList'
import { StorePage } from '@/components/layout/StorePage'

export const metadata = { title: 'Embarques' }
export default function Page() {
  return (
    <StorePage>
      <ShipmentsList viewer="importer" />
    </StorePage>
  )
}
