import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'
import type { ServiceProviderType } from '@/types'

export const metadata = { title: 'Companhias de Navegação' }

const fields = [
  { key: 'company_name',  label: 'Razão Social',   required: true, span: 'full' as const },
  { key: 'city',          label: 'Sede' },
  { key: 'rating',        label: 'Nota',           type: 'number' as const },
]

export default function NavegacaoPage() {
  const items = mockData.service_providers.filter((p) => (p.type as ServiceProviderType) === 'COMPANHIA_NAVEGACAO')
  return (
    <EntityCrud title="Cia. de Navegação" plural="Companhias de Navegação"
      items={items as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="city" />
  )
}
