'use client'
import { isValidNcm, resolveOptions, type FieldDef } from '@amazon-trade/shared'
import { ChipSelect, Field, Input, NumberInput, Select, TagsInput, Textarea } from '@/components/ui/form'
import { useL, useT } from '@/lib/i18n'

/** Traduz códigos de erro de validação da API (`invalid_cnpj`...) para texto amigável. */
export function useFieldError() {
  const t = useT()
  return (code: string | undefined) => {
    if (!code) return undefined
    const key = `field.err.${code}`
    // chaves dinâmicas: cai no código bruto se não houver tradução
    const text = t(key as never)
    return text === key ? t('field.err.generic') : text
  }
}

const INPUT_TYPE: Partial<Record<FieldDef['type'], string>> = { email: 'email', phone: 'tel', url: 'url', date: 'date' }

export function FieldInput({
  def,
  value,
  onChange,
  error,
  disabled,
  missing,
}: {
  def: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  error?: string
  disabled?: boolean
  /** Obrigatório e ainda vazio (destacado após tentativa de envio). */
  missing?: boolean
}) {
  const t = useT()
  const tl = useL()
  const fieldError = useFieldError()
  const options = def.type === 'select' || def.type === 'multiselect' || def.type === 'country' ? resolveOptions(def).map((o) => ({ value: o.value, label: tl(o.label) })) : []
  const invalid = !!error || !!missing
  const errText = error ? fieldError(error) : missing ? t('field.required') : undefined
  const common = { invalid, disabled }
  const span = def.width === 'third' ? 'sm:col-span-2' : def.width === 'half' ? 'sm:col-span-3' : 'sm:col-span-6'

  let control
  switch (def.type) {
    case 'textarea':
      control = <Textarea {...common} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} />
      break
    case 'number':
      control = <NumberInput {...common} value={value as number | undefined} onChange={onChange} placeholder={def.placeholder} />
      break
    case 'boolean':
      control = (
        <Select
          {...common}
          placeholder="—"
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}
          options={[
            { value: 'true', label: t('common.yes') },
            { value: 'false', label: t('common.no') },
          ]}
        />
      )
      break
    case 'select':
    case 'country':
      control = <Select {...common} placeholder="—" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || undefined)} options={options} />
      break
    case 'multiselect':
      control = (
        <div className={options.length > 14 ? 'max-h-44 overflow-y-auto rounded-lg border border-ink-200 p-2' : undefined}>
          <ChipSelect options={options} value={(value as string[]) ?? []} onChange={(v) => onChange(v.length ? v : undefined)} />
        </div>
      )
      break
    case 'tags':
      control = <TagsInput value={(value as string[]) ?? []} onChange={(v) => onChange(v.length ? v : undefined)} placeholder={def.placeholder ?? t('field.tagsHint')} />
      break
    case 'ncm':
      control = <TagsInput value={(value as string[]) ?? []} onChange={(v) => onChange(v.length ? v : undefined)} placeholder={def.placeholder ?? '0801.21.00'} validate={isValidNcm} />
      break
    default:
      control = (
        <Input
          {...common}
          type={INPUT_TYPE[def.type] ?? 'text'}
          inputMode={def.type === 'cnpj' || def.type === 'cpf' ? 'numeric' : undefined}
          autoCapitalize={def.type === 'swift' || def.type === 'iban' ? 'characters' : undefined}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
        />
      )
  }
  return (
    <Field className={span} label={tl(def.label)} required={def.required} help={def.help ? tl(def.help) : undefined} error={errText}>
      {control}
    </Field>
  )
}
