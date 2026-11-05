'use client'
import { CheckCircle2, Circle, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { SHIPMENT_DOCUMENT_TYPES, type TaskStatus } from '@amazon-trade/shared'
import { Logo } from '@/components/brand/Logo'
import { LocaleSwitch } from '@/components/layout/LocaleSwitch'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Alert, Badge, Button, Dl, PageLoader, Section, StatusBadge } from '@/components/ui/primitives'
import { api, ApiError } from '@/lib/api'
import { fmtKg, portName } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

interface Target {
  partner: { name: string; type: string }
  shipment: { number: string; stageTitle: string; status: string; product: string; quantityKg: number; incoterm: string; originPort: string; destinationPort: string }
  tasks: { key: string; title: string; status: TaskStatus; focus: boolean }[]
  expiresAt: string
}

/** Portal-lite: parceiros sem API respondem por link tokenizado (sem conta). */
export default function PartnerPortal({ params }: { params: { token: string } }) {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const path = `/partner-actions/${params.token}`
  const { data, isLoading, error } = useGet<Target>(path, { staleTime: 0 })
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [docType, setDocType] = useState<string>('INSURANCE_POLICY')
  const fileRef = useRef<HTMLInputElement>(null)
  const act = useSend((v: { action: string; taskKey?: string; taskStatus?: string }) => api(path, { method: 'POST', body: { ...v, note: note || undefined, reference: reference || undefined } }), {
    invalidate: [path],
    onSuccess: () => { toast.success(t('portal.sent')); setNote('') },
  })
  const upload = useSend(
    (file: File) => {
      const form = new FormData()
      form.set('type', docType)
      form.set('file', file)
      return api(`${path}/documents`, { method: 'POST', form })
    },
    { invalidate: [path], onSuccess: () => toast.success(t('documents.uploaded')) },
  )

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5"><Logo /><LocaleSwitch /></div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        {isLoading ? (
          <PageLoader />
        ) : error || !data ? (
          <Alert tone="error" title={t('portal.invalid.title')}>{error instanceof ApiError && error.status === 401 ? t('portal.invalid.text') : t('common.error')}</Alert>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{t('portal.title', { partner: data.partner.name })}</h1>
              <p className="mt-1 text-sm text-ink-500">{t('portal.subtitle')}</p>
            </div>
            <Section title={t('portal.shipment')} actions={<StatusBadge group="shipment" value={data.shipment.status} />}>
              <Dl items={[
                { label: t('shipments.number'), value: data.shipment.number },
                { label: t('portal.stage'), value: data.shipment.stageTitle },
                { label: t('orders.product'), value: data.shipment.product },
                { label: t('orders.quantity'), value: fmtKg(data.shipment.quantityKg, locale) },
                { label: t('orders.route'), value: `${portName(data.shipment.originPort)} → ${portName(data.shipment.destinationPort)}` },
                { label: 'Incoterm', value: data.shipment.incoterm },
              ]} />
              <p className="mt-4 text-xs text-ink-400">{t('portal.privacy')}</p>
            </Section>

            <Section title={t('portal.tasks')}>
              <ul className="divide-y divide-ink-100">
                {data.tasks.map((task) => (
                  <li key={task.key} className="flex flex-wrap items-center gap-3 py-3">
                    {task.status === 'DONE' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-ink-300" />}
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink-900">{task.title} {task.focus && <Badge tone="brand">{t('portal.requested')}</Badge>}</p></div>
                    <StatusBadge group="task" value={task.status} />
                    {task.status !== 'DONE' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" loading={act.isPending} onClick={() => act.mutate({ action: 'ACCEPT', taskKey: task.key })}>{t('portal.accept')}</Button>
                        <Button size="sm" loading={act.isPending} onClick={() => act.mutate({ action: 'UPDATE_STATUS', taskKey: task.key, taskStatus: 'DONE' })}>{t('portal.markDone')}</Button>
                        <Button size="sm" variant="ghost" loading={act.isPending} onClick={() => act.mutate({ action: 'REJECT', taskKey: task.key })}>{t('portal.reject')}</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label={t('portal.reference')} help={t('portal.referenceHint')}><Input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
                <Field label={t('portal.note')}><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              </div>
            </Section>

            <Section title={t('portal.documents')} description={t('portal.documentsHint')}>
              <div className="flex flex-wrap items-end gap-3">
                <Field label={t('portal.docType')} className="min-w-[14rem] flex-1"><Select value={docType} onChange={(e) => setDocType(e.target.value)} options={SHIPMENT_DOCUMENT_TYPES.map((d) => ({ value: d, label: enumLabel('shipDoc', d) }))} /></Field>
                <input ref={fileRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
                <Button variant="secondary" loading={upload.isPending} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> {t('documents.upload')}</Button>
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  )
}
