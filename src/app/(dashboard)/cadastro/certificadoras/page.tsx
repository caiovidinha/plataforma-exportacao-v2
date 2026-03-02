import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'
import type { ServiceProviderType } from '@/types'

export const metadata = { title: 'Certificadoras' }

const fields = [
  { key: 'company_name',  label: 'Razão Social',   required: true, span: 'full' as const },
  { key: 'city',          label: 'Cidade' },
  { key: 'rating',        label: 'Nota',           type: 'number' as const },
]

export default function CertificadorasPage() {
  const items = mockData.service_providers.filter((p) => (p.type as ServiceProviderType) === 'CERTIFICADORA')
  return (
    <EntityCrud title="Certificadora" plural="Certificadoras"
      items={items as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="city" />
  )
}
