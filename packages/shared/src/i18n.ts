export type Locale = 'pt' | 'en' | 'es'
export const LOCALES: Locale[] = ['pt', 'en', 'es']
export const DEFAULT_LOCALE: Locale = 'pt'

/** Texto de domínio. pt e en são obrigatórios; es é opcional e cai para en quando ausente. */
export interface L {
  pt: string
  en: string
  es?: string
}
export const L = (pt: string, en: string, es?: string): L => (es ? { pt, en, es } : { pt, en })
export const tr = (text: L, locale: Locale): string => text[locale] ?? (locale === 'es' ? text.en : text.pt)
