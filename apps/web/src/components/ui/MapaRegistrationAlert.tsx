'use client'

import Link from 'next/link'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface MapaRegistrationAlertProps {
  /** Se true, mostra o banner. False esconde tudo. */
  show?: boolean
  /** Modo 'banner' = faixa no topo da página. Modo 'card' = card standalone */
  variant?: 'banner' | 'card'
}

export function MapaRegistrationAlert({ show = true, variant = 'banner' }: MapaRegistrationAlertProps) {
  const t = useTranslations('mapa')
  const [dismissed, setDismissed] = useState(false)

  if (!show || dismissed) return null

  if (variant === 'card') {
    return (
      <div className="bg-[#584531]/10 border border-[#3e2e1e]/20 p-5">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-[#584531]/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#584531]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#3e2e1e] text-sm mb-1">
              {t('alertCardTitle')}
            </h3>
            <p className="text-xs text-[#584531]/80 leading-relaxed mb-3">
              {t('alertCardBody')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/cadastro/mapa"
                className="btn-primary text-xs py-1.5"
              >
                {t('alertCardCta')}
              </Link>
              <a
                href="https://sistemasweb.agricultura.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 gap-1.5"
              >
                {t('alertCardPortal')} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-[#584531]/50 hover:text-[#3e2e1e] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // variant === 'banner'
  return (
    <div className="bg-[#584531]/10 border-b border-[#3e2e1e]/20 px-6 py-3 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-[#584531] flex-shrink-0" />
      <p className="text-sm text-[#3e2e1e] flex-1">
        <strong>{t('alertBannerActionRequired')}</strong> {t('alertBannerBody')}{' '}
        <Link href="/cadastro/mapa" className="underline hover:no-underline font-medium">
          {t('alertBannerLink')}
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#584531]/50 hover:text-[#3e2e1e] transition-colors ml-auto"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
