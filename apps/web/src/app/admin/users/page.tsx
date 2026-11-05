'use client'
import { useState } from 'react'
import { PLATFORM_ROLES } from '@amazon-trade/shared'
import { Input, Select } from '@/components/ui/form'
import { Badge, Button, PageHeader, PageLoader } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'
import { useSession } from '@/lib/session'

interface UserRow { id: string; email: string; fullName: string; platformRole: string; emailVerified: boolean; disabled: boolean; lastLoginAt: string | null; companyId: string | null; memberRole: string | null }

export default function UsersPage() {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const me = useSession().data
  const [q, setQ] = useState('')
  const { data, isLoading } = useGet<UserRow[]>('/admin/users', { query: { q } })
  const patch = useSend((v: { id: string; platformRole?: string; disabled?: boolean }) => api(`/admin/users/${v.id}`, { method: 'PATCH', body: { platformRole: v.platformRole, disabled: v.disabled } }), { invalidate: ['/admin/users'] })
  return (
    <div>
      <PageHeader title={t('nav.users')} subtitle={t('admin.users.subtitle')} actions={<Input className="w-64" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />} />
      {isLoading ? <PageLoader /> : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>{t('team.name')}</th><th>{t('admin.platformRole')}</th><th className="hidden md:table-cell">{t('admin.lastLogin')}</th><th /></tr></thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id} className={u.disabled ? 'opacity-60' : undefined}>
                  <td><p className="font-medium">{u.fullName} {u.disabled && <Badge tone="red">{t('admin.users.disabled')}</Badge>}</p><p className="text-xs text-ink-500">{u.email}</p></td>
                  <td><Select className="w-44 py-1.5 text-xs" disabled={u.id === me?.id} value={u.platformRole} onChange={(e) => patch.mutate({ id: u.id, platformRole: e.target.value })} options={PLATFORM_ROLES.map((r) => ({ value: r, label: enumLabel('role', r) }))} /></td>
                  <td className="hidden text-ink-500 md:table-cell">{fmtDate(u.lastLoginAt, locale, true)}</td>
                  <td className="text-right">{u.id !== me?.id && <Button size="sm" variant="ghost" onClick={() => patch.mutate({ id: u.id, disabled: !u.disabled })}>{u.disabled ? t('admin.users.enable') : t('admin.users.disable')}</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
