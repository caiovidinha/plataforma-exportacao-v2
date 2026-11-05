import { ShipmentDetail } from '@/components/shipments/ShipmentDetail'

export default function Page({ params }: { params: { id: string } }) {
  return <ShipmentDetail id={params.id} viewer="admin" backHref="/admin/shipments" />
}
