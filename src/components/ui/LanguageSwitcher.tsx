'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export function LanguageSwitcher() {
  const router = useRouter()
  const locale = useLocale()

  function toggle() {
    const next = locale === 'pt' ? 'en' : 'pt'
    document.cookie = `locale=${next}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      title={locale === 'pt' ? 'Switch to English' : 'Mudar para Português'}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors w-full"
    >
      <span className="text-base leading-none">{locale === 'pt' ? '🇧🇷' : '🇺🇸'}</span>
      <span className="font-medium">{locale === 'pt' ? 'PT' : 'EN'}</span>
      <span className="text-slate-600">·</span>
      <span className="text-slate-500">{locale === 'pt' ? 'English' : 'Português'}</span>
    </button>
  )
}
