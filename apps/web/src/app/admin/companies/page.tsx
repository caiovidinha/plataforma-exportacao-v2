'use client'
import Link from 'next/link'
import { useState } from 'react'
import { COMPANY_TYPES, ONBOARDING_STATUSES } from '@amazon-trade/shared'
import { Input, Select } from '@/components/ui/form'
import { EmptyState, PageHeader, PageLoader, StatusBadge } from '@/components/ui/primitives'
import { fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'

interface Row { id: string; type: string; legalName: string; tradeName: string | null; country: string; onboardingStatus: string; createdAt: string }

export default function CompaniesPage() {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const { data, isLoading } = useGet<Row[]>('/admin/companies', { query: { q, type, status } })
  return (
    <div>
      <PageHeader title={t('nav.companies')} actions={<><Input className="w-56" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} /><Select className="w-40" placeholder={t('admin.type')} value={type} onChange={(e) => setType(e.target.value)} options={COMPANY_TYPES.map((c) => ({ value: c, label: enumLabel('companyType', c) }))} /><Select className="w-48" placeholder={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value)} options={ONBOARDING_STATUSES.map((s) => ({ value: s, label: enumLabel('onboarding', s) }))} /></>} />
      {isLoading ? <PageLoader /> : !data?.length ? <EmptyState title={t('admin.companies.empty')} /> : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>{t('admin.company')}</th><th>{t('admin.type')}</th><th className="hidden md:table-cell">{t('admin.country')}</th><th>{t('common.status')}</th><th className="hidden md:table-cell">{t('admin.createdAt')}</th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/compliance/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.legalName}</Link>{c.tradeName && <p className="text-xs text-ink-500">{c.tradeName}</p>}</td>
                  <td>{enumLabel('companyType', c.type)}</td>
                  <td className="hidden md:table-cell">{c.country}</td>
                  <td><StatusBadge group="onboarding" value={c.onboardingStatus} /></td>
                  <td className="hidden text-ink-500 md:table-cell">{fmtDate(c.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
