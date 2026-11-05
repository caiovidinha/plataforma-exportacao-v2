import { en } from '@/messages/en'
import { pt, type MessageKey } from '@/messages/pt'

/**
 * Núcleo do i18n (sem 'use client'): usado por Server e Client Components.
 * As chaves vêm de `messages/pt.ts`; `messages/en.ts` precisa ter exatamente as mesmas
 * (o compilador acusa faltas/sobras), garantindo paridade pt/en em tempo de build.
 */
export type Locale = 'pt' | 'en'
export type { MessageKey }
export const dicts: Record<Locale, Record<MessageKey, string>> = { pt, en }

export const interpolate = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : s

export const translate = (locale: Locale, key: MessageKey, vars?: Record<string, string | number>) => interpolate(dicts[locale][key] ?? pt[key] ?? key, vars)

export const hasKey = (key: string): key is MessageKey => key in pt
