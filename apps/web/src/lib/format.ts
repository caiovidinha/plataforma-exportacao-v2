import { COUNTRIES, portByCode } from '@amazon-trade/shared'
import type { Currency } from '@amazon-trade/shared'

export const fmtMoney = (value: number, currency: Currency | string = 'USD', locale = 'pt-BR', digits = 2) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)

export const fmtNumber = (value: number, locale = 'pt-BR', digits = 0) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)

export const fmtKg = (kg: number, locale = 'pt-BR') => (kg >= 1000 ? `${fmtNumber(kg / 1000, locale, kg % 1000 === 0 ? 0 : 1)} t` : `${fmtNumber(kg, locale)} kg`)

export const fmtDate = (iso: string | null | undefined, locale = 'pt-BR', withTime = false) => {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return new Intl.DateTimeFormat(locale, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(d)
}

export const fmtRelative = (iso: string, locale = 'pt-BR') => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}

export const countryName = (code: string, locale: 'pt' | 'en' = 'pt') => {
  const c = COUNTRIES.find((x) => x.code === code)
  return c ? c.name[locale] ?? c.name.pt : code
}

export const portName = (code: string) => portByCode(code)?.name ?? code

export const fmtBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

/** Bandeira (emoji) a partir do código ISO-2. */
export const flag = (code: string) => (code.length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : '')

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('')
