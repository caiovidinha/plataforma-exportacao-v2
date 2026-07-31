'use client'

import { useTranslations } from 'next-intl'

export function ImportadorFooter() {
  const t = useTranslations('landing')

  return (
    <footer className="bg-[#dbcbba] border-t border-[#3e2e1e]/10 px-[12%] py-6 text-center text-xs text-[#584531]">
      <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      <p className="mt-1">{t('footerIntegrations')}</p>
    </footer>
  )
}
