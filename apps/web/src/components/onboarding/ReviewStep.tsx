'use client'
import { CheckCircle2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { PARTNER_TYPES, type MissingRequirement, type OnboardingStateDto, type PartnerType } from '@amazon-trade/shared'
import { Alert, Button, ProgressBar, StatusBadge } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useEnumLabel, useL, useT } from '@/lib/i18n'
import { useSend } from '@/lib/query'

export function ReviewStep({
  state,
  emailVerified,
  onGoto,
  sectionTitle,
}: {
  state: OnboardingStateDto
  emailVerified: boolean
  onGoto: (target: { section: string | null; documents?: boolean }) => void
  sectionTitle: (key: string) => string
}) {
  const t = useT()
  const tl = useL()
  const enumLabel = useEnumLabel()
  const { submission, company } = state
  const submit = useSend(() => api('/onboarding/submit', { method: 'POST' }), {
    invalidate: ['/onboarding', '/auth/me', '/dashboard'],
    onSuccess: () => toast.success(t('onboarding.submitted')),
  })
  const canEdit = company.onboardingStatus === 'DRAFT' || company.onboardingStatus === 'CHANGES_REQUESTED'

  const group = (m: MissingRequirement) => (m.kind === 'document' ? '__docs__' : m.section ?? '__other__')
  const groups = new Map<string, MissingRequirement[]>()
  for (const m of submission.missing) groups.set(group(m), [...(groups.get(group(m)) ?? []), m])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">{t('onboarding.readiness')}</p>
          <span className="text-sm font-semibold text-brand-700">{Math.round(submission.percent)}%</span>
        </div>
        <ProgressBar value={submission.percent} className="mt-3" />
        {submission.ready ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {t('onboarding.readyToSubmit')}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-ink-600">{t('onboarding.missingIntro')}</p>
            {[...groups.entries()].map(([key, list]) => (
              <div key={key} className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <button type="button" onClick={() => onGoto(key === '__docs__' ? { section: null, documents: true } : { section: key })} className="text-sm font-semibold text-red-800 hover:underline">
                  {key === '__docs__' ? t('onboarding.step.documents') : sectionTitle(key)} · {list.length}
                </button>
                <ul className="mt-1.5 list-inside list-disc text-xs text-red-800/90">
                  {list.slice(0, 6).map((m, i) => (
                    <li key={i}>{m.kind === 'min_items' ? t('onboarding.minItemsShort') : tl(m.label)}</li>
                  ))}
                  {list.length > 6 && <li>+{list.length - 6}…</li>}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-semibold text-ink-900">{t('onboarding.partnerReadiness')}</p>
        <p className="mt-1 text-xs text-ink-500">{t('onboarding.partnerReadinessHint')}</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {PARTNER_TYPES.filter((p) => state.partners[p as PartnerType] && state.partners[p as PartnerType].total > 0).map((p) => {
            const r = state.partners[p as PartnerType]
            return (
              <li key={p}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-700">{enumLabel('partner', p)}</span>
                  <span className="text-ink-500">{Math.round(r.percent)}%</span>
                </div>
                <ProgressBar value={r.percent} className="mt-1.5 h-1.5" />
              </li>
            )
          })}
        </ul>
      </div>

      {company.onboardingStatus === 'APPROVED' ? (
        <Alert tone="success" title={t('onboarding.approved.title')}>{t('onboarding.approved.text')}</Alert>
      ) : company.onboardingStatus === 'REJECTED' ? (
        <Alert tone="error" title={t('onboarding.rejected.title')}>{company.reviewNote}</Alert>
      ) : canEdit ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <StatusBadge group="onboarding" value={company.onboardingStatus} />
            {!emailVerified && <span className="text-amber-700">{t('onboarding.verifyFirst')}</span>}
          </div>
          <Button size="lg" disabled={!submission.ready || !emailVerified} loading={submit.isPending} onClick={() => submit.mutate()}>
            <Send className="h-4 w-4" /> {t('onboarding.submit')}
          </Button>
        </div>
      ) : (
        <Alert tone="info" title={t('onboarding.inReview.title')}>{t('onboarding.inReview.text')}</Alert>
      )}
    </div>
  )
}
