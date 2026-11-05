'use client'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { NotificationDto } from '@amazon-trade/shared'
import { api } from '@/lib/api'
import { fmtRelative } from '@/lib/format'
import { useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/overlay'

/** Link da notificação (gravado pela API como caminho neutro) → rota da área do usuário. */
export function notificationHref(link: string | null, area: 'exporter' | 'store' | 'admin') {
  if (!link) return null
  if (link.startsWith('/admin')) return area === 'admin' ? link : null
  if (area === 'admin') return link
  return `/${area}${link}`
}

export function NotificationBell({ area }: { area: 'exporter' | 'store' | 'admin' }) {
  const t = useT()
  const locale = useIntlLocale()
  const router = useRouter()
  const { data } = useGet<{ unread: number; items: NotificationDto[] }>('/notifications', { refetchInterval: 30_000 })
  const read = useSend((id: string) => api(`/notifications/${id}/read`, { method: 'POST' }), { invalidate: ['/notifications'], silent: true })
  const readAll = useSend(() => api('/notifications/read-all', { method: 'POST' }), { invalidate: ['/notifications'], silent: true })
  const unread = data?.unread ?? 0

  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <button type="button" className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800" aria-label={t('nav.notifications')}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-none bg-brand-600 px-1 text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <div className="flex w-80 items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold text-ink-900">{t('nav.notifications')}</span>
          {unread > 0 && (
            <button type="button" onClick={() => readAll.mutate()} className="text-xs font-medium text-brand-700 hover:underline">
              {t('notifications.markAll')}
            </button>
          )}
        </div>
        <DropdownSeparator />
        <div className="max-h-96 overflow-y-auto">
          {!data?.items.length && <p className="px-3 py-8 text-center text-sm text-ink-500">{t('notifications.empty')}</p>}
          {data?.items.slice(0, 8).map((n) => (
            <DropdownItem
              key={n.id}
              onSelect={() => {
                if (!n.readAt) read.mutate(n.id)
                const href = notificationHref(n.link, area)
                if (href) router.push(href)
              }}
            >
              <div className="w-full">
                <div className="flex items-start gap-2">
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{n.title}</p>
                    {n.body && <p className="line-clamp-2 text-xs text-ink-500">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-ink-400">{fmtRelative(n.createdAt, locale)}</p>
                  </div>
                </div>
              </div>
            </DropdownItem>
          ))}
        </div>
      </DropdownContent>
    </DropdownMenu>
  )
}
