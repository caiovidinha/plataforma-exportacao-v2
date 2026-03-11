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
      <div className="bg-amber-500/10 border border-amber-500/40 p-5">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-300 text-sm mb-1">
              {t('alertCardTitle')}
            </h3>
            <p className="text-xs text-amber-400/90 leading-relaxed mb-3">
              {t('alertCardBody')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/cadastro/mapa"
                className="btn-primary bg-amber-500 hover:bg-amber-600 text-xs py-1.5"
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
            className="text-amber-500/60 hover:text-amber-400 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // variant === 'banner'
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <p className="text-sm text-amber-300 flex-1">
        <strong>{t('alertBannerActionRequired')}</strong> {t('alertBannerBody')}{' '}
        <Link href="/cadastro/mapa" className="underline hover:no-underline font-medium">
          {t('alertBannerLink')}
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500/60 hover:text-amber-300 transition-colors ml-auto"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
