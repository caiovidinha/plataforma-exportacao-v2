import type { L } from './i18n'
import type { CompanyType, DocumentStatus, PartnerType } from './enums'
import { PARTNER_TYPES } from './enums'
import type { SectionData } from './fields'
import { fieldIsActive, findMissingRequired, hasValue } from './fields'
import { documentTypesFor } from './documents'
import { sectionsFor } from './onboarding'

/**
 * REGISTRO DE REQUISITOS DE DADOS
 * Fonte única que liga cada campo/documento do cadastro aos parceiros que precisam dele.
 * Alimenta: (1) completude por parceiro na API; (2) minimização de dados (`data_shares`);
 * (3) o guia de integração com parceiros (gerado automaticamente).
 */
export interface RequirementEntry {
  kind: 'field' | 'document'
  companyType: CompanyType
  /** Seção (campos) ou null (documentos). */
  section: string | null
  key: string
  label: L
  repeatable: boolean
  /** Obrigatório para enviar o cadastro. */
  required: boolean
  partners: PartnerType[]
}

export function buildRequirementRegistry(): RequirementEntry[] {
  const out: RequirementEntry[] = []
  for (const companyType of ['EXPORTER', 'IMPORTER'] as CompanyType[]) {
    for (const section of sectionsFor(companyType)) {
      for (const f of section.fields) {
        if (!f.partners?.length) continue
        out.push({
          kind: 'field',
          companyType,
          section: section.key,
          key: f.key,
          label: f.label,
          repeatable: !!section.repeatable,
          required: !!f.required,
          partners: f.partners,
        })
      }
    }
    for (const d of documentTypesFor(companyType)) {
      if (!d.partners?.length) continue
      out.push({
        kind: 'document',
        companyType,
        section: null,
        key: d.key,
        label: d.label,
        repeatable: false,
        required: d.required,
        partners: d.partners,
      })
    }
  }
  return out
}

export const REQUIREMENT_REGISTRY: RequirementEntry[] = buildRequirementRegistry()

export const requirementsForPartner = (partner: PartnerType, companyType?: CompanyType) =>
  REQUIREMENT_REGISTRY.filter(
    (r) => r.partners.includes(partner) && (!companyType || r.companyType === companyType),
  )

export interface DocumentState {
  typeKey: string
  status: DocumentStatus
}

export interface ReadinessInput {
  companyType: CompanyType
  sections: Record<string, SectionData | undefined>
  documents: DocumentState[]
}

export interface MissingRequirement {
  kind: 'field' | 'document' | 'min_items'
  section: string | null
  key: string
  label: L | null
  index?: number
}

export interface Readiness {
  percent: number
  ready: boolean
  total: number
  missing: MissingRequirement[]
}

const docSatisfied = (docs: DocumentState[], key: string, mode: 'uploaded' | 'approved') =>
  docs.some((d) =>
    d.typeKey === key && (mode === 'approved' ? d.status === 'APPROVED' : d.status === 'PENDING' || d.status === 'APPROVED'),
  )

/**
 * Completude para enviar o cadastro à análise (todas as seções e documentos obrigatórios)
 * ou, com `partner`, completude dos dados que aquele parceiro exige (campos obrigatórios + documentos aprovados).
 */
export function computeReadiness(input: ReadinessInput, partner?: PartnerType): Readiness {
  const missing: MissingRequirement[] = []
  let total = 0
  let done = 0
  const sections = sectionsFor(input.companyType)

  if (!partner) {
    for (const section of sections) {
      if (!section.required) continue
      const miss = findMissingRequired(section, input.sections[section.key])
      total += 1
      if (miss.length === 0) done += 1
      for (const m of miss) {
        if (m.field === '__min_items__') {
          missing.push({ kind: 'min_items', section: section.key, key: section.key, label: section.title })
        } else {
          const f = section.fields.find((x) => x.key === m.field)
          missing.push({ kind: 'field', section: section.key, key: m.field, label: f?.label ?? null, index: m.index })
        }
      }
    }
    for (const d of documentTypesFor(input.companyType).filter((x) => x.required)) {
      total += 1
      if (!docSatisfied(input.documents, d.key, 'uploaded')) {
        missing.push({ kind: 'document', section: null, key: d.key, label: d.label })
      } else done += 1
    }
  } else {
    for (const r of requirementsForPartner(partner, input.companyType)) {
      if (!r.required) continue
      total += 1
      const before = missing.length
      if (r.kind === 'document') {
        if (!docSatisfied(input.documents, r.key, 'approved')) {
          missing.push({ kind: 'document', section: null, key: r.key, label: r.label })
        } else done += 1
        continue
      }
      const section = sections.find((s) => s.key === r.section)!
      const data = input.sections[section.key]
      const field = section.fields.find((f) => f.key === r.key)!
      const items: Record<string, unknown>[] = section.repeatable
        ? ((data && 'items' in data ? data.items : []) as Record<string, unknown>[])
        : [(data ?? {}) as Record<string, unknown>]
      if (section.repeatable && items.length === 0) {
        missing.push({ kind: 'field', section: section.key, key: r.key, label: r.label })
        continue
      }
      items.forEach((item, index) => {
        if (fieldIsActive(field, item) && !hasValue(item[r.key])) {
          missing.push({ kind: 'field', section: section.key, key: r.key, label: r.label, index: section.repeatable ? index : undefined })
        }
      })
      if (missing.length === before) done += 1
    }
  }

  return {
    percent: total === 0 ? 100 : Math.round((done / total) * 100),
    ready: missing.length === 0,
    total,
    missing,
  }
}

export const readinessByPartner = (input: ReadinessInput) =>
  Object.fromEntries(PARTNER_TYPES.map((p) => [p, computeReadiness(input, p)])) as Record<PartnerType, Readiness>
