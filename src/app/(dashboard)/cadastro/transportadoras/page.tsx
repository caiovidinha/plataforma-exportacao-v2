import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'
import type { ServiceProviderType } from '@/types'

export const metadata = { title: 'Transportadoras' }

const fields = [
  { key: 'company_name',  label: 'Razão Social',   required: true, span: 'full' as const },
  { key: 'city',          label: 'Cidade' },
  { key: 'coverage_area', label: 'Área de Cobertura', span: 'full' as const },
  { key: 'rating',        label: 'Nota',           type: 'number' as const },
]

export default function TransportadorasPage() {
  const items = mockData.service_providers.filter((p) => (p.type as ServiceProviderType) === 'TRANSPORTADORA')
  return (
    <EntityCrud title="Transportadora" plural="Transportadoras"
      items={items as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="city" />
  )
}
