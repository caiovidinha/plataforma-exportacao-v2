import { getServiceProviders } from '@/lib/api'
import { Package, Star, MapPin, Truck, Ship, DollarSign, Shield, Microscope, FileCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceProviderType } from '@/types'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Marketplace de Serviços' }

const typeVisual: Record<ServiceProviderType, { icon: React.ElementType; color: string; bg: string }> = {
  SEGURADORA:            { icon: Shield,     color: 'text-violet-400', bg: 'bg-violet-400/10' },
  TRANSPORTADORA:        { icon: Truck,      color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  COMPANHIA_NAVEGACAO:   { icon: Ship,       color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  DESPACHANTE:           { icon: FileCheck,  color: 'text-green-400',  bg: 'bg-green-400/10' },
  CORRETORA:             { icon: DollarSign, color: 'text-emerald-700',bg: 'bg-emerald-700/10' },
  TERMINAL_ALFANDEGARIO: { icon: Package,    color: 'text-brand-400',  bg: 'bg-brand-400/10' },
  CERTIFICADORA:         { icon: FileCheck,  color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  LABORATORIO:           { icon: Microscope, color: 'text-red-400',    bg: 'bg-red-400/10' },
}

const typeLabelKey: Record<ServiceProviderType, string> = {
  SEGURADORA:            'typeSeguradora',
  TRANSPORTADORA:        'typeTransportadora',
  COMPANHIA_NAVEGACAO:   'typeNavegacao',
  DESPACHANTE:           'typeDespachante',
  CORRETORA:             'typeCorretora',
  TERMINAL_ALFANDEGARIO: 'typeTerminal',
  CERTIFICADORA:         'typeCertificadora',
  LABORATORIO:           'typeLaboratorio',
}

function ProviderCard({ provider, label }: { provider: Awaited<ReturnType<typeof getServiceProviders>>[0]; label: string }) {
  const t = useTranslations('servicos')
  const cfg = typeVisual[provider.type]
  return (
    <div className="card hover:border-[#3e2e1e]/30 transition-all flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 flex items-center justify-center flex-shrink-0', cfg.bg)}>
          <cfg.icon className={cn('w-5 h-5', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#3e2e1e] truncate">{provider.company_name}</h3>
            <span className={cn('badge flex-shrink-0 text-xs', cfg.color, `${cfg.bg} border-current/20`)}>{label}</span>
          </div>
            <div className="flex items-center gap-3 text-xs text-[#584531] mt-1">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.city}</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />{provider.rating}
              <span className="text-[#584531]/40">({provider.reviews_count})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Detalhes específicos */}
      <div className="text-xs text-slate-500 space-y-0.5">
        {provider.coverage_area && <p>{t('coverage')} <span className="text-[#3e2e1e]">{provider.coverage_area}</span></p>}
        {provider.ports_covered && <p>{t('ports')} <span className="text-[#3e2e1e]">{provider.ports_covered.slice(0, 3).join(', ')}</span></p>}
        {provider.currency_pairs && <p>{t('currencies')} <span className="text-[#3e2e1e]">{provider.currency_pairs.join(', ')}</span></p>}
        {provider.exchange_rate_usd && <p>{t('exchangeRate')} <span className="text-[#3e2e1e] font-semibold">R$ {provider.exchange_rate_usd.toFixed(2)}</span></p>}
        {provider.fixed_fee_brl && <p>{t('fixedFee')} <span className="text-[#3e2e1e]">R$ {provider.fixed_fee_brl.toLocaleString('pt-BR')}</span></p>}
        {provider.mapa_accredited !== undefined && (
          provider.mapa_accredited
            ? <p className="flex items-center gap-1 text-emerald-700"><FileCheck className="w-3 h-3" /> {t('mapaAccredited')}</p>
            : <p className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3" /> {t('notMapaAccredited')}</p>
        )}
      </div>

      <button className="btn-primary w-full justify-center mt-auto">{t('hireBtn')}</button>
    </div>
  )
}

export default async function ServicosPage() {
  const [providers, t] = await Promise.all([getServiceProviders(), getTranslations('servicos')])

  const byType = providers.reduce<Record<string, typeof providers>>((acc, p) => {
    ;(acc[p.type] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="page-title">{t('pageTitle')}</h1>
        <p className="text-sm text-[#584531] mt-1">{t('subtitle')}</p>
      </div>

      {(Object.keys(typeVisual) as ServiceProviderType[]).map((type) => {
        const items = byType[type]
        if (!items?.length) return null
        const cfg = typeVisual[type]
        const label = t(typeLabelKey[type] as any)
        return (
          <section key={type}>
            <h2 className="section-title flex items-center gap-2 mb-4">
              <cfg.icon className={cn('w-4 h-4', cfg.color)} />
              {label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((p) => <ProviderCard key={p.id} provider={p} label={label} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
