'use client'

import { useMockSession } from '@/lib/mock-session'
import { ENTITY_CONFIG } from '@/lib/entity-config'
import { useTranslations } from 'next-intl'
import {
  User,
  Building2,
  MapPin,
  Mail,
  Phone,
  FileText,
  Save,
  CheckCircle2,
  UserPlus,
  Crown,
  Eye,
  Edit,
} from 'lucide-react'
import { useState } from 'react'
import { cn, formatCNPJ } from '@/lib/utils'
import type { EntityMember, EntityMemberRole } from '@/types'

const ROLE_ICONS: Record<EntityMemberRole, React.ElementType> = {
  ADMIN: Crown,
  OPERATOR: Edit,
  VIEWER: Eye,
}

const ROLE_COLORS: Record<EntityMemberRole, string> = {
  ADMIN:    'text-amber-400 bg-amber-400/10 border-amber-400/20',
  OPERATOR: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  VIEWER:   'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

export default function MinhaContaPage() {
  const { user, entityType } = useMockSession()
  const config = ENTITY_CONFIG[entityType]
  const t = useTranslations('account')
  const [saved, setSaved] = useState(false)
  const [cnpjValue, setCnpjValue] = useState(user.cnpj ?? '')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<EntityMemberRole>('OPERATOR')
  const [inviteSent, setInviteSent] = useState(false)
  const [localMembers, setLocalMembers] = useState<EntityMember[]>(user.team_members ?? [])

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const newMember: EntityMember = {
      id: `invite-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      entity_role: inviteRole,
      joined_at: new Date().toISOString(),
      active: false,
    }
    setLocalMembers((prev) => [...prev, newMember])
    setInviteSent(true)
    setTimeout(() => {
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('OPERATOR')
      setInviteSent(false)
    }, 1800)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {t('subtitle', { label: config.label, tagline: config.tagline })}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Contact info */}
        <section className="card space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <User className="w-4 h-4 text-[#584531]" />
            {t('contactSection')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">{t('fullName')}</label>
              <input type="text" defaultValue={user.name} className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {t('email')}
              </label>
              <input type="email" defaultValue={user.email} className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {t('phone')}
              </label>
              <input type="tel" placeholder={t('phonePlaceholder')} className="input w-full" />
            </div>
          </div>
        </section>

        {/* Company info */}
        <section className="card space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#584531]" />
            {t('companySection')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">{t('companyName')}</label>
              <input type="text" defaultValue={user.company_name} className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3" /> {t('cnpj')}
              </label>
              <input type="text" value={cnpjValue} onChange={(e) => setCnpjValue(formatCNPJ(e.target.value))} className="input w-full" placeholder={t('cnpjPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {t('cityState')}
              </label>
              <input type="text" defaultValue={user.city} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">{t('country')}</label>
              <input type="text" defaultValue={user.country} className="input w-full" />
            </div>
          </div>
        </section>

        {/* Entity-specific fields */}
        {config.specificFields.length > 0 && (
          <section className="card space-y-4">
            <h2 className="section-title flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#584531]" />
              {t('specificSection', { entity: config.label })}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.specificFields.slice(0, 12).map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select className="input w-full" defaultValue="">
                      <option value="" disabled>Select�</option>
                      {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea rows={3} placeholder={field.placeholder} className="input w-full resize-none" />
                  ) : field.type === 'multiselect' ? (
                    <select className="input w-full" multiple size={3}>
                      {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="border-[#3e2e1e]/30 bg-white/60 text-[#584531]" />
                      <span className="text-sm text-slate-300">{field.hint ?? field.label}</span>
                    </label>
                  ) : (
                    <input type={field.type ?? 'text'} placeholder={field.placeholder} className="input w-full" required={field.required} />
                  )}

                  {field.hint && field.type !== 'checkbox' && (
                    <p className="text-xs text-slate-500 mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Save actions */}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary flex items-center gap-2">
            {saved ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-700" /> {t('savedMsg')}</>
            ) : (
              <><Save className="w-4 h-4" /> {t('saveBtn')}</>
            )}
          </button>
          <p className="text-xs text-slate-500">
            {saved ? t('savedNote') : t('unsavedNote')}
          </p>
        </div>
      </form>

      {/* Team Members */}
      {localMembers.length > 0 && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <User className="w-4 h-4 text-[#584531]" />
              {t('teamSection')}
            </h2>
            <button
              onClick={() => setInviteOpen(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> {t('inviteBtn')}
            </button>
          </div>
          <p className="text-xs text-slate-500 -mt-2">{t('teamDesc')}</p>

          <div className="space-y-2">
            {localMembers.map((member) => {
              const RoleIcon = ROLE_ICONS[member.entity_role]
              return (
                <div key={member.id}
                  className={cn('flex items-center justify-between py-2.5 px-3', member.active ? 'bg-[#f0e8de]' : 'opacity-50 bg-[#f0e8de]')}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#3e2e1e]/10 flex items-center justify-center flex-shrink-0">
                      <RoleIcon className="w-3.5 h-3.5 text-[#584531]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {member.name}
                        {!member.active && <span className="ml-2 text-xs text-slate-500">{t('pendingBadge')}</span>}
                      </p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs border px-2 py-0.5', ROLE_COLORS[member.entity_role])}>
                    {t(`teamRoles.${member.entity_role}` as Parameters<typeof t>[0])}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#3e2e1e]/15 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#3e2e1e] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#584531]" /> {t('inviteTitle')}
              </h3>
              <button
                onClick={() => { setInviteOpen(false); setInviteSent(false) }}
                className="text-[#584531]/50 hover:text-[#3e2e1e] text-xl leading-none"
              >&times;</button>
            </div>

            {inviteSent ? (
              <div className="flex items-center gap-3 py-6 justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                <p className="text-sm text-emerald-600 font-medium">{t('inviteSent', { email: inviteEmail })}</p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{t('inviteEmailLabel')}</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder={t('inviteEmailPlaceholder')}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{t('inviteRoleLabel')}</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as EntityMemberRole)}
                    className="input w-full"
                  >
                    <option value="ADMIN">{t('roleDescAdmin')}</option>
                    <option value="OPERATOR">{t('roleDescOperator')}</option>
                    <option value="VIEWER">{t('roleDescViewer')}</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="btn-primary flex-1">
                    {t('inviteSendBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}