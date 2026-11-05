'use client'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { PRICING_SERVICES, type PricingService, type TariffDto } from '@amazon-trade/shared'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { Alert, Badge, Button, EmptyState, PageHeader, PageLoader } from '@/components/ui/primitives'
import { api, ApiError } from '@/lib/api'
import { fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

/** Modelos de `match`/`pricing` por serviço (o servidor valida o formato). */
const TEMPLATES: Record<PricingService, { match: object; pricing: object }> = {
  FREIGHT_MARITIME: { match: { originPort: 'BRBEL', destinationPort: 'NLRTM', containerType: '40HC' }, pricing: { ratePerContainer: 3200, currency: 'USD', transitDays: 22, surchargePerContainer: 0 } },
  FREIGHT_LAND: { match: { originState: 'PA', destinationPort: 'BRBEL' }, pricing: { ratePerTon: 95, minCharge: 800, currency: 'BRL', transitDays: 2 } },
  INSURANCE: { match: { coverage: 'ALL_RISKS' }, pricing: { ratePct: 0.35, minPremium: 150, currency: 'USD', insuredValueMarkupPct: 10 } },
  FX: { match: { currency: 'USD' }, pricing: { spreadPct: 0.8, fixedFee: 35, currency: 'USD' } },
  CUSTOMS_BROKER: { match: { originPort: 'BRBEL' }, pricing: { fixedFee: 2800, pctOfValue: 0.2, currency: 'BRL' } },
  ORIGIN_HANDLING: { match: { originPort: 'BRBEL' }, pricing: { perContainer: 900, currency: 'BRL' } },
  IMPORT_CHARGES: { match: { country: 'DE' }, pricing: { dutyPct: 4, vatPct: 7, otherPct: 0.5 } },
  PLATFORM_FEE: { match: {}, pricing: { pct: 1, minFee: 100, currency: 'USD' } },
}
const pretty = (o: object) => JSON.stringify(o, null, 2)

export default function TariffsPage() {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const [service, setService] = useState<string>('')
  const { data, isLoading } = useGet<TariffDto[]>('/admin/tariffs', { query: { service } })
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState<TariffDto | null>(null)
  const [form, setForm] = useState({ service: 'FREIGHT_MARITIME' as PricingService, label: '', validFrom: new Date().toISOString().slice(0, 10), validTo: '', isSample: false, match: pretty(TEMPLATES.FREIGHT_MARITIME.match), pricing: pretty(TEMPLATES.FREIGHT_MARITIME.pricing) })
  const [error, setError] = useState<string | null>(null)

  const create = useSend(
    async () => {
      let match: unknown, pricing: unknown
      try {
        match = JSON.parse(form.match)
        pricing = JSON.parse(form.pricing)
      } catch {
        throw new Error(t('admin.tariffs.badJson'))
      }
      try {
        return await api('/admin/tariffs', { method: 'POST', body: { service: form.service, label: form.label || undefined, validFrom: form.validFrom, validTo: form.validTo || null, isSample: form.isSample, match, pricing } })
      } catch (e) {
        if (e instanceof ApiError && Array.isArray(e.details)) throw new Error((e.details as { path: string; message: string }[]).map((d) => `${d.path}: ${d.message}`).join('; '))
        throw e
      }
    },
    { invalidate: ['/admin/tariffs'], silent: true, onSuccess: () => { toast.success(t('admin.tariffs.created')); setOpen(false); setError(null) } },
  )
  const remove = useSend((id: string) => api(`/admin/tariffs/${id}`, { method: 'DELETE' }), { invalidate: ['/admin/tariffs'], onSuccess: () => setRemoving(null) })

  return (
    <div>
      <PageHeader title={t('nav.tariffs')} subtitle={t('admin.tariffs.subtitle')} actions={<><Select className="w-52" value={service} onChange={(e) => setService(e.target.value)} placeholder={t('common.all')} options={PRICING_SERVICES.map((s) => ({ value: s, label: enumLabel('pricingService', s) }))} /><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> {t('admin.tariffs.new')}</Button></>} />
      {data?.some((x) => x.isSample) && <Alert tone="warn" className="mb-5">{t('admin.tariffs.sampleWarning')}</Alert>}
      {isLoading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState title={t('admin.tariffs.empty')} />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>{t('admin.tariffs.service')}</th><th>{t('admin.tariffs.match')}</th><th>{t('admin.tariffs.pricing')}</th><th className="hidden lg:table-cell">{t('admin.tariffs.validity')}</th><th /></tr></thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.id}>
                  <td className="min-w-[10rem]"><p className="font-medium">{enumLabel('pricingService', x.service)}</p>{x.label && <p className="text-xs text-ink-500">{x.label}</p>}{x.isSample && <Badge tone="amber" className="mt-1">{t('sim.sample')}</Badge>}</td>
                  <td><code className="text-xs text-ink-600">{Object.values(x.match).join(' · ') || '*'}</code></td>
                  <td className="max-w-xs"><code className="line-clamp-2 break-all text-xs text-ink-600">{Object.entries(x.pricing).map(([k, v]) => `${k}=${v}`).join(', ')}</code></td>
                  <td className="hidden whitespace-nowrap text-ink-500 lg:table-cell">{fmtDate(x.validFrom, locale)} → {x.validTo ? fmtDate(x.validTo, locale) : '∞'}</td>
                  <td className="text-right"><button className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label={t('common.remove')} onClick={() => setRemoving(x)}><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={t('admin.tariffs.new')} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button loading={create.isPending} onClick={() => { setError(null); create.mutate(undefined, { onError: (e) => setError(e.message) }) }}>{t('common.save')}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.tariffs.service')}>
            <Select value={form.service} onChange={(e) => { const s = e.target.value as PricingService; setForm({ ...form, service: s, match: pretty(TEMPLATES[s].match), pricing: pretty(TEMPLATES[s].pricing) }) }} options={PRICING_SERVICES.map((s) => ({ value: s, label: enumLabel('pricingService', s) }))} />
          </Field>
          <Field label={t('admin.tariffs.label')}><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
          <Field label={t('admin.tariffs.validFrom')}><Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></Field>
          <Field label={t('admin.tariffs.validTo')}><Input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} /></Field>
          <Field label={t('admin.tariffs.match')} help={t('admin.tariffs.matchHint')}><Textarea rows={7} className="font-mono text-xs" value={form.match} onChange={(e) => setForm({ ...form, match: e.target.value })} /></Field>
          <Field label={t('admin.tariffs.pricing')}><Textarea rows={7} className="font-mono text-xs" value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Checkbox checked={form.isSample} onChange={(v) => setForm({ ...form, isSample: v })} label={t('admin.tariffs.isSample')} /></div>
          {error && <div className="sm:col-span-2"><Alert tone="error">{error}</Alert></div>}
        </div>
      </Modal>
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} danger loading={remove.isPending} title={t('admin.tariffs.remove')} onConfirm={() => removing && remove.mutate(removing.id)} />
    </div>
  )
}
