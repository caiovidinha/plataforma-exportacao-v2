'use client'
import { UserPlus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { MEMBER_ROLES } from '@amazon-trade/shared'
import { Field, Input, Select } from '@/components/ui/form'
import { ConfirmDialog, Modal } from '@/components/ui/overlay'
import { Badge, Button, PageHeader, PageLoader } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'
import { useSession } from '@/lib/session'

interface Member { id: string; email: string; fullName: string; role: string; emailVerified: boolean; createdAt: string }

export function TeamPage() {
  const t = useT()
  const locale = useIntlLocale()
  const enumLabel = useEnumLabel()
  const me = useSession().data
  const { data, isLoading } = useGet<Member[]>('/team')
  const [invite, setInvite] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', role: 'OPERATOR' })
  const [removing, setRemoving] = useState<Member | null>(null)
  const canManage = me?.company?.memberRole === 'OWNER' || me?.company?.memberRole === 'ADMIN'

  const add = useSend(() => api('/team/invite', { method: 'POST', body: form }), {
    invalidate: ['/team'],
    onSuccess: () => {
      toast.success(t('team.invited'))
      setInvite(false)
      setForm({ email: '', fullName: '', role: 'OPERATOR' })
    },
  })
  const remove = useSend((id: string) => api(`/team/${id}`, { method: 'DELETE' }), { invalidate: ['/team'], onSuccess: () => setRemoving(null) })
  if (isLoading) return <PageLoader />

  return (
    <div>
      <PageHeader title={t('nav.team')} subtitle={t('team.subtitle')} actions={canManage && <Button onClick={() => setInvite(true)}><UserPlus className="h-4 w-4" /> {t('team.invite')}</Button>} />
      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr><th>{t('team.name')}</th><th>{t('auth.email')}</th><th>{t('team.role')}</th><th className="hidden md:table-cell">{t('team.since')}</th><th /></tr>
          </thead>
          <tbody>
            {data?.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{m.fullName}{m.id === me?.id && <span className="ml-2 text-xs text-ink-400">({t('team.you')})</span>}</td>
                <td>{m.email} {!m.emailVerified && <Badge tone="amber">{t('team.unverified')}</Badge>}</td>
                <td><Badge tone={m.role === 'OWNER' ? 'brand' : 'gray'}>{enumLabel('memberRole', m.role)}</Badge></td>
                <td className="hidden text-ink-500 md:table-cell">{fmtDate(m.createdAt, locale)}</td>
                <td className="text-right">{canManage && m.role !== 'OWNER' && m.id !== me?.id && <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => setRemoving(m)} aria-label={t('common.remove')}><Trash2 className="h-4 w-4" /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title={t('team.invite')}
        description={t('team.invite.hint')}
        footer={<><Button variant="secondary" onClick={() => setInvite(false)}>{t('common.cancel')}</Button><Button loading={add.isPending} disabled={!form.email || form.fullName.length < 3} onClick={() => add.mutate()}>{t('team.invite.send')}</Button></>}
      >
        <div className="space-y-4">
          <Field label={t('team.name')}><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label={t('auth.email')}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label={t('team.role')}><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={MEMBER_ROLES.filter((r) => r !== 'OWNER').map((r) => ({ value: r, label: enumLabel('memberRole', r) }))} /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} danger loading={remove.isPending} title={t('team.remove.title')} description={removing?.email} onConfirm={() => removing && remove.mutate(removing.id)} />
    </div>
  )
}
