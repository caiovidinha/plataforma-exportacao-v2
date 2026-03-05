import { getWorkflows, getLiquidation } from '@/lib/api'
import { DollarSign, FileCheck, Ship, AlertCircle, CheckCircle2, Upload, ExternalLink } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { LiquidationFOB, LiquidationCIF } from '@/types'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Liquidação' }

// ---- Painel FOB -----------------------------------------------
function LiquidacaoFOB({ data }: { data: LiquidationFOB }) {
  const t = useTranslations('liquidacao')

  const steps = [
    {
      id: 'AGUARDANDO_SWIFT',
      label: t('step1Label'),
      desc: t('step1Desc'),
    },
    {
      id: 'SWIFT_RECEBIDO',
      label: t('step2Label'),
      desc: t('step2Desc'),
    },
    {
      id: 'BL_LIBERADO',
      label: t('step3Label'),
      desc: t('step3Desc'),
    },
    {
      id: 'CONCLUIDO',
      label: t('step4Label'),
      desc: t('step4Desc'),
    },
  ]

  const currentIndex = steps.findIndex((s) => s.id === data.payment_status)

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" /> {t('fobSummaryTitle')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-dark-100 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400">{t('usdLabel')}</p>
            <p className="text-base font-display font-bold text-white">{formatCurrency(data.amount_usd, 'USD')}</p>
          </div>
          <div className="bg-dark-100 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400">{t('exchangeRateLabel')}</p>
            <p className="text-base font-display font-bold text-brand-300">R$ {data.exchange_rate.toFixed(2)}</p>
          </div>
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400">{t('brlLabel')}</p>
            <p className="text-base font-display font-bold text-white">{formatCurrency(data.amount_brl, 'BRL')}</p>
          </div>
        </div>
      </div>

      {/* Timeline FOB */}
      <div className="card">
        <h3 className="section-title mb-4">{t('fobTimelineTitle')}</h3>
        <div className="space-y-0">
          {steps.map((step, i) => {
            const done = i < currentIndex
            const active = i === currentIndex
            return (
              <div key={step.id} className={cn('flex gap-3 pb-4 last:pb-0 ml-4 pl-4', i < steps.length - 1 && 'border-l-2',
                done ? 'border-emerald-500/40' : 'border-slate-700/40'
              )}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 -ml-8 border-2',
                  done ? 'bg-emerald-500/10 border-emerald-400' : active ? 'bg-brand-500/10 border-brand-400 ring-2 ring-brand-500/30 ring-offset-1 ring-offset-dark-50' : 'bg-dark-100 border-slate-600'
                )}>
                  {done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : active ? <DollarSign className="w-4 h-4 text-brand-400" />
                    : <span className="text-xs text-slate-500 font-bold">{i + 1}</span>}
                </div>
                <div className={cn('flex-1', i < steps.length - 1 ? 'pb-0' : '')}>
                  <p className={cn('text-sm font-medium', done ? 'text-emerald-400' : active ? 'text-brand-300' : 'text-slate-500')}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>

                  {/* Ação: BL */}
                  {step.id === 'SWIFT_RECEBIDO' && active && (
                    <div className="mt-3 space-y-2">
                      {data.swift_document_url ? (
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-emerald-300">{t('swiftReceived')}</span>
                          <a href={data.swift_document_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-brand-400 hover:underline flex items-center gap-1">
                            {t('view')} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-amber-300">{t('awaitingSwiftExchange')}</span>
                        </div>
                      )}
                      <button className="btn-primary text-xs py-1.5 w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                        <Ship className="w-3.5 h-3.5" /> {t('authorizeBL')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---- Painel CIF -----------------------------------------------
function LiquidacaoCIF({ data }: { data: LiquidationCIF }) {
  const t = useTranslations('liquidacao')

  return (
    <div className="card">
      <h3 className="section-title flex items-center gap-2 mb-4">
        <Ship className="w-4 h-4 text-blue-400" /> {t('cifTitle')} {data.payment_status}
      </h3>
      <div className="space-y-3">
        {data.arrival_date && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">{t('shipArrived', { date: data.arrival_date })}</span>
          </div>
        )}

        {data.payment_status === 'AGUARDANDO_CHEGADA' && (
          <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-2">
            <Ship className="w-4 h-4 text-brand-400 animate-pulse-slow" />
            <span className="text-xs text-brand-300">{t('inTransit')}</span>
          </div>
        )}

        {(data.payment_status === 'NAVIO_CHEGOU' || data.payment_status === 'DOCS_ENVIADOS_IMPORTADOR') && (
          <button className="btn-primary w-full justify-center">
            <Upload className="w-4 h-4" /> {t('sendDocuments')}
          </button>
        )}

        {data.payment_status === 'AGUARDANDO_FISCALIZACAO_MAPA_DESTINO' && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">{t('awaitingMapaInspection')}</span>
          </div>
        )}

        {data.aflatoxin_result_at_destination && (
          <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2 border',
            data.aflatoxin_result_at_destination === 'APROVADO'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          )}>
            {data.aflatoxin_result_at_destination === 'APROVADO'
              ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-xs text-emerald-300">{t('aflatoxinApproved')}</span></>
              : <><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-300">{t('aflatoxinRejected')}</span></>
            }
          </div>
        )}

        {data.payment_status === 'AGUARDANDO_SWIFT' && (
          <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-2">
            <DollarSign className="w-4 h-4 text-brand-400" />
            <span className="text-xs text-brand-300">{t('awaitingSwiftCif')}</span>
          </div>
        )}

        {data.exchange_settlement_date && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">
              {t('paymentSettled', { date: data.exchange_settlement_date })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Página principal -------------------------------------------  
export default async function LiquidacaoPage() {
  const [workflows, t] = await Promise.all([getWorkflows(), getTranslations('liquidacao')])
  const activeWorkflow = workflows[0]

  if (!activeWorkflow) {
    return (
      <div className="p-6">
        <h1 className="page-title mb-4">{t('pageTitle')}</h1>
        <div className="card text-center py-12">
          <DollarSign className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400">{t('noWorkflow')}</p>
        </div>
      </div>
    )
  }

  const liquidation = await getLiquidation(activeWorkflow.id)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">{t('pageTitle')}</h1>
        <p className="text-sm text-slate-400 mt-1">
          Workflow: {activeWorkflow.negotiation.product_name} •{' '}
          <span className="text-brand-400 font-medium">{liquidation.incoterm}</span>
        </p>
      </div>

      {liquidation.incoterm === 'FOB'
        ? <LiquidacaoFOB data={liquidation as LiquidationFOB} />
        : <LiquidacaoCIF data={liquidation as LiquidationCIF} />
      }
    </div>
  )
}
