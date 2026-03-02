import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'
import type { ServiceProviderType } from '@/types'

export const metadata = { title: 'Corretoras de Câmbio' }

const fields = [
  { key: 'company_name',       label: 'Razão Social',        required: true, span: 'full' as const },
  { key: 'city',               label: 'Cidade' },
  { key: 'exchange_rate_usd',  label: 'Câmbio USD hoje',     type: 'number' as const },
  { key: 'rating',             label: 'Nota',                type: 'number' as const },
]

export default function CorretorasPage() {
  const items = mockData.service_providers.filter((p) => (p.type as ServiceProviderType) === 'CORRETORA')
  return (
    <EntityCrud title="Corretora" plural="Corretoras de Câmbio"
      items={items as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="city" />
  )
}
