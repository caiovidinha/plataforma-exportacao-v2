import { resolveOptions, type CompanyType, type FieldDef, type SectionDef } from '@amazon-trade/shared'

/**
 * Geradores de DADOS FICTÍCIOS para testes e para o seed de demonstração (nunca usados em produção).
 * Tudo é derivado das definições do cadastro, então acompanha mudanças nos campos automaticamente.
 */

/** Valor válido plausível para um campo. */
export function sampleValue(f: FieldDef): unknown {
  switch (f.type) {
    case 'text': return f.key === 'bankCode' ? '001' : `Sample ${f.key}`.slice(0, 80)
    case 'textarea': return 'Texto de exemplo'
    case 'number': return 10
    case 'boolean': return true
    case 'date': return '2020-05-10'
    case 'email': return 'contato@example.com'
    case 'phone': return '+55 91 99999-0000'
    case 'country': return 'BR'
    case 'url': return 'https://example.com'
    case 'cnpj': return '11222333000181'
    case 'cpf': return '52998224725'
    case 'iban': return 'DE89370400440532013000'
    case 'swift': return 'DEUTDEFF'
    case 'select': return resolveOptions(f)[0]!.value
    case 'multiselect': return [resolveOptions(f)[0]!.value]
    case 'tags': return ['tag']
    case 'ncm': return ['08012100']
  }
}

export function sampleItem(section: SectionDef): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  for (const f of section.fields) {
    if (f.showIf) continue
    item[f.key] = sampleValue(f)
  }
  // coerência para campos condicionais
  if (section.key === 'importRegulatory') item.notifySameAsConsignee = 'YES'
  if (section.key === 'insuranceInfo') { item.hasCargoInsurance = 'NO'; item.claimsLast3Years = 'NONE' }
  if (section.key === 'tradeRegistrations') item.hasExportExperience = 'NO'
  if (section.key === 'credit') item.hasPaymentDefaults = 'NO'
  return item
}

export function sampleSectionData(section: SectionDef, companyType: CompanyType, seq = 0) {
  const item = sampleItem(section)
  if (section.key === 'company') {
    if (companyType === 'EXPORTER') {
      item.legalName = `Exportadora Teste ${seq} Ltda.`
      item.cnpj = ['11222333000181', '45723174000110', '11444777000161'][seq % 3]
    } else {
      item.legalName = `Importer Test ${seq} GmbH`
      item.taxId = `DE${100000000 + seq}`
      item.country = 'DE'
    }
  }
  if (section.key === 'declarations') for (const f of section.fields) item[f.key] = true
  if (!section.repeatable) return item
  const items = Array.from({ length: Math.max(section.repeatable.min, 1) }, () => ({ ...item }))
  return { items }
}
