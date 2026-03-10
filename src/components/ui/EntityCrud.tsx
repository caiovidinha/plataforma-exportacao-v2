'use client'

import { useState } from 'react'
import { Plus, Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

export interface EntityField {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea'
  options?: string[]
  required?: boolean
  span?: 'full' | 'half'
}

export interface EntityCrudProps<T extends Record<string, unknown>> {
  title: string
  plural: string
  items: T[]
  fields: EntityField[]
  displayKey: string
  secondaryKey?: string
}

export function EntityCrud<T extends Record<string, unknown>>({
  title, plural, items: initial, fields, displayKey, secondaryKey,
}: EntityCrudProps<T>) {
  const t = useTranslations('crud')
  const [items, setItems] = useState(initial)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const filtered = items.filter((it) =>
    String(it[displayKey] ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  function startNew() {
    setForm({})
    setEditId(null)
    setOpen(true)
  }

  function startEdit(it: T) {
    setForm(Object.fromEntries(fields.map((f) => [f.key, String(it[f.key] ?? '')])))
    setEditId(String(it.id ?? ''))
    setOpen(true)
  }

  function handleSave() {
    if (editId) {
      setItems((prev) => prev.map((it) => (String(it.id) === editId ? { ...it, ...form } as T : it)))
    } else {
      setItems((prev) => [{ ...form, id: `new_${Date.now()}` } as unknown as T, ...prev])
    }
    setOpen(false)
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((it) => String(it.id) !== id))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{plural}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('recordCount', { count: filtered.length })}</p>
        </div>
        <button className="btn-primary" onClick={startNew}>
          <Plus className="w-4 h-4 mr-1" /> {t('newBtn', { title })}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input pl-9 w-full max-w-xs" placeholder={t('searchPlaceholder', { plural })}
               value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">{t('noRecords')}</p>
        )}
        {filtered.map((it) => {
          const id = String(it.id ?? '')
          const isExpanded = expanded === id
          return (
            <div key={id} className="card">
              <button className="w-full flex items-center justify-between text-left gap-2"
                      onClick={() => setExpanded(isExpanded ? null : id)}>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{String(it[displayKey] ?? '-')}</p>
                  {secondaryKey && <p className="text-xs text-slate-500 mt-0.5">{String(it[secondaryKey] ?? '')}</p>}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {isExpanded && (
                <div className="mt-4 border-t border-slate-700 pt-4 space-y-3">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    {fields.map((f) => (
                      <div key={f.key} className={f.span === 'full' ? 'col-span-2' : ''}>
                        <dt className="text-slate-500">{f.label}</dt>
                        <dd className="text-slate-200 font-medium truncate">{String(it[f.key] ?? '-')}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex gap-2 pt-2">
                    <button className="btn-secondary text-xs" onClick={() => startEdit(it)}>{t('editBtn')}</button>
                    <button className="btn-ghost text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={() => handleDelete(id)}>
                      {t('deleteBtn')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">{editId ? t('editModal', { title }) : t('newModal', { title })}</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={f.span === 'full' ? 'col-span-2' : ''}>
                  <label className="label">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea className="input h-24 resize-none" value={form[f.key] ?? ''}
                              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
                  ) : f.type === 'select' ? (
                    <select className="input" value={form[f.key] ?? ''}
                            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}>
                      <option value="">{t('selectOption')}</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="input" type={f.type ?? 'text'} value={form[f.key] ?? ''}
                           onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-ghost" onClick={() => setOpen(false)}>{t('cancelBtn')}</button>
              <button className="btn-primary" onClick={handleSave}>{t('saveBtn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
