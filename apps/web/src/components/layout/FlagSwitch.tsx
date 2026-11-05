'use client'
import { cn } from '@/lib/cn'
import { useLocale, useSetLocale } from '@/lib/i18n'

/** Bandeiras circulares (SVG: emoji de bandeira não renderiza no Windows). */
const BR = (
  <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
    <rect width="32" height="32" fill="#009b3a" />
    <path d="M16 5 29 16 16 27 3 16z" fill="#ffdf00" />
    <circle cx="16" cy="16" r="6" fill="#002776" />
    <path d="M10.200 14.500c4-1.200 8.200-.6 11.600 2" stroke="#fff" strokeWidth="1.100" fill="none" />
  </svg>
)
const US = (
  <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
    <rect width="32" height="32" fill="#fff" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} y={i * 4.570} width="32" height="2.290" fill="#d22f3d" />)}
    <rect width="16" height="17.600" fill="#3c3b6e" />
  </svg>
)

export function FlagSwitch({ className }: { className?: string }) {
  const locale = useLocale()
  const set = useSetLocale()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {([['pt', BR, 'Português'], ['en', US, 'English']] as const).map(([l, flag, label]) => (
        <button
          key={l}
          type="button"
          aria-label={label}
          aria-pressed={locale === l}
          onClick={() => set(l)}
          className={cn('h-7 w-7 overflow-hidden rounded-full ring-2 ring-offset-0 transition-opacity', locale === l ? 'opacity-100 ring-white/80' : 'opacity-70 ring-transparent hover:opacity-100')}
        >
          {flag}
        </button>
      ))}
    </div>
  )
}
