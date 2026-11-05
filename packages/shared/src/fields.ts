import { z } from 'zod'
import type { L } from './i18n'
import type { CompanyType, PartnerType } from './enums'
import { INCOTERMS, CURRENCIES } from './enums'
import { BR_STATES, CERTIFICATIONS, COUNTRIES, ORIGIN_PORTS, PORTS } from './reference'
import {
  isValidCnpj,
  isValidCpf,
  isValidIban,
  isValidNcm,
  isValidSwift,
  onlyDigits,
} from './validators'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'country'
  | 'cnpj'
  | 'cpf'
  | 'url'
  | 'tags'
  | 'ncm'
  | 'iban'
  | 'swift'

export type OptionsSource =
  | 'countries'
  | 'ports_br'
  | 'ports_all'
  | 'br_states'
  | 'certifications'
  | 'incoterms'
  | 'currencies'

export interface FieldOption {
  value: string
  label: L
}

export interface FieldDef {
  key: string
  label: L
  type: FieldType
  required?: boolean
  help?: L
  placeholder?: string
  options?: FieldOption[]
  optionsFrom?: OptionsSource
  /** Parceiros que precisam deste dado (alimenta o registro de requisitos e o guia). */
  partners?: PartnerType[]
  /** Só exibe/exige quando outro campo tem determinado valor. */
  showIf?: { key: string; equals: string | boolean }
  width?: 'full' | 'half' | 'third'
}

export interface SectionDef {
  key: string
  title: L
  description?: L
  companyType: CompanyType
  /** Seção obrigatória para enviar o cadastro à análise. */
  required: boolean
  /** Lista de itens (representantes, contas bancárias...) em vez de formulário único. */
  repeatable?: { min: number; max: number; itemLabel: L }
  fields: FieldDef[]
}

const opt = (v: string, pt: string, en = pt): FieldOption => ({ value: v, label: { pt, en } })
export const yesNo = (): FieldOption[] => [opt('YES', 'Sim', 'Yes'), opt('NO', 'Não', 'No')]

/** Resolve as opções de um campo (estáticas ou de listas de referência). */
export function resolveOptions(field: FieldDef): FieldOption[] {
  if (field.options) return field.options
  switch (field.optionsFrom) {
    case 'countries':
      return COUNTRIES.map((c) => ({ value: c.code, label: c.name }))
    case 'ports_br':
      return ORIGIN_PORTS.map((p) => ({ value: p.code, label: { pt: p.name, en: p.name } }))
    case 'ports_all':
      return PORTS.map((p) => ({ value: p.code, label: { pt: p.name, en: p.name } }))
    case 'br_states':
      return BR_STATES.map((s) => ({ value: s, label: { pt: s, en: s } }))
    case 'certifications':
      return CERTIFICATIONS.map((c) => ({ value: c.value, label: c.label }))
    case 'incoterms':
      return INCOTERMS.map((i) => ({ value: i, label: { pt: i, en: i } }))
    case 'currencies':
      return CURRENCIES.map((c) => ({ value: c, label: { pt: c, en: c } }))
    default:
      return []
  }
}

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

function baseSchema(field: FieldDef): z.ZodType {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return z.string().trim().max(field.type === 'textarea' ? 4000 : 300)
    case 'number':
      return z.preprocess(
        (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
        z.number().finite(),
      )
    case 'boolean':
      return z.boolean()
    case 'date':
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date')
    case 'email':
      return z.string().trim().toLowerCase().pipe(z.email())
    case 'phone':
      return z.string().trim().regex(/^\+?[0-9 ()\-.]{7,22}$/, 'invalid_phone')
    case 'country':
      return z.string().refine((v) => COUNTRIES.some((c) => c.code === v), 'invalid_country')
    case 'url':
      return z.string().trim().max(300).regex(/^https?:\/\/.+\..+/i, 'invalid_url')
    case 'cnpj':
      return z
        .string()
        .refine((v) => isValidCnpj(v), 'invalid_cnpj')
        .transform(onlyDigits)
    case 'cpf':
      return z
        .string()
        .refine((v) => isValidCpf(v), 'invalid_cpf')
        .transform(onlyDigits)
    case 'iban':
      return z
        .string()
        .refine((v) => isValidIban(v), 'invalid_iban')
        .transform((v) => v.replace(/\s+/g, '').toUpperCase())
    case 'swift':
      return z
        .string()
        .refine((v) => isValidSwift(v), 'invalid_swift')
        .transform((v) => v.trim().toUpperCase())
    case 'select': {
      const values = resolveOptions(field).map((o) => o.value)
      return z.string().refine((v) => values.includes(v), 'invalid_option')
    }
    case 'multiselect': {
      const values = resolveOptions(field).map((o) => o.value)
      return z.array(z.string().refine((v) => values.includes(v), 'invalid_option')).max(60)
    }
    case 'tags':
      return z.array(z.string().trim().min(1).max(80)).max(60)
    case 'ncm':
      return z
        .array(z.string().refine((v) => isValidNcm(v), 'invalid_ncm').transform(onlyDigits))
        .max(40)
  }
}

/** Schema de rascunho: tudo opcional, mas com tipo/formato validados quando preenchido. */
export function buildFieldDraftSchema(field: FieldDef): z.ZodType {
  return z.preprocess(emptyToUndefined, baseSchema(field).optional())
}

export function buildItemDraftSchema(section: SectionDef) {
  const shape: Record<string, z.ZodType> = {}
  for (const f of section.fields) shape[f.key] = buildFieldDraftSchema(f)
  return z.object(shape).strict()
}

export function buildSectionDraftSchema(section: SectionDef) {
  const item = buildItemDraftSchema(section)
  if (section.repeatable) {
    return z.object({ items: z.array(item).max(section.repeatable.max) }).strict()
  }
  return item
}

export type SectionData = Record<string, unknown> | { items: Record<string, unknown>[] }

export const hasValue = (v: unknown): boolean => {
  if (v === undefined || v === null) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.length > 0
  return true
}

/** O campo está ativo (visível/exigido) dado o item atual? */
export function fieldIsActive(field: FieldDef, item: Record<string, unknown>): boolean {
  if (!field.showIf) return true
  return item[field.showIf.key] === field.showIf.equals
}

export interface MissingField {
  section: string
  /** índice do item em seções repetíveis */
  index?: number
  field: string
}

/** Campos obrigatórios ainda não preenchidos numa seção. */
export function findMissingRequired(section: SectionDef, data: SectionData | undefined): MissingField[] {
  const missing: MissingField[] = []
  const check = (item: Record<string, unknown>, index?: number) => {
    for (const f of section.fields) {
      if (f.required && fieldIsActive(f, item) && !hasValue(item[f.key])) {
        missing.push({ section: section.key, index, field: f.key })
      }
    }
  }
  if (section.repeatable) {
    const items = (data && 'items' in data ? data.items : []) as Record<string, unknown>[]
    if (items.length < section.repeatable.min) {
      missing.push({ section: section.key, field: '__min_items__' })
    }
    items.forEach((it, i) => check(it, i))
  } else {
    check((data ?? {}) as Record<string, unknown>)
  }
  return missing
}
