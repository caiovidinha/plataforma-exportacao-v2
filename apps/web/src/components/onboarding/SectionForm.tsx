'use client'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fieldIsActive, hasValue, type MissingField, type SectionData, type SectionDef } from '@amazon-trade/shared'
import { Button } from '@/components/ui/primitives'
import { ApiError } from '@/lib/api'
import { useL, useT } from '@/lib/i18n'
import { FieldInput } from './FieldInput'

type Item = Record<string, unknown>
const clean = (item: Item): Item => Object.fromEntries(Object.entries(item).filter(([, v]) => hasValue(v) || v === false))

/** Converte o estado local no payload da API (remove vazios). */
function toPayload(section: SectionDef, items: Item[]): SectionData {
  return section.repeatable ? { items: items.map(clean) } : clean(items[0] ?? {})
}

export function parseSaveErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || !Array.isArray(err.details)) return {}
  const out: Record<string, string> = {}
  for (const d of err.details as { path: string; message: string }[]) out[d.path.replace(/^items\./, '')] = d.message
  return out
}

/**
 * Formulário de uma seção do cadastro, gerado a partir da definição (`SectionDef`).
 * Seções repetíveis (representantes, contas...) viram uma lista de cartões.
 */
export function SectionForm({
  section,
  data,
  disabled,
  missing,
  saving,
  errors,
  onSave,
  onDirty,
}: {
  section: SectionDef
  data: SectionData | undefined
  disabled?: boolean
  missing: MissingField[]
  saving?: boolean
  errors: Record<string, string>
  onSave: (payload: SectionData) => void
  onDirty: (dirty: boolean, payload: () => SectionData) => void
}) {
  const t = useT()
  const tl = useL()
  const initial = useMemo<Item[]>(() => {
    if (section.repeatable) {
      const items = data && 'items' in data ? (data.items as Item[]) : []
      return items.length >= section.repeatable.min ? items : [...items, ...Array.from({ length: section.repeatable.min - items.length }, () => ({}))]
    }
    return [(data ?? {}) as Item]
  }, [data, section])
  const [items, setItems] = useState<Item[]>(initial)
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    setItems(initial)
    setDirty(false)
  }, [initial])

  const update = (next: Item[]) => {
    setItems(next)
    setDirty(true)
    onDirty(true, () => toPayload(section, next))
  }
  const setField = (idx: number, key: string, value: unknown) => update(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  const rep = section.repeatable
  const isMissing = (idx: number, key: string) => missing.some((m) => m.field === key && (m.index ?? 0) === idx)

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(toPayload(section, items))
      }}
    >
      {items.map((item, idx) => (
        <fieldset key={idx} disabled={disabled} className={rep ? 'rounded-xl border border-ink-200 bg-ink-50/50 p-4' : undefined}>
          {rep && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-800">
                {tl(rep.itemLabel)} #{idx + 1}
              </p>
              {!disabled && items.length > rep.min && (
                <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline" onClick={() => update(items.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3.5 w-3.5" /> {t('common.remove')}
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-6">
            {section.fields
              .filter((f) => fieldIsActive(f, item))
              .map((f) => (
                <FieldInput
                  key={f.key}
                  def={f}
                  value={item[f.key]}
                  disabled={disabled}
                  onChange={(v) => setField(idx, f.key, v)}
                  error={errors[rep ? `${idx}.${f.key}` : f.key]}
                  missing={isMissing(idx, f.key)}
                />
              ))}
          </div>
        </fieldset>
      ))}

      {rep && !disabled && items.length < rep.max && (
        <Button variant="secondary" onClick={() => update([...items, {}])}>
          <Plus className="h-4 w-4" /> {t('onboarding.add', { item: tl(rep.itemLabel) })}
        </Button>
      )}
      {rep && missing.some((m) => m.field === '__min_items__') && <p className="error-text">{t('onboarding.minItems', { n: rep.min })}</p>}

      {!disabled && (
        <div className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
          {dirty && <span className="text-xs text-amber-600">{t('onboarding.unsaved')}</span>}
          <Button type="submit" loading={saving} disabled={!dirty && !saving}>
            {t('onboarding.save')}
          </Button>
        </div>
      )}
    </form>
  )
}
