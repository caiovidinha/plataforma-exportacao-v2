'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

function BRFlag() {
  return (
    <svg viewBox="0 0 20 14" width="16" height="11" className="rounded-sm flex-shrink-0" role="img" aria-label="Bandeira do Brasil">
      <rect width="20" height="14" fill="#009c3b" />
      <polygon points="10,1 19,7 10,13 1,7" fill="#ffdf00" />
      <circle cx="10" cy="7" r="3" fill="#002776" />
    </svg>
  )
}

function USFlag() {
  return (
    <svg viewBox="0 0 20 14" width="16" height="11" className="rounded-sm flex-shrink-0" role="img" aria-label="US Flag">
      <rect width="20" height="14" fill="#B22234" />
      <rect y="1.08" width="20" height="1.08" fill="white" />
      <rect y="3.23" width="20" height="1.08" fill="white" />
      <rect y="5.38" width="20" height="1.08" fill="white" />
      <rect y="7.54" width="20" height="1.08" fill="white" />
      <rect y="9.69" width="20" height="1.08" fill="white" />
      <rect y="11.85" width="20" height="1.08" fill="white" />
      <rect width="8" height="7.54" fill="#3C3B6E" />
    </svg>
  )
}

const LOCALES = [
  { code: 'pt', label: 'PT', Flag: BRFlag },
  { code: 'en', label: 'EN', Flag: USFlag },
] as const

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter()
  const locale = useLocale()

  function setLocale(next: string) {
    if (next === locale) return
    document.cookie = `locale=${next}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className={cn(
        'inline-flex items-center rounded-full border border-[#3e2e1e]/60 bg-[#3e2e1e]/40 p-0.5 gap-0.5',
        className,
      )}
    >
      {LOCALES.map(({ code, label, Flag }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          title={code === 'pt' ? 'Mudar para Português' : 'Switch to English'}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150',
            locale === code
              ? 'bg-[#ede5dc] text-[#584531] shadow-sm'
              : 'text-[#ede5dc]/70 hover:text-[#ede5dc] hover:bg-[#584531]/60',
          )}
        >
          <Flag />
          {label}
        </button>
      ))}
    </div>
  )
}
