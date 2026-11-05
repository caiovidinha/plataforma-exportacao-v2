'use client'
import { ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { CERTIFICATIONS, COUNTRIES, INCOTERMS, ORIGIN_PORTS, PRODUCT_STATUSES, BR_STATES, productInputSchema, type ProductDto, type ProductInput } from '@amazon-trade/shared'
import { ChipSelect, Field, Input, NumberInput, Select, Textarea } from '@/components/ui/form'
import { Alert, Button, PageHeader, Section } from '@/components/ui/primitives'
import { api, errorMessage } from '@/lib/api'
import { useEnumLabel, useL, useT } from '@/lib/i18n'
import { useSend } from '@/lib/query'

type Form = Omit<ProductInput, 'imageFileIds'>
type TS = NonNullable<Form['technicalSheet']>
const EMPTY: Form = {
  name: '', category: 'Castanha-do-Brasil', description: '', ncm: '0801.21.00', packaging: '', originPort: 'BRBEL', originState: 'PA', harvestYear: new Date().getFullYear(),
  basePriceUsdPerKg: 0 as number, minOrderKg: 1000, availableKg: 0 as number, leadTimeDays: 20, incoterms: ['FOB', 'CFR', 'CIF'], destinationCountries: [], technicalSheet: {}, status: 'DRAFT',
}

const fromDto = (p: ProductDto): Form => ({
  name: p.name, category: p.category, description: p.description, ncm: p.ncm, packaging: p.packaging, originPort: p.originPort, originState: p.originState ?? undefined, harvestYear: p.harvestYear,
  basePriceUsdPerKg: p.basePriceUsdPerKg, minOrderKg: p.minOrderKg, availableKg: p.availableKg, leadTimeDays: p.leadTimeDays, incoterms: p.incoterms, destinationCountries: p.destinationCountries,
  technicalSheet: p.technicalSheet, status: p.status,
})

export function ProductForm({ product }: { product?: ProductDto }) {
  const t = useT()
  const tl = useL()
  const enumLabel = useEnumLabel()
  const router = useRouter()
  const [form, setForm] = useState<Form>(product ? fromDto(product) : EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const ts: TS = form.technicalSheet ?? {}
  const setTs = (patch: Partial<TS>) => set('technicalSheet', { ...ts, ...patch })
  const phys = ts.physicochemical ?? {}
  const org = ts.organoleptic ?? {}
  const nut = ts.nutritional ?? {}
  const err = (path: string) => errors[path]

  const save = useSend(
    async () => {
      const parsed = productInputSchema.safeParse({ ...form, imageFileIds: [] })
      if (!parsed.success) {
        const map: Record<string, string> = {}
        for (const i of parsed.error.issues) map[i.path.join('.')] = i.message
        setErrors(map)
        throw new Error(t('product.fixErrors'))
      }
      setErrors({})
      const { imageFileIds: _ignored, ...body } = parsed.data
      void _ignored
      return product ? api<ProductDto>(`/products/${product.id}`, { method: 'PUT', body }) : api<ProductDto>('/products', { method: 'POST', body })
    },
    {
      invalidate: ['/products', '/catalog', '/dashboard'],
      onSuccess: (p) => {
        toast.success(t('product.saved'))
        if (!product) router.replace(`/exporter/products/${p.id}`)
      },
    },
  )

  const addImage = useSend(
    (file: File) => {
      const f = new FormData()
      f.set('file', file)
      return api(`/products/${product!.id}/images`, { method: 'POST', form: f })
    },
    { invalidate: ['/products'] },
  )
  const removeImage = useSend((id: string) => api(`/products/${product!.id}/images/${id}`, { method: 'DELETE' }), { invalidate: ['/products'] })

  const aflatoxin = phys.aflatoxinTolerance ?? []
  const legal = ts.legalRequirements ?? []

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <PageHeader
        title={product ? product.name : t('product.new')}
        subtitle={t('product.subtitle')}
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push('/exporter/products')}>{t('common.cancel')}</Button>
            <Button type="submit" loading={save.isPending}>{t('common.save')}</Button>
          </>
        }
      />
      {Object.keys(errors).length > 0 && <Alert tone="error">{t('product.fixErrors')}</Alert>}

      <Section title={t('product.section.basic')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t('product.name')} required error={err('name') && t('field.err.generic')} className="lg:col-span-2">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} invalid={!!err('name')} />
          </Field>
          <Field label={t('product.status')}>
            <Select value={form.status} onChange={(e) => set('status', e.target.value as Form['status'])} options={PRODUCT_STATUSES.map((s) => ({ value: s, label: enumLabel('product', s) }))} />
          </Field>
          <Field label={t('product.description')} className="sm:col-span-2 lg:col-span-3">
            <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="NCM" required error={err('ncm') && t('field.err.invalid_ncm')}>
            <Input value={form.ncm} onChange={(e) => set('ncm', e.target.value)} invalid={!!err('ncm')} />
          </Field>
          <Field label={t('product.packaging')} required error={err('packaging') && t('field.required')} className="lg:col-span-2">
            <Input value={form.packaging} onChange={(e) => set('packaging', e.target.value)} invalid={!!err('packaging')} placeholder="Sacos de 25 kg" />
          </Field>
          <Field label={t('product.originPort')} required>
            <Select value={form.originPort} onChange={(e) => set('originPort', e.target.value)} options={ORIGIN_PORTS.map((p) => ({ value: p.code, label: p.name }))} />
          </Field>
          <Field label={t('product.originState')}>
            <Select placeholder="—" value={form.originState ?? ''} onChange={(e) => set('originState', e.target.value || undefined)} options={BR_STATES.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label={t('product.harvest')} required>
            <NumberInput value={form.harvestYear} onChange={(v) => set('harvestYear', v as number)} />
          </Field>
        </div>
      </Section>

      <Section title={t('product.section.commercial')} description={t('product.section.commercial.hint')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('product.price')} required error={err('basePriceUsdPerKg') && t('field.required')}>
            <NumberInput step="0.01" min={0} value={form.basePriceUsdPerKg || undefined} onChange={(v) => set('basePriceUsdPerKg', (v ?? 0) as number)} invalid={!!err('basePriceUsdPerKg')} />
          </Field>
          <Field label={t('product.minOrder')} required>
            <NumberInput min={1} value={form.minOrderKg} onChange={(v) => set('minOrderKg', (v ?? 0) as number)} />
          </Field>
          <Field label={t('product.available')} required error={err('availableKg') && t('field.required')}>
            <NumberInput min={1} value={form.availableKg || undefined} onChange={(v) => set('availableKg', (v ?? 0) as number)} invalid={!!err('availableKg')} />
          </Field>
          <Field label={t('product.leadTime')} required>
            <NumberInput min={1} value={form.leadTimeDays} onChange={(v) => set('leadTimeDays', (v ?? 1) as number)} />
          </Field>
          <Field label="Incoterms" required className="sm:col-span-2">
            <ChipSelect options={INCOTERMS.map((i) => ({ value: i, label: i }))} value={form.incoterms} onChange={(v) => set('incoterms', v as Form['incoterms'])} />
            {err('incoterms') && <p className="error-text">{t('field.required')}</p>}
          </Field>
          <Field label={t('product.destinations')} className="sm:col-span-2 lg:col-span-4">
            <div className="max-h-36 overflow-y-auto rounded-lg border border-ink-200 p-2">
              <ChipSelect options={COUNTRIES.filter((c) => c.code !== 'BR').map((c) => ({ value: c.code, label: tl(c.name) }))} value={form.destinationCountries} onChange={(v) => set('destinationCountries', v)} />
            </div>
          </Field>
        </div>
      </Section>

      <Section title={t('product.section.sheet')} description={t('product.section.sheet.hint')}>
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">{t('product.sheet.organoleptic')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(['appearance', 'color', 'aroma', 'format', 'texture'] as const).map((k) => (
                <Field key={k} label={t(`product.sheet.${k}` as never)}>
                  <Input value={org[k] ?? ''} onChange={(e) => setTs({ organoleptic: { ...org, [k]: e.target.value || undefined } })} />
                </Field>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">{t('product.sheet.physico')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(['maxMoisturePct', 'maxDefectivePct', 'maxBrokenPct', 'maxRancidPct'] as const).map((k) => (
                <Field key={k} label={t(`product.sheet.${k}` as never)}>
                  <NumberInput step="0.1" min={0} max={100} value={phys[k]} onChange={(v) => setTs({ physicochemical: { ...phys, [k]: v } })} />
                </Field>
              ))}
            </div>
            <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-ink-500">{t('product.sheet.aflatoxin')}</p>
            <div className="space-y-2">
              {aflatoxin.map((row, i) => (
                <div key={i} className="flex items-end gap-2">
                  <Select className="w-52" value={row.country} onChange={(e) => setTs({ physicochemical: { ...phys, aflatoxinTolerance: aflatoxin.map((r, j) => (j === i ? { ...r, country: e.target.value } : r)) } })} options={COUNTRIES.map((c) => ({ value: c.code, label: tl(c.name) }))} />
                  <div className="flex items-center gap-2">
                    <NumberInput className="w-28" step="0.1" min={0} value={row.ppb} onChange={(v) => setTs({ physicochemical: { ...phys, aflatoxinTolerance: aflatoxin.map((r, j) => (j === i ? { ...r, ppb: v ?? 0 } : r)) } })} />
                    <span className="text-xs text-ink-500">ppb</span>
                  </div>
                  <button type="button" className="rounded p-2 text-red-500 hover:bg-red-50" aria-label={t('common.remove')} onClick={() => setTs({ physicochemical: { ...phys, aflatoxinTolerance: aflatoxin.filter((_, j) => j !== i) } })}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setTs({ physicochemical: { ...phys, aflatoxinTolerance: [...aflatoxin, { country: 'DE', ppb: 4 }] } })}><Plus className="h-3.5 w-3.5" /> {t('product.sheet.addCountry')}</Button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">{t('product.sheet.nutritional')}</h3>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {(['servingG', 'kcal', 'totalFatG', 'saturatedFatG', 'carbsG', 'fiberG', 'proteinG', 'sodiumMg', 'seleniumMcg'] as const).map((k) => (
                <Field key={k} label={t(`product.sheet.${k}` as never)}>
                  <NumberInput step="0.1" min={0} value={nut[k]} onChange={(v) => setTs({ nutritional: { ...nut, [k]: v } })} />
                </Field>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">{t('product.sheet.certifications')}</h3>
            <ChipSelect options={CERTIFICATIONS.map((c) => ({ value: c.value, label: tl(c.label) }))} value={ts.certifications ?? []} onChange={(v) => setTs({ certifications: v })} />
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-ink-800">{t('product.sheet.legal')}</h3>
            <p className="mb-3 text-xs text-ink-500">{t('product.sheet.legal.hint')}</p>
            <div className="space-y-3">
              {legal.map((req, i) => (
                <div key={i} className="rounded-xl border border-ink-200 bg-ink-50/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Select className="w-56" value={req.country} onChange={(e) => setTs({ legalRequirements: legal.map((r, j) => (j === i ? { ...r, country: e.target.value } : r)) })} options={COUNTRIES.filter((c) => c.code !== 'BR').map((c) => ({ value: c.code, label: tl(c.name) }))} />
                    <button type="button" className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label={t('common.remove')} onClick={() => setTs({ legalRequirements: legal.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {req.documents.map((d, k) => (
                      <div key={k} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <Input placeholder={t('product.sheet.docName')} value={d.name} onChange={(e) => setTs({ legalRequirements: legal.map((r, j) => (j === i ? { ...r, documents: r.documents.map((x, m) => (m === k ? { ...x, name: e.target.value, type: x.type || 'DOC' } : x)) } : r)) })} />
                        <Input placeholder={t('product.sheet.authority')} value={d.authority ?? ''} onChange={(e) => setTs({ legalRequirements: legal.map((r, j) => (j === i ? { ...r, documents: r.documents.map((x, m) => (m === k ? { ...x, authority: e.target.value || undefined } : x)) } : r)) })} />
                        <button type="button" className="rounded p-2 text-ink-400 hover:bg-ink-100" aria-label={t('common.remove')} onClick={() => setTs({ legalRequirements: legal.map((r, j) => (j === i ? { ...r, documents: r.documents.filter((_, m) => m !== k) } : r)) })}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setTs({ legalRequirements: legal.map((r, j) => (j === i ? { ...r, documents: [...r.documents, { type: 'DOC', name: '', required: true }] } : r)) })}><Plus className="h-3.5 w-3.5" /> {t('product.sheet.addDoc')}</Button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setTs({ legalRequirements: [...legal, { country: 'DE', documents: [] }] })}><Plus className="h-3.5 w-3.5" /> {t('product.sheet.addCountry')}</Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title={t('product.section.images')} description={product ? t('product.images.hint') : undefined}>
        {!product ? (
          <p className="text-sm text-ink-500">{t('product.images.afterSave')}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {product.images.map((img) => (
              <div key={img.id} className="group relative h-28 w-28 overflow-hidden rounded-xl border border-ink-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeImage.mutate(img.id)} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 opacity-0 shadow transition-opacity group-hover:opacity-100" aria-label={t('common.remove')}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {product.images.length < 8 && (
              <>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" hidden onChange={(e) => e.target.files?.[0] && addImage.mutate(e.target.files[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} className="grid h-28 w-28 place-items-center rounded-xl border border-dashed border-ink-300 text-ink-400 hover:border-brand-500 hover:text-brand-600" aria-label={t('product.images.add')}>
                  {addImage.isPending ? '…' : <ImagePlus className="h-6 w-6" />}
                </button>
              </>
            )}
          </div>
        )}
        {save.error && <p className="error-text mt-3">{errorMessage(save.error)}</p>}
      </Section>
    </form>
  )
}
