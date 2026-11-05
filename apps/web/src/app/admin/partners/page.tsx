'use client'
import { Check, Copy, Plus, RefreshCw, Settings2, Zap } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { INTEGRATION_ENVIRONMENTS, INTEGRATION_MODES, PARTNER_META, PARTNER_TYPES, type IntegrationDto, type IntegrationEnvironment, type IntegrationMode, type PartnerDto, type PartnerType } from '@amazon-trade/shared'
import { Checkbox, Field, Input, NumberInput, Select, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/overlay'
import { Alert, Badge, Button, PageHeader, PageLoader, Section } from '@/components/ui/primitives'
import { api, ApiError } from '@/lib/api'
import { fmtRelative } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useL, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

const copy = (text: string, msg: string) => navigator.clipboard.writeText(text).then(() => toast.success(msg))

// ------------------------------------------------------------------ novo parceiro
function PartnerModal({ type, onClose }: { type: PartnerType | null; onClose: () => void }) {
  const t = useT()
  const [form, setForm] = useState({ key: '', name: '', contactName: '', contactEmail: '', contactPhone: '', notes: '' })
  const create = useSend(
    () => api('/admin/partners', { method: 'POST', body: { type, key: form.key, name: form.name, contactName: form.contactName || undefined, contactEmail: form.contactEmail || undefined, contactPhone: form.contactPhone || undefined, notes: form.notes || undefined, active: true } }),
    { invalidate: ['/admin/partners'], onSuccess: () => { toast.success(t('admin.partners.created')); onClose() } },
  )
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })
  return (
    <Modal open={!!type} onClose={onClose} title={t('admin.partners.new')} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={create.isPending} disabled={form.name.length < 2 || form.key.length < 3} onClick={() => create.mutate()}>{t('common.save')}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('admin.partners.name')}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, key: form.key || e.target.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) })} /></Field>
        <Field label={t('admin.partners.key')} help={t('admin.partners.keyHint')}><Input value={form.key} onChange={set('key')} /></Field>
        <Field label={t('admin.partners.contactName')}><Input value={form.contactName} onChange={set('contactName')} /></Field>
        <Field label={t('admin.partners.contactEmail')}><Input type="email" value={form.contactEmail} onChange={set('contactEmail')} /></Field>
        <Field label={t('admin.partners.contactPhone')}><Input value={form.contactPhone} onChange={set('contactPhone')} /></Field>
        <Field label={t('admin.partners.notes')} className="sm:col-span-2"><Textarea rows={2} value={form.notes} onChange={set('notes')} /></Field>
      </div>
    </Modal>
  )
}

