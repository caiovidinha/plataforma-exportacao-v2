import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'
import type { ServiceProviderType } from '@/types'

export const metadata = { title: 'Despachantes' }

const fields = [
  { key: 'company_name',  label: 'Razão Social',   required: true, span: 'full' as const },
  { key: 'city',          label: 'Cidade' },
  { key: 'fixed_fee_brl', label: 'Taxa Fixa (R$)', type: 'number' as const },
  { key: 'rating',        label: 'Nota',           type: 'number' as const },
]

export default function DespachantesPage() {
  const items = mockData.service_providers.filter((p) => (p.type as ServiceProviderType) === 'DESPACHANTE')
  return (
    <EntityCrud title="Despachante" plural="Despachantes"
      items={items as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="city" />
  )
}
