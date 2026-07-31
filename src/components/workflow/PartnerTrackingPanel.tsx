'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { getPartner } from '@/lib/partners'
import type { ExportWorkflow, PartnerActivityStatus, PartnerType } from '@/types'

// Painel de acompanhamento dedicado a Despachante Aduaneiro e Cia de
// Navegação - os dois parceiros que o usuário quer "seguir" de perto,
// como um rastreio de encomenda. Alimentado por workflow.activity_log,
// que é escrito pelas ações do exportador no WorkflowTimeline.
const TRACKED_PARTNERS: PartnerType[] = ['DESPACHANTE', 'CIA_NAVEGACAO']

const STATUS_DOT: Record<PartnerActivityStatus, string> = {
  INFO: 'bg-[#584531]',
  ACAO_NECESSARIA: 'bg-amber-500',
  CONCLUIDO: 'bg-emerald-600',
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function PartnerTrackingPanel({ workflow }: { workflow: ExportWorkflow }) {
  const t = useTranslations('workflow')
  const log = workflow.activity_log ?? []

  return (
    <div className="card space-y-4">
      <h3 className="section-title">{t('partnerTrackingTitle')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TRACKED_PARTNERS.map((partnerType) => {
          const partner = getPartner(partnerType)
          const events = log
            .filter((e) => e.partner === partnerType)
            .slice()
            .sort((a, b) => b.at.localeCompare(a.at))

          return (
            <div key={partnerType} className="space-y-2">
              <p className="text-xs font-semibold text-[#584531] uppercase tracking-wide">{partner.name}</p>
              {events.length === 0 ? (
                <p className="text-xs text-[#584531]/50 italic">{t('partnerNoActivity')}</p>
              ) : (
                <ul className="space-y-2.5">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-start gap-2 text-xs">
                      <span className={cn('w-1.5 h-1.5 mt-1.5 flex-shrink-0 rounded-full', STATUS_DOT[e.status])} />
                      <div>
                        <p className="text-[#3e2e1e] leading-snug">{e.message}</p>
                        <p className="text-[#584531]/50 mt-0.5">{formatDateTime(e.at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