// ------------------------------------------------------------------ integração
function IntegrationModal({ partner, existing, env, onClose }: { partner: PartnerDto; existing: IntegrationDto | null; env: IntegrationEnvironment; onClose: () => void }) {
  const t = useT()
  const enumLabel = useEnumLabel()
  const { data: adapters } = useGet<{ adapters: { id: string; capabilities: string[] }[] }>('/admin/adapters')
  const { adapter: currentAdapter, ...restConfig } = (existing?.config ?? {}) as Record<string, unknown>
  const [form, setForm] = useState({
    mode: (existing?.mode ?? PARTNER_META[partner.type].defaultMode) as IntegrationMode,
    enabled: existing?.enabled ?? false,
    adapter: (currentAdapter as string | undefined) ?? '',
    timeoutMs: existing?.timeoutMs ?? 15000,
    maxAttempts: existing?.maxAttempts ?? 6,
    contractVersion: existing?.contractVersion ?? '',
    config: JSON.stringify(restConfig, null, 2),
  })
  const [secrets, setSecrets] = useState<{ key: string; value: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const save = useSend(
    () => {
      let config: Record<string, unknown>
      try {
        config = JSON.parse(form.config || '{}')
      } catch {
        throw new Error(t('admin.tariffs.badJson'))
      }
      if (form.adapter) config.adapter = form.adapter
      const body: Record<string, string> = {}
      for (const s of secrets) if (s.key.trim()) body[s.key.trim()] = s.value
      return api(`/admin/partners/${partner.id}/integrations`, {
        method: 'PUT',
        body: { mode: form.mode, environment: env, enabled: form.enabled, config, secrets: Object.keys(body).length ? body : undefined, timeoutMs: form.timeoutMs, maxAttempts: form.maxAttempts, contractVersion: form.contractVersion || undefined },
      })
    },
    { invalidate: ['/admin/partners'], silent: true, onSuccess: () => { toast.success(t('admin.partners.integrationSaved')); onClose() } },
  )
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${partner.name} — ${enumLabel('environment', env)}`}
      description={t('admin.integration.hint')}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={save.isPending} onClick={() => { setError(null); save.mutate(undefined, { onError: (e) => setError(e instanceof ApiError ? e.message : e.message) }) }}>{t('common.save')}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('admin.integration.mode')}><Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as IntegrationMode })} options={INTEGRATION_MODES.map((m) => ({ value: m, label: enumLabel('integrationMode', m) }))} /></Field>
        <Field label={t('admin.integration.adapter')} help={t('admin.integration.adapterHint')}><Select value={form.adapter} onChange={(e) => setForm({ ...form, adapter: e.target.value })} placeholder={t('admin.integration.adapterDefault')} options={(adapters?.adapters ?? []).filter((a) => env === 'SANDBOX' || a.id !== 'sandbox').map((a) => ({ value: a.id, label: a.id }))} /></Field>
        <Field label={t('admin.integration.timeout')}><NumberInput value={form.timeoutMs} onChange={(v) => setForm({ ...form, timeoutMs: v ?? 15000 })} /></Field>
        <Field label={t('admin.integration.maxAttempts')}><NumberInput value={form.maxAttempts} onChange={(v) => setForm({ ...form, maxAttempts: v ?? 6 })} /></Field>
        <Field label={t('admin.integration.contractVersion')}><Input value={form.contractVersion} onChange={(e) => setForm({ ...form, contractVersion: e.target.value })} placeholder="v1" /></Field>
        <div className="flex items-end pb-2"><Checkbox checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label={t('admin.integration.enabled')} /></div>
        <Field label={t('admin.integration.config')} help={t('admin.integration.configHint')} className="sm:col-span-2"><Textarea rows={7} className="font-mono text-xs" value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} /></Field>

        <div className="sm:col-span-2">
          <p className="label">{t('admin.integration.secrets')}</p>
          <p className="help mb-2">{t('admin.integration.secretsHint')}</p>
          {existing?.secretKeys.length ? <div className="mb-2 flex flex-wrap gap-1.5">{existing.secretKeys.map((k) => <Badge key={k}>{k} ••••</Badge>)}</div> : null}
          <div className="space-y-2">
            {secrets.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                <Input placeholder="apiKey" value={s.key} onChange={(e) => setSecrets(secrets.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                <Input type="password" autoComplete="off" placeholder={t('admin.integration.secretValue')} value={s.value} onChange={(e) => setSecrets(secrets.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <Button variant="ghost" onClick={() => setSecrets(secrets.filter((_, j) => j !== i))}>✕</Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setSecrets([...secrets, { key: '', value: '' }])}><Plus className="h-3.5 w-3.5" /> {t('admin.integration.addSecret')}</Button>
          </div>
        </div>
        {error && <div className="sm:col-span-2"><Alert tone="error">{error}</Alert></div>}
      </div>
    </Modal>
  )
}

// ------------------------------------------------------------------ cartão do parceiro
function PartnerCard({ partner, onEdit }: { partner: PartnerDto; onEdit: (p: PartnerDto, env: IntegrationEnvironment, i: IntegrationDto | null) => void }) {
  const t = useT()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const [secret, setSecret] = useState<string | null>(null)
  const toggle = useSend((active: boolean) => api(`/admin/partners/${partner.id}`, { method: 'PUT', body: { active } }), { invalidate: ['/admin/partners'] })
  const test = useSend((id: string) => api<{ ok: boolean; detail?: string; supported: boolean }>(`/admin/integrations/${id}/test`, { method: 'POST' }), {
    invalidate: ['/admin/partners'],
    onSuccess: (r) => (r.ok ? toast.success(`${t('admin.integration.testOk')} ${r.detail ?? ''}`) : toast.error(`${t('admin.integration.testFail')}: ${r.detail ?? ''}`)),
  })
  const rotate = useSend((id: string) => api<{ webhookSecret: string }>(`/admin/integrations/${id}/rotate-webhook-secret`, { method: 'POST' }), { invalidate: ['/admin/partners'], onSuccess: (r) => setSecret(r.webhookSecret) })
  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${partner.key}`

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">{partner.name} {!partner.active && <Badge tone="gray">{t('admin.partners.inactive')}</Badge>}</p>
          <p className="text-xs text-ink-500">{partner.key}{partner.contactEmail && ` · ${partner.contactEmail}`}</p>
        </div>
        <Checkbox checked={partner.active} onChange={(v) => toggle.mutate(v)} label={t('admin.partners.active')} />
      </div>

      <div className="mt-4 space-y-2">
        {INTEGRATION_ENVIRONMENTS.map((env) => {
          const i = partner.integrations.find((x) => x.environment === env) ?? null
          return (
            <div key={env} className="flex flex-wrap items-center gap-3 rounded-lg bg-ink-50 px-3 py-2.5 text-sm">
              <Badge tone={env === 'PRODUCTION' ? 'brand' : 'gray'}>{enumLabel('environment', env)}</Badge>
              {i ? (
                <>
                  <span className="text-ink-700">{enumLabel('integrationMode', i.mode)}</span>
                  <code className="rounded bg-white px-1.5 py-0.5 text-xs text-ink-600">{(i.config.adapter as string) ?? t('admin.integration.adapterDefault')}</code>
                  <Badge tone={i.enabled ? 'green' : 'gray'}>{i.enabled ? t('admin.integration.on') : t('admin.integration.off')}</Badge>
                  <span className="text-xs text-ink-500">{i.lastHealthAt ? `${i.lastHealthOk ? '● ' : '○ '}${fmtRelative(i.lastHealthAt, locale)}` : t('admin.integration.neverTested')}</span>
                  <span className="ml-auto flex gap-1">
                    <Button size="sm" variant="ghost" loading={test.isPending && test.variables === i.id} onClick={() => test.mutate(i.id)}><Zap className="h-3.5 w-3.5" /> {t('admin.integration.test')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => rotate.mutate(i.id)}><RefreshCw className="h-3.5 w-3.5" /> {t('admin.integration.rotate')}</Button>
                    <Button size="sm" variant="secondary" onClick={() => onEdit(partner, env, i)}><Settings2 className="h-3.5 w-3.5" /> {t('common.edit')}</Button>
                  </span>
                </>
              ) : (
                <Button size="sm" variant="secondary" className="ml-auto" onClick={() => onEdit(partner, env, null)}><Plus className="h-3.5 w-3.5" /> {t('admin.integration.configure')}</Button>
              )}
            </div>
          )
        })}
      </div>

      {partner.integrations.some((i) => i.mode === 'API' || i.mode === 'WEBHOOK_ONLY') && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          {t('admin.integration.webhookUrl')}: <code className="rounded bg-ink-100 px-1.5 py-0.5">{webhookUrl}</code>
          <button className="text-brand-700 hover:underline" onClick={() => copy(webhookUrl, t('common.copied'))}><Copy className="inline h-3 w-3" /></button>
        </p>
      )}

      <Modal open={!!secret} onClose={() => setSecret(null)} title={t('admin.integration.newSecret')} description={t('admin.integration.newSecretHint')} size="sm" footer={<Button onClick={() => setSecret(null)}><Check className="h-4 w-4" /> {t('common.done')}</Button>}>
        <code className="block break-all rounded-lg bg-ink-100 p-3 text-xs">{secret}</code>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => secret && copy(secret, t('common.copied'))}><Copy className="h-3.5 w-3.5" /> {t('common.copy')}</Button>
      </Modal>
    </div>
  )
}

