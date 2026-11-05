'use client'
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { L } from '@amazon-trade/shared'
import { hasKey, translate, type Locale, type MessageKey } from './i18n-core'

export type { Locale, MessageKey }
export type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string

const LocaleContext = createContext<Locale>('pt')

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)
/** Tag BCP-47 para Intl (datas, números, moeda). */
export const useIntlLocale = () => (useLocale() === 'pt' ? 'pt-BR' : 'en-US')

export function useT(): TFn {
  const locale = useLocale()
  return useCallback((key, vars) => translate(locale, key, vars), [locale])
}

/** Traduz um texto bilíngue de domínio (`L`), como rótulos de campos e etapas vindos de `@amazon-trade/shared`. */
export function useL() {
  const locale = useLocale()
  return useCallback((text: L | undefined | null) => (text ? text[locale] ?? text.pt : ''), [locale])
}

export function useSetLocale() {
  const router = useRouter()
  return useCallback(
    (next: Locale) => {
      document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`
      router.refresh()
    },
    [router],
  )
}

/** Rótulo de um valor de enum (ex.: `enumLabel('order', 'CONFIRMED')` → chave `order.CONFIRMED`); cai no próprio valor se não houver. */
export function useEnumLabel() {
  const locale = useLocale()
  return useCallback((group: string, value: string | null | undefined) => {
    if (!value) return ''
    const key = `${group}.${value}`
    return hasKey(key) ? translate(locale, key) : value
  }, [locale])
}
