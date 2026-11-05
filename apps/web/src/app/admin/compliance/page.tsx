'use client'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ONBOARDING_STATUSES } from '@amazon-trade/shared'
import { Select } from '@/components/ui/form'
import { EmptyState, PageHeader, PageLoader, StatusBadge } from '@/components/ui/primitives'
import { fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'

interface QueueRow { id: string; legalName: string; type: string; country: string; onboardingStatus: string; submittedAt: string | null }

export default function ComplianceQueue() {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const [status, setStatus] = useState('SUBMITTED')
  const { data, isLoading } = useGet<QueueRow[]>('/admin/compliance/queue', { query: { status } })
  return (
    <div>
      <PageHeader title={t('nav.compliance')} subtitle={t('admin.compliance.subtitle')} actions={<Select className="w-52" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: t('common.all') }, ...ONBOARDING_STATUSES.map((s) => ({ value: s, label: enumLabel('onboarding', s) }))]} />} />
      {isLoading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={<ShieldCheck className="h-8 w-8" />} title={t('admin.compliance.empty')} />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>{t('admin.company')}</th><th>{t('admin.type')}</th><th className="hidden md:table-cell">{t('admin.country')}</th><th>{t('common.status')}</th><th className="hidden md:table-cell">{t('admin.submittedAt')}</th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/compliance/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.legalName}</Link></td>
                  <td>{enumLabel('companyType', c.type)}</td>
                  <td className="hidden md:table-cell">{c.country}</td>
                  <td><StatusBadge group="onboarding" value={c.onboardingStatus} /></td>
                  <td className="hidden text-ink-500 md:table-cell">{fmtDate(c.submittedAt, locale, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
