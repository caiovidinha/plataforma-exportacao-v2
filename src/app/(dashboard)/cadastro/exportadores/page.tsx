import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'

export const metadata = { title: 'Exportadores' }

const fields = [
  { key: 'company_name',   label: 'Razão Social',    required: true, span: 'full' as const },
  { key: 'cnpj',          label: 'CNPJ',             required: true },
  { key: 'contact_email', label: 'E-mail',           type: 'email' as const },
  { key: 'contact_phone', label: 'Telefone',         type: 'tel' as const },
  { key: 'city',          label: 'Cidade' },
  { key: 'uf',            label: 'UF' },
  { key: 'siscomex_code', label: 'Código SISCOMEX' },
  { key: 'mapa_registered', label: 'Registro MAPA', type: 'select' as const, options: ['true','false'] },
]

export default function ExportadoresPage() {
  return (
    <EntityCrud
      title="Exportador" plural="Exportadores"
      items={mockData.exporters as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="cnpj"
    />
  )
}
