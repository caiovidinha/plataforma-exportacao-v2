'use client'
import { CircleAlert, Table2, Webhook } from 'lucide-react'
import { PRICING_SERVICES, type PartnerDto, type PricingConfigDto, type PricingMode, type PricingService } from '@amazon-trade/shared'
import { Checkbox } from '@/components/ui/form'
import { Alert, PageHeader, PageLoader } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useEnumLabel, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

const SERVICE_PARTNER: Partial<Record<PricingService, string>> = { FREIGHT_MARITIME: 'TRANSPORTE_MARITIMO', FREIGHT_LAND: 'TRANSPORTE_TERRESTRE', INSURANCE: 'SEGURO', FX: 'CAMBIO', CUSTOMS_BROKER: 'DESPACHANTE' }

/** A CHAVE: por serviço, a simulação usa a TABELA interna ou a API do parceiro (com fallback opcional para a tabela). */
export default function PricingPage() {
  const t = useT()
  const enumLabel = useEnumLabel()
  const { data: configs, isLoading } = useGet<PricingConfigDto[]>('/admin/pricing-config', { staleTime: 0 })
  const { data: partners } = useGet<PartnerDto[]>('/admin/partners')
  const save = useSend((c: PricingConfigDto) => api('/admin/pricing-config', { method: 'PUT', body: c }), { invalidate: ['/admin/pricing-config'] })
  if (isLoading || !configs) return <PageLoader />

  const hasPartner = (service: PricingService) => {
    const type = SERVICE_PARTNER[service]
    return !!type && !!partners?.some((p) => p.type === type && p.active && p.integrations.some((i) => i.enabled))
  }

  return (
    <div>
      <PageHeader title={t('admin.pricing.title')} subtitle={t('admin.pricing.subtitle')} />
      <Alert tone="info" className="mb-6">{t('admin.pricing.explain')}</Alert>
      <div className="card divide-y divide-ink-100">
        {PRICING_SERVICES.map((service) => {
          const cfg = configs.find((c) => c.service === service) ?? { service, mode: 'TABLE' as PricingMode, fallbackToTable: true }
          const partnerSupported = !!SERVICE_PARTNER[service]
          const update = (patch: Partial<PricingConfigDto>) => save.mutate({ ...cfg, ...patch })
          return (
            <div key={service} className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
              <div className="min-w-[14rem] flex-1">
                <p className="text-sm font-semibold text-ink-900">{enumLabel('pricingService', service)}</p>
                <p className="text-xs text-ink-500">{partnerSupported ? t('admin.pricing.partnerCapable') : t('admin.pricing.tableOnly')}</p>
              </div>
              <div role="radiogroup" className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5">
                {([['TABLE', Table2], ['PARTNER_API', Webhook]] as const).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    role="radio"
                    aria-checked={cfg.mode === mode}
                    disabled={mode === 'PARTNER_API' && !partnerSupported}
                    onClick={() => cfg.mode !== mode && update({ mode })}
                    className={cn('flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40', cfg.mode === mode ? 'bg-white text-brand-800 shadow-sm' : 'text-ink-500 hover:text-ink-800')}
                  >
                    <Icon className="h-4 w-4" /> {t(`admin.pricing.mode.${mode}` as never)}
                  </button>
                ))}
              </div>
              <div className="w-56">
                {cfg.mode === 'PARTNER_API' ? <Checkbox checked={cfg.fallbackToTable} onChange={(v) => update({ fallbackToTable: v })} label={t('admin.pricing.fallback')} /> : <span className="text-xs text-ink-400">—</span>}
              </div>
              {cfg.mode === 'PARTNER_API' && !hasPartner(service) && (
                <p className="flex w-full items-center gap-1.5 text-xs text-amber-700"><CircleAlert className="h-3.5 w-3.5" /> {t('admin.pricing.noPartner')}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
