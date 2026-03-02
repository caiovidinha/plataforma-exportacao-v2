'use client'

import Link from 'next/link'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface MapaRegistrationAlertProps {
  /** Se true, mostra o banner. False esconde tudo. */
  show?: boolean
  /** Modo 'banner' = faixa no topo da página. Modo 'card' = card standalone */
  variant?: 'banner' | 'card'
}

export function MapaRegistrationAlert({ show = true, variant = 'banner' }: MapaRegistrationAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!show || dismissed) return null

  if (variant === 'card') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-5">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-300 text-sm mb-1">
              Cadastro no MAPA Obrigatório
            </h3>
            <p className="text-xs text-amber-400/90 leading-relaxed mb-3">
              Para exportar legalmente, sua empresa precisa estar registrada no{' '}
              <strong>Ministério da Agricultura, Pecuária e Abastecimento (MAPA)</strong>.
              Sem esse cadastro, não é possível obter o{' '}
              <strong>Certificado Fitossanitário</strong>, documento indispensável para
              a liberação da carga no porto de destino.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/cadastro/mapa"
                className="btn-primary bg-amber-500 hover:bg-amber-600 text-xs py-1.5"
              >
                Iniciar Cadastro MAPA
              </Link>
              <a
                href="https://sistemasweb.agricultura.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 gap-1.5"
              >
                Portal MAPA <ExternalLink className="w-3 h-3" />
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
        <strong>Ação necessária:</strong> Sua empresa ainda não está cadastrada no{' '}
        <strong>MAPA</strong>. Regularize para habilitar a emissão do Certificado
        Fitossanitário.{' '}
        <Link href="/cadastro/mapa" className="underline hover:no-underline font-medium">
          Cadastrar agora →
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
