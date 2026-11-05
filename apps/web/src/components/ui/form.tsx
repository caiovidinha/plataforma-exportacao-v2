'use client'
import { X } from 'lucide-react'
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Field({ label, help, error, required, children, className, htmlFor }: { label?: ReactNode; help?: ReactNode; error?: string; required?: boolean; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="error-text">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ invalid, className, ...rest }, ref) {
  return <input ref={ref} {...rest} className={cn('input', invalid && 'input-error', className)} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ invalid, className, ...rest }, ref) {
  return <textarea ref={ref} rows={3} {...rest} className={cn('input', invalid && 'input-error', className)} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; options: { value: string; label: string }[]; placeholder?: string }>(function Select(
  { invalid, className, options, placeholder, ...rest },
  ref,
) {
  return (
    <select ref={ref} {...rest} className={cn('input pr-8', invalid && 'input-error', className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
})

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-800">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
      <span>{label}</span>
    </label>
  )
}

/** Chips removíveis para listas de texto livre (NCM, certificações em texto...). */
export function TagsInput({ value, onChange, placeholder, validate }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; validate?: (v: string) => boolean }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v || value.includes(v) || (validate && !validate(v))) return
    onChange([...value, v])
    setDraft('')
  }
  return (
    <div className="rounded-lg border border-ink-300 bg-white p-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
      <div className="flex flex-wrap gap-1.5">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-xs text-ink-800">
            {v}
            <button type="button" aria-label={`remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="text-ink-400 hover:text-ink-800">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={add}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-ink-400 focus:ring-0"
        />
      </div>
    </div>
  )
}

/** Seleção múltipla por chips marcáveis (listas curtas: incoterms, certificações...). */
export function ChipSelect({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white text-ink-700 hover:border-ink-400')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Campo numérico que aceita vazio e devolve `number | undefined` (sem os problemas de `type=number` + zero à esquerda). */
export function NumberInput({ value, onChange, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: number | undefined; onChange: (v: number | undefined) => void; invalid?: boolean }) {
  return (
    <Input
      {...rest}
      type="number"
      inputMode="decimal"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
    />
  )
}
