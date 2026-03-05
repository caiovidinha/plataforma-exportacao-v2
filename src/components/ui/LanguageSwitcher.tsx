'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

function BRFlag() {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className="rounded-sm flex-shrink-0" role="img" aria-label="Bandeira do Brasil">
      <rect width="20" height="14" fill="#009c3b" />
      <polygon points="10,1 19,7 10,13 1,7" fill="#ffdf00" />
      <circle cx="10" cy="7" r="3" fill="#002776" />
    </svg>
  )
}

function USFlag() {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className="rounded-sm flex-shrink-0" role="img" aria-label="US Flag">
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
      {locale === 'pt' ? <BRFlag /> : <USFlag />}
      <span className="font-medium">{locale === 'pt' ? 'PT' : 'EN'}</span>
      <span className="text-slate-600">·</span>
      <span className="text-slate-500">{locale === 'pt' ? 'English' : 'Português'}</span>
    </button>
  )
}
