import { getServiceProviders } from '@/lib/api'
import { Package, Star, MapPin, Truck, Ship, DollarSign, Shield, Microscope, FileCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceProviderType } from '@/types'

export const metadata = { title: 'Marketplace de Serviços' }

const typeConfig: Record<ServiceProviderType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  SEGURADORA:            { label: 'Seguradora',         icon: Shield,     color: 'text-violet-400', bg: 'bg-violet-400/10' },
  TRANSPORTADORA:        { label: 'Transportadora',     icon: Truck,      color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  COMPANHIA_NAVEGACAO:   { label: 'Cia. de Navegação',  icon: Ship,       color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  DESPACHANTE:           { label: 'Despachante',        icon: FileCheck,  color: 'text-green-400',  bg: 'bg-green-400/10' },
  CORRETORA:             { label: 'Corretora de Câmbio',icon: DollarSign, color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
  TERMINAL_ALFANDEGARIO: { label: 'Terminal Alfandeg.', icon: Package,    color: 'text-brand-400',  bg: 'bg-brand-400/10' },
  CERTIFICADORA:         { label: 'Certificadora',      icon: FileCheck,  color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  LABORATORIO:           { label: 'Laboratório',        icon: Microscope, color: 'text-red-400',    bg: 'bg-red-400/10' },
}

function ProviderCard({ provider }: { provider: Awaited<ReturnType<typeof getServiceProviders>>[0] }) {
  const cfg = typeConfig[provider.type]
  return (
    <div className="card hover:border-slate-600 transition-all flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
          <cfg.icon className={cn('w-5 h-5', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{provider.company_name}</h3>
            <span className={cn('badge flex-shrink-0 text-xs', cfg.color, `${cfg.bg} border-current/20`)}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.city}</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-brand-400 fill-brand-400" />{provider.rating}
              <span className="text-slate-600">({provider.reviews_count})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Detalhes específicos */}
      <div className="text-xs text-slate-500 space-y-0.5">
        {provider.coverage_area && <p>Cobertura: <span className="text-slate-300">{provider.coverage_area}</span></p>}
        {provider.ports_covered && <p>Portos: <span className="text-slate-300">{provider.ports_covered.slice(0, 3).join(', ')}</span></p>}
        {provider.currency_pairs && <p>Moedas: <span className="text-slate-300">{provider.currency_pairs.join(', ')}</span></p>}
        {provider.exchange_rate_usd && <p>Câmbio USD: <span className="text-brand-300 font-semibold">R$ {provider.exchange_rate_usd.toFixed(2)}</span></p>}
        {provider.fixed_fee_brl && <p>Taxa fixa: <span className="text-slate-300">R$ {provider.fixed_fee_brl.toLocaleString('pt-BR')}</span></p>}
        {provider.mapa_accredited !== undefined && (
          provider.mapa_accredited
            ? <p className="flex items-center gap-1 text-emerald-400"><FileCheck className="w-3 h-3" /> Credenciado MAPA</p>
            : <p className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3" /> Não credenciado MAPA</p>
        )}
      </div>

      <button className="btn-primary w-full justify-center mt-auto">Contratar</button>
    </div>
  )
}

export default async function ServicosPage() {
  const providers = await getServiceProviders()

  const byType = providers.reduce<Record<string, typeof providers>>((acc, p) => {
    ;(acc[p.type] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="page-title">Marketplace de Serviços</h1>
        <p className="text-sm text-slate-400 mt-1">
          Selecione e contrate os parceiros necessários para sua exportação.
        </p>
      </div>

      {(Object.keys(typeConfig) as ServiceProviderType[]).map((type) => {
        const items = byType[type]
        if (!items?.length) return null
        const cfg = typeConfig[type]
        return (
          <section key={type}>
            <h2 className="section-title flex items-center gap-2 mb-4">
              <cfg.icon className={cn('w-4 h-4', cfg.color)} />
              {cfg.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((p) => <ProviderCard key={p.id} provider={p} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
