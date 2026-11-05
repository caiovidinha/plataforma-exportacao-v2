'use client'
import { Calculator, MapPin, PackageSearch, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CERTIFICATIONS, COUNTRIES, CONTAINER_TYPES, CURRENCIES, PORTS, type ContainerType, type Currency, type Incoterm, type ProductDto, type SimulationDto } from '@amazon-trade/shared'
import { SimulationBreakdown } from '@/components/orders/SimulationBreakdown'
import { Field, Input, NumberInput, Select, Textarea } from '@/components/ui/form'
import { Alert, Badge, Button, Dl, PageLoader, Section, Tabs } from '@/components/ui/primitives'
import { api, ApiError } from '@/lib/api'
import { flag, fmtKg, fmtMoney, portName } from '@/lib/format'
import { hasKey } from '@/lib/i18n-core'
import { useIntlLocale, useL, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'
import { useSession } from '@/lib/session'
import { StorePage } from '@/components/layout/StorePage'

const DEST_PORTS = PORTS.filter((p) => p.country !== 'BR')

export default function ProductPage({ params }: { params: { id: string } }) {
  const t = useT()
  const tl = useL()
  const locale = useIntlLocale()
  const router = useRouter()
  const session = useSession().data
  const approved = session?.company?.onboardingStatus === 'APPROVED'
  const { data: p, isLoading, isError } = useGet<ProductDto>(`/products/${params.id}`)
  const [img, setImg] = useState(0)
  const [tab, setTab] = useState<'specs' | 'legal' | 'nutri'>('specs')

  const [qty, setQty] = useState<number | undefined>()
  const [port, setPort] = useState('NLRTM')
  const [incoterm, setIncoterm] = useState<Incoterm>('CIF')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [container, setContainer] = useState<ContainerType>('40HC')
  const [sim, setSim] = useState<SimulationDto | null>(null)
  const [notes, setNotes] = useState('')
  const [shipDate, setShipDate] = useState('')
  const [simError, setSimError] = useState<string | null>(null)

  const effectiveQty = qty ?? p?.minOrderKg
  const simulate = useSend(
    () => api<SimulationDto>('/simulations', { method: 'POST', body: { productId: params.id, quantityKg: effectiveQty, destinationPort: port, incoterm, currency, containerType: container } }),
    {
      silent: true,
      onSuccess: (r) => {
        setSim(r)
        setSimError(null)
      },
    },
  )
  const order = useSend(
    () => api<{ id: string }>('/orders', { method: 'POST', body: { simulationId: sim!.id, importerNotes: notes || undefined, requestedShipDate: shipDate || undefined } }),
    {
      invalidate: ['/orders', '/dashboard'],
      onSuccess: (o) => {
        toast.success(t('sim.orderCreated'))
        router.push(`/store/orders/${o.id}`)
      },
    },
  )
  const onSimulate = async () => {
    try {
      await simulate.mutateAsync()
    } catch (e) {
      setSim(null)
      const code = e instanceof ApiError ? e.code : ''
      setSimError(hasKey(`simerr.${code}`) ? t(`simerr.${code}` as never) : e instanceof ApiError ? e.message : t('common.error'))
    }
  }

  const sheet = p?.technicalSheet
  const specs = useMemo(() => {
    if (!sheet) return []
    const o = sheet.organoleptic ?? {}
    const f = sheet.physicochemical ?? {}
    const rows: { label: string; value: string }[] = []
    for (const k of ['appearance', 'color', 'aroma', 'format', 'texture'] as const) if (o[k]) rows.push({ label: t(`product.sheet.${k}` as never), value: o[k]! })
    for (const k of ['maxMoisturePct', 'maxDefectivePct', 'maxBrokenPct', 'maxRancidPct'] as const) if (f[k] != null) rows.push({ label: t(`product.sheet.${k}` as never), value: `${f[k]}%` })
    for (const a of f.aflatoxinTolerance ?? []) rows.push({ label: `${t('product.sheet.aflatoxin')} — ${tl(COUNTRIES.find((c) => c.code === a.country)?.name) || a.country}`, value: `≤ ${a.ppb} ppb` })
    return rows
  }, [sheet, t, tl])

  if (isLoading) return <StorePage><PageLoader /></StorePage>
  if (isError || !p) return <StorePage><Alert tone="error">{t('common.notFound')}</Alert></StorePage>
  const nutri = sheet?.nutritional ?? {}
  const certs = sheet?.certifications ?? []
  const legal = sheet?.legalRequirements ?? []
  const qtyOk = effectiveQty != null && effectiveQty >= p.minOrderKg && effectiveQty <= p.availableKg

  return (
    <StorePage>
      <nav className="mb-5 text-sm text-ink-500">
        <Link href="/store" className="hover:text-brand-700">{t('store.nav.catalog')}</Link> <span className="mx-1.5">/</span> <span className="text-ink-800">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="min-w-0 space-y-6">
          <div className="card overflow-hidden">
            <div className="aspect-[16/10] bg-ink-100">
              {p.images[img] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[img]!.url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-ink-300"><PackageSearch className="h-14 w-14" /></div>
              )}
            </div>
            {p.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {p.images.map((im, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <button key={im.id} onClick={() => setImg(i)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === img ? 'border-brand-600' : 'border-transparent'}`}><img src={im.url} alt="" className="h-full w-full object-cover" /></button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-ink-500">{flag(p.exporter.country)} {p.exporter.name}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{p.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {portName(p.originPort)}</span>
              <span>NCM {p.ncm}</span>
              <span>{t('product.harvest')} {p.harvestYear}</span>
              <span>{p.packaging}</span>
            </p>
            {certs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {certs.map((c) => <Badge key={c} tone="brand">{tl(CERTIFICATIONS.find((x) => x.value === c)?.label) || c}</Badge>)}
              </div>
            )}
            {p.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-700">{p.description}</p>}
          </div>

          <Section>
            <Tabs value={tab} onChange={setTab} items={[{ value: 'specs', label: t('store.tab.specs') }, { value: 'legal', label: t('store.tab.legal'), count: legal.length }, { value: 'nutri', label: t('store.tab.nutri') }]} />
            <div className="pt-5">
              {tab === 'specs' && (specs.length ? <Dl items={specs} /> : <p className="text-sm text-ink-500">{t('store.noSheet')}</p>)}
              {tab === 'nutri' && (Object.keys(nutri).length ? <Dl items={Object.entries(nutri).map(([k, v]) => ({ label: t(`product.sheet.${k}` as never), value: String(v) }))} /> : <p className="text-sm text-ink-500">{t('store.noSheet')}</p>)}
              {tab === 'legal' &&
                (legal.length ? (
                  <div className="space-y-4">
                    {legal.map((r) => (
                      <div key={r.country}>
                        <p className="text-sm font-semibold text-ink-900">{flag(r.country)} {tl(COUNTRIES.find((c) => c.code === r.country)?.name) || r.country}</p>
                        <ul className="mt-1.5 list-inside list-disc text-sm text-ink-700">
                          {r.documents.map((d, i) => <li key={i}>{d.name}{d.authority && <span className="text-ink-500"> — {d.authority}</span>}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-ink-500">{t('store.noSheet')}</p>)}
            </div>
          </Section>
        </div>

        {/* ---------------- simulador ---------------- */}
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card p-5">
            <p className="text-3xl font-semibold tabular-nums text-ink-900">{fmtMoney(p.basePriceUsdPerKg, 'USD', locale)}<span className="text-sm font-normal text-ink-500"> /kg · FOB</span></p>
            <p className="mt-1 text-xs text-ink-500">{t('store.moq')} {fmtKg(p.minOrderKg, locale)} · {fmtKg(p.availableKg, locale)} {t('store.available')} · {t('store.leadTime', { days: p.leadTimeDays })}</p>

            <div className="mt-5 flex items-center gap-2 border-t border-ink-100 pt-5 text-sm font-semibold text-ink-900"><Calculator className="h-4 w-4 text-brand-600" /> {t('sim.title')}</div>
            {!approved && <Alert tone="warn" className="mt-3">{t('sim.needsApproval')} <Link href="/store/onboarding" className="font-semibold underline">{t('banner.onboarding.cta')}</Link></Alert>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label={t('sim.quantity')} className="col-span-2" error={effectiveQty != null && !qtyOk ? t('sim.qtyRange', { min: fmtKg(p.minOrderKg, locale), max: fmtKg(p.availableKg, locale) }) : undefined}>
                <NumberInput value={effectiveQty} onChange={(v) => { setQty(v); setSim(null) }} min={p.minOrderKg} max={p.availableKg} step={100} invalid={effectiveQty != null && !qtyOk} />
              </Field>
              <Field label={t('sim.destination')} className="col-span-2">
                <Select value={port} onChange={(e) => { setPort(e.target.value); setSim(null) }} options={DEST_PORTS.map((x) => ({ value: x.code, label: x.name }))} />
              </Field>
              <Field label="Incoterm">
                <Select value={incoterm} onChange={(e) => { setIncoterm(e.target.value as Incoterm); setSim(null) }} options={p.incoterms.map((i) => ({ value: i, label: i }))} />
              </Field>
              <Field label={t('sim.currency')}>
                <Select value={currency} onChange={(e) => { setCurrency(e.target.value as Currency); setSim(null) }} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
              </Field>
              <Field label={t('sim.container')} className="col-span-2">
                <Select value={container} onChange={(e) => { setContainer(e.target.value as ContainerType); setSim(null) }} options={CONTAINER_TYPES.map((c) => ({ value: c, label: c }))} />
              </Field>
            </div>
            {simError && <Alert tone="error" className="mt-3">{simError}</Alert>}
            <Button className="mt-4 w-full" size="lg" disabled={!approved || !qtyOk} loading={simulate.isPending} onClick={onSimulate}>{sim ? t('sim.recalculate') : t('sim.run')}</Button>
          </div>

          {sim && (
            <div className="card mt-5 animate-fade-in p-5">
              <SimulationBreakdown result={sim.result} narrow />
              <div className="mt-5 space-y-3 border-t border-ink-100 pt-5">
                <Field label={t('sim.shipDate')}><Input type="date" value={shipDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setShipDate(e.target.value)} /></Field>
                <Field label={t('sim.notes')}><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                <Button className="w-full" size="lg" loading={order.isPending} onClick={() => order.mutate()}><ShoppingCart className="h-4 w-4" /> {t('sim.placeOrder')}</Button>
                <p className="text-center text-xs text-ink-500">{t('sim.placeOrder.hint')}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </StorePage>
  )
}
