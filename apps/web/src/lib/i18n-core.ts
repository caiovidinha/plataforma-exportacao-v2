import { en } from '@/messages/en'
import { es } from '@/messages/es'
import { pt, type MessageKey } from '@/messages/pt'

/**
 * Núcleo do i18n (sem 'use client'): usado por Server e Client Components.
 * As chaves vêm de `messages/pt.ts`; `en.ts` e `es.ts` precisam ter exatamente as mesmas
 * (o compilador acusa faltas/sobras), garantindo paridade pt/en/es em tempo de build.
 */
export type Locale = 'pt' | 'en' | 'es'
export const LOCALES: Locale[] = ['pt', 'en', 'es']
export type { MessageKey }
export const dicts: Record<Locale, Record<MessageKey, string>> = { pt, en, es }
export const INTL_TAG: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

export const interpolate = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : s

export const translate = (locale: Locale, key: MessageKey, vars?: Record<string, string | number>) => interpolate(dicts[locale][key] ?? pt[key] ?? key, vars)

export const hasKey = (key: string): key is MessageKey => key in pt
