import mockData from '@/mock/data.json'
import { EntityCrud } from '@/components/ui/EntityCrud'

export const metadata = { title: 'Produtos' }

const fields = [
  { key: 'name',         label: 'Nome do Produto',  required: true, span: 'full' as const },
  { key: 'ncm_code',     label: 'NCM',              required: true },
  { key: 'organic',      label: 'Orgânico',         type: 'select' as const, options: ['true','false'] },
  { key: 'origin_state', label: 'Estado de Origem', type: 'select' as const, options: ['AC','AM','PA','RO','RR','AP','TO'] },
  { key: 'moisture_percent', label: 'Teor de Umidade (%)', type: 'number' as const },
  { key: 'description',  label: 'Descrição',        type: 'textarea' as const, span: 'full' as const },
]

const products = mockData.products.map((p) => ({
  ...p,
  organic: String((p as Record<string,unknown>).organic ?? 'false'),
  moisture_percent: String((p.physicochemical as Record<string,unknown>).moisture_percent ?? '-'),
}))

export default function ProdutosPage() {
  return (
    <EntityCrud
      title="Produto" plural="Produtos"
      items={products as Record<string, unknown>[]}
      fields={fields} displayKey="name" secondaryKey="ncm_code"
    />
  )
}
