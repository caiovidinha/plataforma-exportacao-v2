import { cookies } from 'next/headers'
import { translate, type Locale, type MessageKey } from './i18n-core'

export function getLocale(): Locale {
  const v = cookies().get('locale')?.value
  return v === 'en' || v === 'es' ? v : 'pt'
}

/** Tradutor para Server Components (landing). */
export function getT() {
  const locale = getLocale()
  return { locale, t: (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars) }
}
