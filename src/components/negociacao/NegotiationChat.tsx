'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, FileText, Package, Ship, DollarSign, CheckCircle2 } from 'lucide-react'
import { cn, formatNumber, incotermLabel } from '@/lib/utils'
import type { Negotiation } from '@/types'

interface Props {
  negotiation: Negotiation
  currentUserId: string
}

function Message({ msg, isOwn }: { msg: Negotiation['messages'][0]; isOwn: boolean }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%] rounded-2xl px-4 py-2.5',
        isOwn
          ? 'bg-brand-500/20 border border-brand-500/30 text-slate-100 rounded-tr-sm'
          : 'bg-dark-100 border border-slate-700/40 text-slate-200 rounded-tl-sm',
      )}>
        {!isOwn && <p className="text-xs font-medium text-brand-400 mb-1">{msg.sender_name}</p>}
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <p className="text-xs text-slate-500 mt-1 text-right">
          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

export function NegotiationChat({ negotiation, currentUserId }: Props) {
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
      sender_name: 'Você',
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
        <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{deal.product_name}</h3>
            <p className="text-xs text-slate-500">
              {negotiation.exporter.company_name} ↔ {negotiation.importer.company_name}
            </p>
          </div>
          <span className={cn('badge',
            negotiation.status === 'ACORDO_FECHADO'
              ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
              : 'text-brand-400 border-brand-400/30 bg-brand-400/10'
          )}>
            {negotiation.status === 'ACORDO_FECHADO' ? (
              <><CheckCircle2 className="w-3 h-3" /> Acordo Fechado</>
            ) : 'Em Negociação'}
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
        <div className="px-4 py-3 border-t border-slate-700/50 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite uma mensagem..."
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
          <FileText className="w-4 h-4 text-brand-400" /> Painel de Fechamento
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Package className="w-3.5 h-3.5 text-brand-400" />
            <span className="flex-1">Produto</span>
            <span className="text-slate-200 font-medium">{deal.product_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1 pl-5">Quantidade</span>
            <span className="text-slate-200 font-medium">{formatNumber(deal.quantity_kg)} kg</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" />
            <span className="flex-1">Preço / kg</span>
            <span className="text-brand-300 font-semibold">USD {deal.price_per_kg_usd.toFixed(2)}</span>
          </div>
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total</span>
            <span className="text-sm font-display font-bold text-white">
              USD {formatNumber(deal.total_usd)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
            <span className="flex-1">Pagamento</span>
            <span className="text-slate-200 text-right">{deal.payment_conditions}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1">Entrega</span>
            <span className="text-slate-200">{deal.delivery_days} dias</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1">Prazo limite</span>
            <span className="text-slate-200">{deal.delivery_deadline}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Ship className="w-3.5 h-3.5 text-blue-400" />
            <span className="flex-1">Transporte</span>
            <span className="text-slate-200">{deal.transport_mode}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1">Incoterm</span>
            <span className="font-semibold text-brand-300">{deal.incoterm}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <span className="flex-1">Origem → Destino</span>
            <span className="text-slate-200 text-right">
              {deal.origin_port}
              <br />→ {deal.destination_port}
            </span>
          </div>
        </div>

        {negotiation.status !== 'ACORDO_FECHADO' && (
          <button className="btn-primary w-full justify-center bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Fechar Acordo & Gerar Contrato
          </button>
        )}

        {negotiation.status === 'ACORDO_FECHADO' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-emerald-300">Acordo Fechado!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">Contrato gerado e aguardando assinatura.</p>
          </div>
        )}
      </div>
    </div>
  )
}
