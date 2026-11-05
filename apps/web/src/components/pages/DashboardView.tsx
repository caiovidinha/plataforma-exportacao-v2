'use client'
import { ArrowRight, FileWarning, PackageCheck, ShoppingBag, Ship } from 'lucide-react'
import Link from 'next/link'
import { documentTypesFor, getStageDef, type DashboardDto, type OnboardingStateDto } from '@amazon-trade/shared'
import { Button, EmptyState, PageHeader, PageLoader, ProgressBar, Section, Stat, StatusBadge } from '@/components/ui/primitives'
import { fmtDate, fmtMoney } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useL, useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'
import { useSession } from '@/lib/session'

/** Visão geral (exportador: /exporter; importador: /store/account). Tudo vem de GET /dashboard. */
export function DashboardView({ base }: { base: '/exporter' | '/store' }) {
  const t = useT()
  const tl = useL()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const user = useSession().data
  const { data, isLoading } = useGet<DashboardDto>('/dashboard')
  const { data: onboarding } = useGet<OnboardingStateDto>('/onboarding')
  if (isLoading || !data) return <PageLoader />
  const exporter = data.role === 'EXPORTER'
  const c = data.counters

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.hello', { name: user?.fullName.split(' ')[0] ?? '' })} subtitle={user?.company?.legalName} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {exporter ? (
          <Stat label={t('dashboard.products')} value={c.productsPublished ?? 0} hint={t('dashboard.productsTotal', { n: c.productsTotal ?? 0 })} icon={<PackageCheck className="h-4 w-4" />} />
        ) : (
          <Stat label={t('dashboard.simulations')} value={c.simulations ?? 0} icon={<PackageCheck className="h-4 w-4" />} />
        )}
        <Stat label={t('dashboard.ordersAwaiting')} value={c.ordersAwaiting ?? 0} hint={t('dashboard.ordersConfirmed', { n: c.ordersConfirmed ?? 0 })} icon={<ShoppingBag className="h-4 w-4" />} />
        <Stat label={t('dashboard.shipments')} value={c.shipmentsInProgress ?? 0} icon={<Ship className="h-4 w-4" />} />
        <Stat label={t('dashboard.docsExpiring')} value={c.documentsExpiring ?? 0} hint={t('dashboard.docsExpiring.hint')} icon={<FileWarning className="h-4 w-4" />} />
      </div>

      {onboarding && onboarding.company.onboardingStatus !== 'APPROVED' && (
        <Section title={t('dashboard.onboarding')} actions={<StatusBadge group="onboarding" value={onboarding.company.onboardingStatus} />}>
          <ProgressBar value={onboarding.submission.percent} />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-ink-600">{Math.round(onboarding.submission.percent)}% {t('dashboard.complete')}</span>
            <Link href={`${base}/onboarding`} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
              {t('dashboard.continueOnboarding')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title={t('dashboard.recentOrders')} actions={<Link href={`${base}/orders`} className="text-xs font-medium text-brand-700 hover:underline">{t('common.viewAll')}</Link>}>
          {!data.recentOrders.length ? (
            <EmptyState title={t('orders.empty')} action={!exporter ? <Link href="/store" className="btn-primary btn-sm">{t('store.nav.catalog')}</Link> : undefined} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`${base}/orders/${o.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">{o.number}</Link>
                    <p className="truncate text-xs text-ink-500">{o.productName} · {exporter ? o.importer.name : o.exporter.name}</p>
                  </div>
                  <span className="hidden text-sm tabular-nums text-ink-700 sm:block">{fmtMoney(o.totalLandedUsd, 'USD', locale, 0)}</span>
                  <StatusBadge group="order" value={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t('dashboard.activeShipments')} actions={<Link href={`${base}/shipments`} className="text-xs font-medium text-brand-700 hover:underline">{t('common.viewAll')}</Link>}>
          {!data.activeShipments.length ? (
            <EmptyState title={t('shipments.empty')} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.activeShipments.map((s) => (
                <li key={s.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`${base}/shipments/${s.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">{s.number}</Link>
                    <StatusBadge group="shipment" value={s.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{s.productName} · {tl(getStageDef(s.stage).title)}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {data.expiringDocuments.length > 0 && (
        <Section title={t('dashboard.expiringDocs')} description={t('dashboard.expiringDocs.hint')}>
          <ul className="divide-y divide-ink-100">
            {data.expiringDocuments.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate">{tl(documentTypesFor("EXPORTER").concat(documentTypesFor("IMPORTER")).find((x) => x.key === d.typeKey)?.label) || d.typeKey} · {d.fileName}</span>
                <span className="shrink-0 text-amber-700">{fmtDate(d.expiresAt, locale)}</span>
              </li>
            ))}
          </ul>
          <Link href={`${base}/onboarding`}><Button variant="secondary" size="sm" className="mt-3">{t('dashboard.renew')}</Button></Link>
        </Section>
      )}
    </div>
  )
}
