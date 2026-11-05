'use client'
import { ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { IntegrationLogDto, PartnerDto } from '@amazon-trade/shared'
import { Select } from '@/components/ui/form'
import { Badge, EmptyState, PageHeader, PageLoader } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'
import { fmtDate } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'

export default function LogsPage() {
  const t = useT()
  const locale = useIntlLocale()
  const [partnerId, setPartnerId] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const { data: partners } = useGet<PartnerDto[]>('/admin/partners')
  const { data, isLoading } = useGet<IntegrationLogDto[]>('/admin/integration-logs', { query: { partnerId, limit: 100 }, refetchInterval: 15_000 })
  const names = Object.fromEntries((partners ?? []).map((p) => [p.id, p.name]))
  return (
    <div>
      <PageHeader title={t('nav.logs')} subtitle={t('admin.logs.subtitle')} actions={<Select className="w-60" placeholder={t('common.all')} value={partnerId} onChange={(e) => setPartnerId(e.target.value)} options={(partners ?? []).map((p) => ({ value: p.id, label: p.name }))} />} />
      {isLoading ? <PageLoader /> : !data?.length ? <EmptyState title={t('admin.logs.empty')} /> : (
        <ul className="card divide-y divide-ink-100">
          {data.map((l) => (
            <li key={l.id}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50" onClick={() => setOpen(open === l.id ? null : l.id)}>
                {l.direction === 'OUTBOUND' ? <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400" /> : <ArrowDownLeft className="h-4 w-4 shrink-0 text-sky-500" />}
                <Badge tone={l.ok ? 'green' : 'red'}>{l.ok ? 'OK' : 'ERRO'}</Badge>
                <span className="min-w-0 flex-1 truncate text-sm"><span className="font-medium">{names[l.partnerId] ?? '—'}</span> <code className="text-xs text-ink-500">{l.operation}</code>{l.error && <span className="ml-2 text-xs text-red-600">{l.error}</span>}</span>
                <span className="hidden text-xs text-ink-400 sm:block">{l.statusCode ?? ''} {l.durationMs != null && `${l.durationMs}ms`}</span>
                <span className="hidden text-xs text-ink-400 md:block">{fmtDate(l.createdAt, locale, true)}</span>
                <ChevronDown className={cn('h-4 w-4 text-ink-400 transition-transform', open === l.id && 'rotate-180')} />
              </button>
              {open === l.id && (
                <div className="grid gap-3 bg-ink-50 px-4 pb-4 pt-1 md:grid-cols-2">
                  {(['request', 'response'] as const).map((k) => (
                    <div key={k}>
                      <p className="mb-1 text-xs font-medium uppercase text-ink-500">{k}</p>
                      <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-relaxed text-ink-700 ring-1 ring-ink-200">{l[k] == null ? '—' : JSON.stringify(l[k], null, 2)}</pre>
                    </div>
                  ))}
                  {l.correlationId && <p className="text-xs text-ink-500 md:col-span-2">correlation: <code>{l.correlationId}</code></p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
