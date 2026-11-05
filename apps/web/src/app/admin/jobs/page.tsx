'use client'
import { Link2, Play, RotateCcw, X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import toast from 'react-hot-toast'
import { JOB_STATUSES, type IntegrationJobDto } from '@amazon-trade/shared'
import { Select } from '@/components/ui/form'
import { Modal } from '@/components/ui/overlay'
import { Button, EmptyState, PageHeader, PageLoader, StatusBadge } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

function Jobs() {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const params = useSearchParams()
  const shipmentId = params.get('shipmentId') ?? undefined
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [link, setLink] = useState<string | null>(null)
  const { data, isLoading } = useGet<IntegrationJobDto[]>('/admin/jobs', { query: { status, shipmentId, limit: 100 }, refetchInterval: 10_000 })
  const inv = ['/admin/jobs', '/shipments']
  const run = useSend(() => api<{ processed: unknown[] }>('/admin/jobs/run', { method: 'POST' }), { invalidate: inv, onSuccess: (r) => toast.success(t('admin.jobs.processed', { n: r.processed.length })) })
  const retry = useSend((id: string) => api(`/admin/jobs/${id}/retry`, { method: 'POST' }), { invalidate: inv })
  const cancel = useSend((id: string) => api(`/admin/jobs/${id}/cancel`, { method: 'POST' }), { invalidate: inv })
  const portal = useSend((id: string) => api<{ url: string }>(`/admin/jobs/${id}/portal-link`, { method: 'POST' }), { onSuccess: (r) => setLink(r.url) })

  return (
    <div>
      <PageHeader
        title={t('nav.jobs')}
        subtitle={shipmentId ? t('admin.jobs.filteredShipment') : t('admin.jobs.subtitle')}
        actions={<><Select className="w-44" placeholder={t('common.all')} value={status} onChange={(e) => setStatus(e.target.value)} options={JOB_STATUSES.map((s) => ({ value: s, label: enumLabel('job', s) }))} /><Button variant="secondary" loading={run.isPending} onClick={() => run.mutate()}><Play className="h-4 w-4" /> {t('admin.jobs.runNow')}</Button></>}
      />
      {isLoading ? <PageLoader /> : !data?.length ? <EmptyState title={t('admin.jobs.empty')} description={t('admin.jobs.empty.text')} /> : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>{t('admin.jobs.partner')}</th><th>{t('admin.jobs.operation')}</th><th>{t('common.status')}</th><th className="hidden md:table-cell">{t('admin.jobs.attempts')}</th><th className="hidden lg:table-cell">{t('admin.jobs.next')}</th><th /></tr></thead>
            <tbody>
              {data.map((j) => (
                <tr key={j.id}>
                  <td><p className="font-medium">{j.partnerName}</p>{j.shipmentId && <Link href={`/admin/shipments/${j.shipmentId}`} className="text-xs text-brand-700 hover:underline">{t('nav.shipments')}</Link>}</td>
                  <td><code className="text-xs">{j.operation}</code>{j.lastError && <p className="mt-1 max-w-xs truncate text-xs text-red-600" title={j.lastError}>{j.lastError}</p>}</td>
                  <td><StatusBadge group="job" value={j.status} /></td>
                  <td className="hidden tabular-nums md:table-cell">{j.attempts}/{j.maxAttempts}</td>
                  <td className="hidden text-ink-500 lg:table-cell">{j.status === 'FAILED' || j.status === 'QUEUED' ? fmtDate(j.nextAttemptAt, locale, true) : j.finishedAt ? fmtDate(j.finishedAt, locale, true) : '—'}</td>
                  <td className="whitespace-nowrap text-right">
                    {['FAILED', 'DEAD', 'CANCELLED'].includes(j.status) && <Button size="sm" variant="ghost" onClick={() => retry.mutate(j.id)}><RotateCcw className="h-3.5 w-3.5" /> {t('admin.jobs.retry')}</Button>}
                    {['QUEUED', 'FAILED', 'DEAD'].includes(j.status) && <Button size="sm" variant="ghost" onClick={() => cancel.mutate(j.id)}><X className="h-3.5 w-3.5" /></Button>}
                    {j.shipmentId && <Button size="sm" variant="ghost" onClick={() => portal.mutate(j.id)} aria-label={t('admin.jobs.portalLink')}><Link2 className="h-3.5 w-3.5" /></Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!link} onClose={() => setLink(null)} title={t('admin.jobs.portalLink')} description={t('admin.jobs.portalLinkHint')} footer={<Button onClick={() => { navigator.clipboard.writeText(link ?? ''); toast.success(t('common.copied')) }}>{t('common.copy')}</Button>}>
        <code className="block break-all rounded-lg bg-ink-100 p-3 text-xs">{link}</code>
      </Modal>
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Jobs />
    </Suspense>
  )
}
