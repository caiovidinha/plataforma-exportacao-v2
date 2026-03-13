'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, FileText, Package, Ship, DollarSign, CheckCircle2 } from 'lucide-react'
import { cn, formatNumber, incotermLabel } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Negotiation } from '@/types'

interface Props {
  negotiation: Negotiation
  currentUserId: string
}

function Message({ msg, isOwn }: { msg: Negotiation['messages'][0]; isOwn: boolean }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%] px-4 py-2.5',
        isOwn
          ? 'bg-[#584531]/15 border border-[#584531]/25 text-[#3e2e1e]'
          : 'bg-white/50 border border-[#3e2e1e]/15 text-[#3e2e1e]',
      )}>
        {!isOwn && <p className="text-xs font-medium text-[#584531] mb-1">{msg.sender_name}</p>}
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <p className="text-xs text-[#584531]/60 mt-1 text-right">
          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

export function NegotiationChat({ negotiation, currentUserId }: Props) {
  const t = useTranslations('chat')
  const [messages, setMessages] = useState(negotiation.messages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    const newMsg = {
      id: `msg_${Date.now()}`,
      negotiation_id: negotiation.id,
      sender_id: currentUserId,
      sender_name: t('senderYou'),
      content: input.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
  }

  const { deal } = negotiation

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Chat */}
      <div className="lg:col-span-2 card flex flex-col p-0 overflow-hidden">
        {/* Header chat */}
        <div className="px-5 py-3.5 border-b border-[#3e2e1e]/15 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#3e2e1e]">{deal.product_name}</h3>
            <p className="text-xs text-[#584531]/70">
              {negotiation.exporter.company_name} ↔ {negotiation.importer.company_name}
            </p>
          </div>
          <span className={cn('badge',
            negotiation.status === 'ACORDO_FECHADO'
              ? 'text-emerald-700 border-emerald-700/30 bg-emerald-700/10'
              : 'text-brand-400 border-brand-400/30 bg-brand-400/10'
          )}>
            {negotiation.status === 'ACORDO_FECHADO' ? (
              <><CheckCircle2 className="w-3 h-3" /> {t('statusAgreementClosed')}</>
            ) : t('statusNegotiating')}
          </span>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} isOwn={msg.sender_id === currentUserId} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#3e2e1e]/15 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t('inputPlaceholder')}
            className="input flex-1"
            disabled={negotiation.status === 'ACORDO_FECHADO'}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || negotiation.status === 'ACORDO_FECHADO'}
            className="btn-primary px-3"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Painel de Fechamento */}
      <div className="card space-y-4 overflow-y-auto">
        <h3 className="section-title flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#584531]" /> {t('closingPanelTitle')}
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Package className="w-3.5 h-3.5 text-[#584531]" />
            <span className="flex-1">{t('rowProduct')}</span>
            <span className="text-slate-200 font-medium">{deal.product_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1 pl-5">{t('rowQuantity')}</span>
            <span className="text-slate-200 font-medium">{formatNumber(deal.quantity_kg)} kg</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <DollarSign className="w-3.5 h-3.5 text-[#584531]" />
            <span className="flex-1">{t('rowPrice')}</span>
            <span className="text-[#3e2e1e] font-semibold">USD {deal.price_per_kg_usd.toFixed(2)}</span>
          </div>
          <div className="bg-[#584531]/10 border border-[#584531]/20 px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-[#584531]">{t('rowTotal')}</span>
            <span className="text-sm font-display font-bold text-[#3e2e1e]">
              USD {formatNumber(deal.total_usd)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
            <span className="flex-1">{t('rowPayment')}</span>
            <span className="text-slate-200 text-right">{deal.payment_conditions}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1">{t('rowDelivery')}</span>
            <span className="text-slate-200">{deal.delivery_days} dias</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1">{t('rowDeadline')}</span>
            <span className="text-slate-200">{deal.delivery_deadline}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Ship className="w-3.5 h-3.5 text-[#584531]" />
            <span className="flex-1">{t('rowTransport')}</span>
            <span className="text-slate-200">{deal.transport_mode}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1">{t('rowIncoterm')}</span>
            <span className="font-semibold text-[#3e2e1e]">{deal.incoterm}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <span className="flex-1">{t('rowRoute')}</span>
            <span className="text-slate-200 text-right">
              {deal.origin_port}
              <br />→ {deal.destination_port}
            </span>
          </div>
        </div>

        {negotiation.status !== 'ACORDO_FECHADO' && (
          <button className="btn-primary w-full justify-center bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> {t('btnCloseAgreement')}
          </button>
        )}

        {negotiation.status === 'ACORDO_FECHADO' && (
          <div className="bg-emerald-700/10 border border-emerald-700/30 p-3 text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-emerald-700">{t('agreementClosedTitle')}</p>
            <p className="text-xs text-emerald-700/70 mt-0.5">{t('agreementClosedDesc')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
