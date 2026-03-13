import { getNegotiations } from '@/lib/api'
import Link from 'next/link'
import { MessageSquare, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Negociações' }

export default async function NegociacaoPage() {
  const negotiations = await getNegotiations()
  const t = await getTranslations('negociacao')

  const statusCfg = {
    ABERTA: { label: t('statusOpen'), cls: 'text-brand-400 bg-brand-400/10 border-brand-400/30', icon: MessageSquare },
    ACORDO_PENDENTE: { label: t('statusPending'), cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: Clock },
    ACORDO_FECHADO: { label: t('statusClosed'), cls: 'text-emerald-700 bg-emerald-700/10 border-emerald-700/30', icon: CheckCircle2 },
    CANCELADA: { label: t('statusCancelled'), cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30', icon: XCircle },
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="page-title">{t('pageTitle')}</h1>

      <div className="space-y-3">
        {negotiations.map((n) => {
          const cfg = statusCfg[n.status]
          const lastMsg = n.messages[n.messages.length - 1]
          return (
            <Link key={n.id} href={`/negociacao/${n.id}`}
              className="card hover:border-[#3e2e1e]/30 transition-all flex gap-4 group">
              <div className="w-10 h-10 bg-[#584531]/15 border border-[#584531]/25 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-[#584531]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[#3e2e1e] group-hover:text-[#1c1208] truncate">
                    {n.deal.product_name}
                  </span>
                  <span className={cn('badge flex-shrink-0 ml-2', cfg.cls)}>
                    <cfg.icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-[#584531]">
                  {n.exporter.company_name} ↔ {n.importer.company_name}
                </p>
                {lastMsg && (
                  <p className="text-xs text-[#584531]/60 mt-1 truncate italic">
                    {lastMsg.sender_name}: "{lastMsg.content}"
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-[#3e2e1e]">USD {n.deal.price_per_kg_usd.toFixed(2)}/kg</p>
                <p className="text-xs text-[#584531]/60 mt-0.5">{formatDate(n.created_at)}</p>
              </div>
            </Link>
          )
        })}

        {negotiations.length === 0 && (
          <div className="card text-center py-12">
            <MessageSquare className="w-10 h-10 mx-auto text-[#584531]/40 mb-2" />
            <p className="text-[#584531] text-sm">{t('noNegotiations')}</p>
              <Link href="/vitrine" className="btn-primary mx-auto mt-4">{t('exploreShowcase')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}
