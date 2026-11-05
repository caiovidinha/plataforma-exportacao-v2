'use client'
import { Building2, ListChecks, ShoppingBag, Ship, ShieldCheck, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { PageHeader, PageLoader, Stat } from '@/components/ui/primitives'
import { useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'

interface Overview {
  companiesPendingReview: number
  companiesApproved: number
  ordersAwaiting: number
  shipmentsInProgress: number
  shipmentsDispute: number
  jobsQueued: number
  jobsDead: number
}

export default function AdminHome() {
  const t = useT()
  const { data, isLoading } = useGet<Overview>('/admin/overview', { refetchInterval: 30_000 })
  if (isLoading || !data) return <PageLoader />
  const link = (href: string, node: React.ReactNode) => <Link href={href} className="block transition-transform hover:-translate-y-0.5">{node}</Link>
  return (
    <div>
      <PageHeader title={t('admin.overview.title')} subtitle={t('admin.overview.subtitle')} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {link('/admin/compliance', <Stat label={t('admin.kpi.pendingReview')} value={data.companiesPendingReview} icon={<ShieldCheck className="h-4 w-4" />} hint={t('admin.kpi.approved', { n: data.companiesApproved })} />)}
        {link('/admin/orders', <Stat label={t('admin.kpi.ordersAwaiting')} value={data.ordersAwaiting} icon={<ShoppingBag className="h-4 w-4" />} />)}
        {link('/admin/shipments', <Stat label={t('admin.kpi.shipments')} value={data.shipmentsInProgress} icon={<Ship className="h-4 w-4" />} hint={data.shipmentsDispute ? t('admin.kpi.dispute', { n: data.shipmentsDispute }) : undefined} />)}
        {link('/admin/jobs', <Stat label={t('admin.kpi.jobs')} value={data.jobsQueued} icon={<ListChecks className="h-4 w-4" />} hint={t('admin.kpi.dead', { n: data.jobsDead })} />)}
      </div>
      {data.jobsDead > 0 && (
        <Link href="/admin/jobs?status=DEAD" className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 hover:bg-red-100">
          <TriangleAlert className="h-5 w-5" /> {t('admin.deadAlert', { n: data.jobsDead })}
        </Link>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['/admin/partners', Building2, t('nav.partners'), t('admin.shortcut.partners')],
          ['/admin/pricing', ListChecks, t('nav.pricing'), t('admin.shortcut.pricing')],
          ['/admin/tariffs', ShieldCheck, t('nav.tariffs'), t('admin.shortcut.tariffs')],
        ].map(([href, Icon, title, text]) => {
          const I = Icon as typeof Building2
          return (
            <Link key={href as string} href={href as string} className="card-pad transition-shadow hover:shadow-pop">
              <I className="h-5 w-5 text-brand-600" />
              <p className="mt-3 text-sm font-semibold text-ink-900">{title as string}</p>
              <p className="mt-1 text-xs text-ink-500">{text as string}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
