export type Locale = 'pt' | 'en'
export const LOCALES: Locale[] = ['pt', 'en']
export const DEFAULT_LOCALE: Locale = 'pt'

/** Texto bilíngue. Use `L('português', 'english')`. */
export interface L {
  pt: string
  en: string
}
export const L = (pt: string, en: string): L => ({ pt, en })
export const tr = (text: L, locale: Locale): string => text[locale] ?? text.pt
