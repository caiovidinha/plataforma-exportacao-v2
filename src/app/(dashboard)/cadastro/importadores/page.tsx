import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'

export const metadata = { title: 'Importadores' }

const fields = [
  { key: 'company_name',   label: 'Company Name',     required: true, span: 'full' as const },
  { key: 'vat_number',     label: 'VAT / Tax ID',     required: true },
  { key: 'country_code',   label: 'País (ISO)',        type: 'text' as const },
  { key: 'contact_email',  label: 'E-mail',           type: 'email' as const },
  { key: 'contact_phone',  label: 'Phone',            type: 'tel' as const },
  { key: 'preferred_incoterm', label: 'Incoterm Preferido', type: 'select' as const, options: ['FOB','CIF','CFR','EXW','DDP'] },
  { key: 'target_port',    label: 'Porto de Destino' },
]

export default function ImportadoresPage() {
  return (
    <EntityCrud
      title="Importador" plural="Importadores"
      items={mockData.importers as Record<string, unknown>[]}
      fields={fields} displayKey="company_name" secondaryKey="country_code"
    />
  )
}
