'use client'
import { Check, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { documentTypesFor, fieldIsActive, hasValue, resolveOptions, sectionsFor, type DocumentDto, type FieldDef, type OnboardingStateDto } from '@amazon-trade/shared'
import { ConfirmDialog } from '@/components/ui/overlay'
import { Alert, Badge, Button, PageHeader, PageLoader, ProgressBar, Section, StatusBadge } from '@/components/ui/primitives'
import { api, openFile } from '@/lib/api'
import { fmtBytes, fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useL, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'

function useValueText() {
  const tl = useL()
  const t = useT()
  return (f: FieldDef, v: unknown): string => {
    if (!hasValue(v) && v !== false) return '—'
    if (typeof v === 'boolean') return v ? t('common.yes') : t('common.no')
    if (Array.isArray(v)) return v.map((x) => optionLabel(f, String(x))).join(', ')
    return optionLabel(f, String(v))
  }
  function optionLabel(f: FieldDef, value: string) {
    const o = resolveOptions(f).find((x) => x.value === value)
    return o ? tl(o.label) : value
  }
}

export default function CompanyReview({ params }: { params: { companyId: string } }) {
  const t = useT()
  const tl = useL()
  const locale = useIntlLocale()
  const enumLabel = useEnumLabel()
  const valueText = useValueText()
  const { data: state, isLoading } = useGet<OnboardingStateDto>(`/admin/compliance/${params.companyId}`, { staleTime: 0 })
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | null>(null)
  const [reject, setReject] = useState<DocumentDto | null>(null)
  const refresh = [`/admin/compliance`]
  const review = useSend((v: { decision: string; reason?: string }) => api(`/admin/compliance/${params.companyId}/review`, { method: 'POST', body: v }), {
    invalidate: refresh,
    onSuccess: () => {
      toast.success(t('admin.review.done'))
      setDecision(null)
    },
  })
  const docReview = useSend((v: { id: string; decision: 'APPROVE' | 'REJECT'; reason?: string }) => api(`/admin/documents/${v.id}/review`, { method: 'POST', body: { decision: v.decision, reason: v.reason } }), {
    invalidate: refresh,
    onSuccess: () => setReject(null),
  })
  if (isLoading || !state) return <PageLoader />
  const { company } = state
  const sections = sectionsFor(company.type)
  const decidable = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED'].includes(company.onboardingStatus)

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{company.legalName} <StatusBadge group="onboarding" value={company.onboardingStatus} /></span>}
        subtitle={`${enumLabel('companyType', company.type)} · ${company.country}${company.taxId ? ` · ${company.taxId}` : ''}${company.submittedAt ? ` · ${t('admin.submittedAt')} ${fmtDate(company.submittedAt, locale, true)}` : ''}`}
        actions={
          <>
            <Link href="/admin/compliance" className="btn-ghost">← {t('common.back')}</Link>
            {decidable && (
              <>
                <Button variant="secondary" onClick={() => setDecision('REQUEST_CHANGES')}>{t('admin.review.requestChanges')}</Button>
                <Button variant="danger" onClick={() => setDecision('REJECT')}>{t('admin.review.reject')}</Button>
                <Button onClick={() => setDecision('APPROVE')}><Check className="h-4 w-4" /> {t('admin.review.approve')}</Button>
              </>
            )}
          </>
        }
      />
      {company.reviewNote && <Alert tone="info" title={t('admin.review.lastNote')}>{company.reviewNote}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {sections.map((s) => {
            const data = state.sections[s.key]
            const items = s.repeatable ? (((data as { items?: Record<string, unknown>[] } | undefined)?.items) ?? []) : [(data ?? {}) as Record<string, unknown>]
            return (
              <Section key={s.key} title={tl(s.title)}>
                {!data || (s.repeatable && !items.length) ? (
                  <p className="text-sm text-ink-400">{t('admin.review.noData')}</p>
                ) : (
                  <div className="space-y-5">
                    {items.map((item, idx) => (
                      <dl key={idx} className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {s.repeatable && <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 sm:col-span-2">{tl(s.repeatable.itemLabel)} #{idx + 1}</p>}
                        {s.fields.filter((f) => fieldIsActive(f, item)).map((f) => (
                          <div key={f.key} className={f.type === 'textarea' || f.type === 'multiselect' || f.type === 'tags' ? 'sm:col-span-2' : undefined}>
                            <dt className="text-xs text-ink-500">{tl(f.label)}</dt>
                            <dd className="mt-0.5 break-words text-sm text-ink-900">{valueText(f, item[f.key])}</dd>
                          </div>
                        ))}
                      </dl>
                    ))}
                  </div>
                )}
              </Section>
            )
          })}
        </div>

        <div className="space-y-6">
          <Section title={t('onboarding.step.documents')}>
            <ul className="space-y-4">
              {documentTypesFor(company.type).map((def) => {
                const docs = state.documents.filter((d) => d.typeKey === def.key)
                return (
                  <li key={def.key}>
                    <p className="flex items-center gap-2 text-sm font-medium text-ink-900">{tl(def.label)} {def.required && <Badge tone="brand">{t('documents.required')}</Badge>}</p>
                    {!docs.length && <p className="mt-1 text-xs text-ink-400">{t('admin.review.noDocument')}</p>}
                    {docs.map((d) => (
                      <div key={d.id} className="mt-2 rounded-lg border border-ink-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-xs text-ink-700">{d.fileName} · {fmtBytes(d.sizeBytes)}</p>
                          <StatusBadge group="docStatus" value={d.status} />
                        </div>
                        {d.expiresAt && <p className="mt-1 text-xs text-ink-500">{t('documents.expires')} {fmtDate(d.expiresAt, locale)}</p>}
                        {d.reviewReason && <p className="mt-1 text-xs text-red-600">{d.reviewReason}</p>}
                        <div className="mt-2 flex gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => openFile(`/documents/${d.id}/download`, d.fileName)}><Eye className="h-3.5 w-3.5" /> {t('common.view')}</Button>
                          {d.status !== 'APPROVED' && <Button size="sm" onClick={() => docReview.mutate({ id: d.id, decision: 'APPROVE' })}><Check className="h-3.5 w-3.5" /></Button>}
                          {d.status !== 'REJECTED' && <Button size="sm" variant="danger" onClick={() => setReject(d)}><X className="h-3.5 w-3.5" /></Button>}
                        </div>
                      </div>
                    ))}
                  </li>
                )
              })}
            </ul>
          </Section>
          <Section title={t('onboarding.readiness')}>
            <ProgressBar value={state.submission.percent} />
            <p className="mt-2 text-sm text-ink-600">{Math.round(state.submission.percent)}%</p>
            <ul className="mt-4 space-y-2.5">
              {Object.entries(state.partners).filter(([, r]) => r.total > 0).map(([p, r]) => (
                <li key={p}>
                  <div className="flex justify-between text-xs"><span className="text-ink-700">{enumLabel('partner', p)}</span><span className="text-ink-500">{Math.round(r.percent)}%</span></div>
                  <ProgressBar value={r.percent} className="mt-1 h-1.5" />
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <ConfirmDialog open={decision === 'APPROVE'} onClose={() => setDecision(null)} loading={review.isPending} title={t('admin.review.approve.title')} description={t('admin.review.approve.text')} onConfirm={() => review.mutate({ decision: 'APPROVE' })} />
      <ConfirmDialog open={decision === 'REQUEST_CHANGES'} onClose={() => setDecision(null)} loading={review.isPending} title={t('admin.review.requestChanges')} reason={{ label: t('admin.review.reason'), required: true }} onConfirm={(reason) => review.mutate({ decision: 'REQUEST_CHANGES', reason })} />
      <ConfirmDialog open={decision === 'REJECT'} onClose={() => setDecision(null)} loading={review.isPending} danger title={t('admin.review.reject')} reason={{ label: t('admin.review.reason'), required: true }} onConfirm={(reason) => review.mutate({ decision: 'REJECT', reason })} />
      <ConfirmDialog open={!!reject} onClose={() => setReject(null)} loading={docReview.isPending} danger title={t('admin.review.rejectDoc')} reason={{ label: t('admin.review.reason'), required: true }} onConfirm={(reason) => reject && docReview.mutate({ id: reject.id, decision: 'REJECT', reason })} />
    </div>
  )
}