export default function PartnersPage() {
  const t = useT()
  const tl = useL()
  const enumLabel = useEnumLabel()
  const { data, isLoading } = useGet<PartnerDto[]>('/admin/partners', { staleTime: 0 })
  const [newFor, setNewFor] = useState<PartnerType | null>(null)
  const [editing, setEditing] = useState<{ partner: PartnerDto; env: IntegrationEnvironment; integration: IntegrationDto | null } | null>(null)
  if (isLoading || !data) return <PageLoader />
  const types = PARTNER_TYPES.filter((p) => PARTNER_META[p].core || data.some((x) => x.type === p))
  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.partners')} subtitle={t('admin.partners.subtitle')} />
      {types.map((type) => {
        const meta = PARTNER_META[type]
        const list = data.filter((p) => p.type === type)
        return (
          <Section key={type} title={enumLabel('partner', type)} description={tl(meta.role)} actions={<div className="flex items-center gap-2"><Badge tone={meta.level === 'API' ? 'brand' : meta.level === 'NOTIFY' ? 'blue' : 'amber'}>{t(`admin.partners.level.${meta.level}` as never)}</Badge><Button size="sm" variant="secondary" onClick={() => setNewFor(type)}><Plus className="h-3.5 w-3.5" /> {t('admin.partners.new')}</Button></div>}>
            {list.length ? (
              <div className="space-y-3">{list.map((p) => <PartnerCard key={p.id} partner={p} onEdit={(partner, env, integration) => setEditing({ partner, env, integration })} />)}</div>
            ) : (
              <p className="text-sm text-ink-500">{t('admin.partners.none')}</p>
            )}
          </Section>
        )
      })}
      {newFor && <PartnerModal type={newFor} onClose={() => setNewFor(null)} />}
      {editing && <IntegrationModal key={`${editing.partner.id}${editing.env}`} partner={editing.partner} existing={editing.integration} env={editing.env} onClose={() => setEditing(null)} />}
    </div>
  )
}
