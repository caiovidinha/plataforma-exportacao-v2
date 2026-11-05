'use client'
import type { PartnerDto } from '@amazon-trade/shared'
import { Badge, EmptyState, PageHeader, PageLoader } from '@/components/ui/primitives'
import { fmtDate } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'

interface Share { id: string; partnerId: string; companyId: string | null; shipmentId: string | null; operation: string; purpose: string; fields: string[]; documents: string[]; createdAt: string }

/** LGPD: o que foi compartilhado com cada parceiro, para qual finalidade e quando. */
export default function DataSharesPage() {
  const t = useT()
  const locale = useIntlLocale()
  const { data, isLoading } = useGet<Share[]>('/admin/data-shares', { query: { limit: 100 } })
  const { data: partners } = useGet<PartnerDto[]>('/admin/partners')
  const names = Object.fromEntries((partners ?? []).map((p) => [p.id, p.name]))
  return (
    <div>
      <PageHeader title={t('nav.dataShares')} subtitle={t('admin.shares.subtitle')} />
      {isLoading ? <PageLoader /> : !data?.length ? <EmptyState title={t('admin.shares.empty')} /> : (
        <div className="space-y-3">
          {data.map((s) => (
            <article key={s.id} className="card-pad">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">{names[s.partnerId] ?? s.partnerId} <code className="ml-2 text-xs font-normal text-ink-500">{s.operation}</code></p>
                <span className="text-xs text-ink-400">{fmtDate(s.createdAt, locale, true)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">{s.purpose}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.fields.slice(0, 40).map((f) => <Badge key={f}>{f}</Badge>)}
                {s.fields.length > 40 && <Badge tone="amber">+{s.fields.length - 40}</Badge>}
                {s.documents.map((d) => <Badge key={d} tone="brand">doc: {d}</Badge>)}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
