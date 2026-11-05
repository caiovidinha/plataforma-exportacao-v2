'use client'
import { AlertTriangle, CheckCircle2, Circle, Clock, Download, FlaskConical, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { getStageDef, MAIN_FLOW, SHIPMENT_DOCUMENT_TYPES, STAGE_DEFS, type ShipmentDocumentDto, type ShipmentDto, type ShipmentEventDto, type ShipmentStage, type TaskStatus } from '@amazon-trade/shared'
import { Select, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/overlay'
import { Alert, Badge, Button, Dl, PageHeader, PageLoader, Section, StatusBadge } from '@/components/ui/primitives'
import { api, openFile } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtBytes, fmtDate, fmtKg, portName } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useL, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

export type ShipmentViewer = 'exporter' | 'importer' | 'admin'

function StageStepper({ shipment }: { shipment: ShipmentDto }) {
  const tl = useL()
  const t = useT()
  const idx = MAIN_FLOW.indexOf(shipment.stage)
  const exception = idx < 0
  return (
    <div>
      <ol className="grid gap-2 sm:grid-cols-5">
        {MAIN_FLOW.map((stage, i) => {
          const done = shipment.status === 'COMPLETED' || (!exception && i < idx) || (exception && i <= MAIN_FLOW.indexOf('MERCADORIA_LIBERADA'))
          const active = !exception && i === idx && shipment.status !== 'COMPLETED'
          return (
            <li key={stage} className={cn('rounded-xl border p-3', done ? 'border-brand-200 bg-brand-50' : active ? 'border-brand-600 bg-white ring-1 ring-brand-600' : 'border-ink-200 bg-white')}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                {done ? <CheckCircle2 className="h-4 w-4 text-brand-600" /> : active ? <Clock className="h-4 w-4 text-brand-600" /> : <Circle className="h-4 w-4 text-ink-300" />}
                <span className={cn(done || active ? 'text-brand-800' : 'text-ink-400')}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <p className={cn('mt-1.5 text-sm font-medium', done || active ? 'text-ink-900' : 'text-ink-500')}>{tl(getStageDef(stage).title)}</p>
            </li>
          )
        })}
      </ol>
      {exception && (
        <Alert tone="error" title={tl(getStageDef(shipment.stage).title)} className="mt-3">
          {tl(getStageDef(shipment.stage).description)}
        </Alert>
      )}
      {shipment.status === 'COMPLETED' && <Alert tone="success" className="mt-3">{t('shipment.completed')}</Alert>}
    </div>
  )
}

function Tracking({ shipment }: { shipment: ShipmentDto }) {
  const t = useT()
  const locale = useIntlLocale()
  const tr = shipment.tracking
  const has = Object.keys(tr).length > 0
  return (
    <Section title={t('shipment.tracking')}>
      {has ? (
        <Dl
          items={[
            { label: t('shipment.tracking.status'), value: tr.status },
            { label: t('shipment.tracking.vessel'), value: [tr.vesselName, tr.voyage].filter(Boolean).join(' · ') || undefined },
            { label: t('shipment.tracking.containers'), value: tr.containerNumbers?.join(', ') },
            { label: t('shipment.tracking.bl'), value: tr.blNumber },
            { label: 'ETD', value: tr.etd ? fmtDate(tr.etd, locale) : undefined },
            { label: 'ETA', value: tr.eta ? fmtDate(tr.eta, locale) : undefined },
          ]}
        />
      ) : (
        <p className="text-sm text-ink-500">{t('shipment.tracking.empty')}</p>
      )}
    </Section>
  )
}

function Tasks({ shipment, viewer }: { shipment: ShipmentDto; viewer: ShipmentViewer }) {
  const t = useT()
  const tl = useL()
  const enumLabel = useEnumLabel()
  const update = useSend(({ key, status }: { key: string; status: TaskStatus }) => api(`/shipments/${shipment.id}/tasks/${key}`, { method: 'PATCH', body: { status } }), {
    invalidate: ['/shipments', '/dashboard', '/notifications'],
  })
  const stages: ShipmentStage[] = [...MAIN_FLOW, ...(shipment.tasks.some((x) => x.stage === 'NAO_PAGAMENTO') ? (['NAO_PAGAMENTO'] as const) : []), ...(shipment.tasks.some((x) => x.stage === 'MERCADORIA_RECUSADA') ? (['MERCADORIA_RECUSADA'] as const) : [])]
  const canAct = (actor: string) => viewer === 'admin' || (viewer === 'exporter' && actor === 'EXPORTER')

  return (
    <Section title={t('shipment.tasks')} description={t('shipment.tasks.hint')}>
      <div className="space-y-5">
        {stages.map((stage) => {
          const tasks = shipment.tasks.filter((x) => x.stage === stage)
          if (!tasks.length) return null
          const current = stage === shipment.stage
          return (
            <div key={stage} className={cn(!current && 'opacity-80')}>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                {tl(getStageDef(stage).title)} {current && shipment.status !== 'COMPLETED' && <Badge tone="brand">{t('shipment.currentStage')}</Badge>}
              </p>
              <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
                {tasks.map((task) => {
                  const def = STAGE_DEFS.find((s) => s.stage === stage)?.tasks.find((d) => d.key === task.key)
                  const actionable = current && canAct(task.actor) && task.status !== 'DONE' && shipment.status !== 'COMPLETED'
                  return (
                    <li key={task.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                      {task.status === 'DONE' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : task.status === 'BLOCKED' ? <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" /> : <Circle className="h-4 w-4 shrink-0 text-ink-300" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink-900">{def ? tl(def.title) : task.title}</p>
                        <p className="text-xs text-ink-500">
                          {task.partnerType ? enumLabel('partner', task.partnerType) : enumLabel('actor', task.actor)}
                          {task.note && ` · ${task.note}`}
                        </p>
                      </div>
                      <StatusBadge group="task" value={task.status} />
                      {actionable && (
                        <Button size="sm" variant="secondary" loading={update.isPending && update.variables?.key === task.key} onClick={() => update.mutate({ key: task.key, status: 'DONE' })}>
                          {t('shipment.markDone')}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function Documents({ shipmentId, viewer }: { shipmentId: string; viewer: ShipmentViewer }) {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const { data } = useGet<ShipmentDocumentDto[]>(`/shipments/${shipmentId}/documents`)
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<string>('COMMERCIAL_INVOICE')
  const upload = useSend(
    (file: File) => {
      const form = new FormData()
      form.set('type', type)
      form.set('file', file)
      return api(`/shipments/${shipmentId}/documents`, { method: 'POST', form })
    },
    { invalidate: [`/shipments/${shipmentId}`], onSuccess: () => toast.success(t('documents.uploaded')) },
  )
  return (
    <Section
      title={t('shipment.documents')}
      actions={
        viewer !== 'importer' && (
          <div className="flex items-center gap-2">
            <Select className="w-52 py-1.5 text-xs" value={type} onChange={(e) => setType(e.target.value)} options={SHIPMENT_DOCUMENT_TYPES.map((d) => ({ value: d, label: enumLabel('shipDoc', d) }))} />
            <input ref={fileRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
            <Button size="sm" variant="secondary" loading={upload.isPending} onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> {t('documents.upload')}
            </Button>
          </div>
        )
      }
    >
      {!data?.length ? (
        <p className="text-sm text-ink-500">{t('shipment.documents.empty')}</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {data.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{enumLabel('shipDoc', d.type)}</p>
                <p className="truncate text-xs text-ink-500">
                  {d.fileName} · {fmtBytes(d.sizeBytes)} · {fmtDate(d.createdAt, locale)} · {d.partnerType ? enumLabel('partner', d.partnerType) : enumLabel('source', d.source)}
                </p>
              </div>
              <button className="rounded p-1.5 text-ink-500 hover:bg-ink-100" aria-label={t('common.download')} onClick={() => openFile(`/shipments/${shipmentId}/documents/${d.id}/download`, d.fileName)}>
                <Download className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function Timeline({ shipmentId }: { shipmentId: string }) {
  const t = useT()
  const locale = useIntlLocale()
  const enumLabel = useEnumLabel()
  const { data } = useGet<ShipmentEventDto[]>(`/shipments/${shipmentId}/events`)
  return (
    <Section title={t('shipment.timeline')}>
      {!data?.length ? (
        <p className="text-sm text-ink-500">—</p>
      ) : (
        <ol className="relative space-y-4 border-l border-ink-200 pl-5">
          {data.map((e) => (
            <li key={e.id} className="relative">
              <span className={cn('absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white', e.source === 'PARTNER' ? 'bg-sky-500' : e.source === 'SYSTEM' ? 'bg-amber-500' : 'bg-brand-600')} />
              <p className="text-sm text-ink-900">{e.message}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {fmtDate(e.occurredAt, locale, true)} · {e.partnerType ? enumLabel('partner', e.partnerType) : enumLabel('source', e.source)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

function AdminTools({ shipment }: { shipment: ShipmentDto }) {
  const t = useT()
  const tl = useL()
  const [exceptionOpen, setExceptionOpen] = useState(false)
  const [stage, setStage] = useState<'NAO_PAGAMENTO' | 'MERCADORIA_RECUSADA'>('NAO_PAGAMENTO')
  const [reason, setReason] = useState('')
  const sim = useSend(() => api<{ done: string[]; skipped: unknown[] }>(`/admin/shipments/${shipment.id}/sandbox/simulate`, { method: 'POST' }), {
    invalidate: ['/shipments', '/admin/shipments'],
    onSuccess: (r) => toast.success(t('shipment.admin.simulated', { n: r.done.length })),
  })
  const exception = useSend(() => api(`/shipments/${shipment.id}/exception`, { method: 'POST', body: { stage, reason } }), {
    invalidate: ['/shipments'],
    onSuccess: () => setExceptionOpen(false),
  })
  const active = shipment.status === 'IN_PROGRESS'
  return (
    <Section title={t('shipment.admin.tools')} description={t('shipment.admin.toolsHint')}>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" loading={sim.isPending} disabled={!active} onClick={() => sim.mutate()}>
          <FlaskConical className="h-3.5 w-3.5" /> {t('shipment.admin.simulate')}
        </Button>
        <Button variant="secondary" size="sm" disabled={!active || !['MERCADORIA_LIBERADA', 'PAGAMENTO'].includes(shipment.stage)} onClick={() => setExceptionOpen(true)}>
          <AlertTriangle className="h-3.5 w-3.5" /> {t('shipment.admin.exception')}
        </Button>
        <Link href={`/admin/jobs?shipmentId=${shipment.id}`} className="btn-ghost btn-sm">
          {t('shipment.admin.jobs')}
        </Link>
      </div>
      <Modal
        open={exceptionOpen}
        onClose={() => setExceptionOpen(false)}
        title={t('shipment.admin.exception')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExceptionOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" loading={exception.isPending} disabled={reason.trim().length < 5} onClick={() => exception.mutate()}>{t('common.confirm')}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} options={(['NAO_PAGAMENTO', 'MERCADORIA_RECUSADA'] as const).map((s) => ({ value: s, label: tl(getStageDef(s).title) }))} />
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('shipment.admin.reason')} />
        </div>
      </Modal>
    </Section>
  )
}

export function ShipmentDetail({ id, viewer, backHref }: { id: string; viewer: ShipmentViewer; backHref: string }) {
  const t = useT()
  const locale = useIntlLocale()
  const { data: shipment, isLoading, isError } = useGet<ShipmentDto>(`/shipments/${id}`, { refetchInterval: 20_000 })
  if (isLoading) return <PageLoader />
  if (isError || !shipment) return <Alert tone="error">{t('common.notFound')}</Alert>
  const orderHref = viewer === 'exporter' ? `/exporter/orders/${shipment.orderId}` : viewer === 'importer' ? `/store/orders/${shipment.orderId}` : `/admin/orders`
  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {shipment.number} <StatusBadge group="shipment" value={shipment.status} />
          </span>
        }
        subtitle={`${shipment.productName} · ${fmtKg(shipment.quantityKg, locale)} · ${portName(shipment.originPort)} → ${portName(shipment.destinationPort)} · ${shipment.incoterm}`}
        actions={
          <>
            <Link href={backHref} className="btn-ghost">← {t('common.back')}</Link>
            <Link href={orderHref} className="btn-secondary">{t('shipment.viewOrder')} {shipment.orderNumber}</Link>
          </>
        }
      />
      <StageStepper shipment={shipment} />
      {viewer === 'admin' && <AdminTools shipment={shipment} />}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Tasks shipment={shipment} viewer={viewer} />
          <Documents shipmentId={shipment.id} viewer={viewer} />
        </div>
        <div className="space-y-6">
          <Tracking shipment={shipment} />
          <Timeline shipmentId={shipment.id} />
        </div>
      </div>
    </div>
  )
}

