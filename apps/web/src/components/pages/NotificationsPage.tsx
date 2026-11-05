'use client'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { NotificationDto } from '@amazon-trade/shared'
import { notificationHref } from '@/components/layout/NotificationBell'
import { Button, EmptyState, PageHeader, PageLoader } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtDate } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

export function NotificationsPage({ area }: { area: 'exporter' | 'store' | 'admin' }) {
  const t = useT()
  const locale = useIntlLocale()
  const router = useRouter()
  const { data, isLoading } = useGet<{ unread: number; items: NotificationDto[] }>('/notifications')
  const read = useSend((id: string) => api(`/notifications/${id}/read`, { method: 'POST' }), { invalidate: ['/notifications'], silent: true })
  const readAll = useSend(() => api('/notifications/read-all', { method: 'POST' }), { invalidate: ['/notifications'] })
  if (isLoading) return <PageLoader />
  return (
    <div>
      <PageHeader title={t('nav.notifications')} actions={data?.unread ? <Button variant="secondary" size="sm" onClick={() => readAll.mutate()}>{t('notifications.markAll')}</Button> : undefined} />
      {!data?.items.length ? (
        <EmptyState icon={<Bell className="h-8 w-8" />} title={t('notifications.empty')} />
      ) : (
        <ul className="card divide-y divide-ink-100">
          {data.items.map((n) => {
            const href = notificationHref(n.link, area)
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn('flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-ink-50', !href && 'cursor-default')}
                  onClick={() => {
                    if (!n.readAt) read.mutate(n.id)
                    if (href) router.push(href)
                  }}
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.readAt ? 'bg-transparent' : 'bg-brand-600')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900">{n.title}</span>
                    {n.body && <span className="mt-0.5 block text-sm text-ink-600">{n.body}</span>}
                    <span className="mt-1 block text-xs text-ink-400">{fmtDate(n.createdAt, locale, true)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
