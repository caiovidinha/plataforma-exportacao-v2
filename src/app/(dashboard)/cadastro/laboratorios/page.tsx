import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'
import type { ServiceProviderType } from '@/types'

export const metadata = { title: 'Laboratórios' }

const fields = [
  { key: 'company_name',    label: 'Razão Social',       required: true, span: 'full' as const },
  { key: 'city',            label: 'Cidade' },
  { key: 'mapa_accredited', label: 'Credenciado MAPA',   type: 'select' as const, options: ['true','false'] },
  { key: 'rating',          label: 'Nota',               type: 'number' as const },
]

export default function LaboratoriosPage() {
  const items = mockData.service_providers
    .filter((p) => (p.type as ServiceProviderType) === 'LABORATORIO')
    .map((p) => ({ ...p, mapa_accredited: String((p as Record<string,unknown>).mapa_accredited ?? 'false') }))
  return (
    <EntityCrud title="Laboratório" plural="Laboratórios"
      items={items as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="city" />
  )
}
