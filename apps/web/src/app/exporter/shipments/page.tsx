import { ShipmentsList } from '@/components/shipments/ShipmentsList'

export const metadata = { title: 'Embarques' }
export default function Page() {
  return <ShipmentsList viewer="exporter" />
}
