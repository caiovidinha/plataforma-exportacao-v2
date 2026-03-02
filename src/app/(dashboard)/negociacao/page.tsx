import { getNegotiations } from '@/lib/api'
import Link from 'next/link'
import { MessageSquare, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

export const metadata = { title: 'Negociações' }

export default async function NegociacaoPage() {
  const negotiations = await getNegotiations()

  const statusCfg = {
    ABERTA: { label: 'Aberta', cls: 'text-brand-400 bg-brand-400/10 border-brand-400/30', icon: MessageSquare },
    ACORDO_PENDENTE: { label: 'Acordo Pendente', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: Clock },
    ACORDO_FECHADO: { label: 'Acordo Fechado', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle2 },
    CANCELADA: { label: 'Cancelada', cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30', icon: XCircle },
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="page-title">Negociações</h1>

      <div className="space-y-3">
        {negotiations.map((n) => {
          const cfg = statusCfg[n.status]
          const lastMsg = n.messages[n.messages.length - 1]
          return (
            <Link key={n.id} href={`/negociacao/${n.id}`}
              className="card hover:border-slate-600 transition-all flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-100 group-hover:text-white truncate">
                    {n.deal.product_name}
                  </span>
                  <span className={cn('badge flex-shrink-0 ml-2', cfg.cls)}>
                    <cfg.icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {n.exporter.company_name} ↔ {n.importer.company_name}
                </p>
                {lastMsg && (
                  <p className="text-xs text-slate-500 mt-1 truncate italic">
                    {lastMsg.sender_name}: "{lastMsg.content}"
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-brand-300">USD {n.deal.price_per_kg_usd.toFixed(2)}/kg</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(n.created_at)}</p>
              </div>
            </Link>
          )
        })}

        {negotiations.length === 0 && (
          <div className="card text-center py-12">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm">Nenhuma negociação encontrada.</p>
            <Link href="/vitrine" className="btn-primary mx-auto mt-4">Explorar Vitrine</Link>
          </div>
        )}
      </div>
    </div>
  )
}
