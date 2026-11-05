'use client'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLocale, useSetLocale } from '@/lib/i18n'

export function LocaleSwitch({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  const locale = useLocale()
  const set = useSetLocale()
  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone === 'light' ? 'text-white/80' : 'text-ink-500', className)}>
      <Globe className="h-3.5 w-3.5" />
      {(['pt', 'en'] as const).map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="opacity-40">/</span>}
          <button type="button" onClick={() => set(l)} aria-pressed={locale === l} className={cn('uppercase transition-opacity', locale === l ? 'opacity-100' : 'opacity-60 hover:opacity-100', locale === l && tone === 'light' && 'text-white', locale === l && tone === 'dark' && 'text-ink-900')}>
            {l}
          </button>
        </span>
      ))}
    </div>
  )
}
