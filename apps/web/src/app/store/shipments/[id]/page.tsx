import { ShipmentDetail } from '@/components/shipments/ShipmentDetail'
import { StorePage } from '@/components/layout/StorePage'

export default function Page({ params }: { params: { id: string } }) {
  return (
    <StorePage>
      <ShipmentDetail id={params.id} viewer="importer" backHref="/store/shipments" />
    </StorePage>
  )
}
