'use client'
import { CheckCircle2, Circle, FileText, ListChecks } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { documentTypesFor, findMissingRequired, sectionsFor, type MissingField, type OnboardingStateDto, type SectionData } from '@amazon-trade/shared'
import { Alert, PageHeader, PageLoader, ProgressBar, StatusBadge } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useL, useT } from '@/lib/i18n'
import { useGet, useSend } from '@/lib/query'
import { useSession } from '@/lib/session'
import { DocumentsStep } from './DocumentsStep'
import { ReviewStep } from './ReviewStep'
import { parseSaveErrors, SectionForm } from './SectionForm'

type Step = { kind: 'section'; key: string } | { kind: 'documents' } | { kind: 'review' }

/** Cadastro extenso e dirigido por dados: uma etapa por seção + documentos + revisão/envio. */
export function OnboardingWizard() {
  const t = useT()
  const tl = useL()
  const session = useSession()
  const { data: state, isLoading } = useGet<OnboardingStateDto>('/onboarding', { staleTime: 0 })
  const [step, setStep] = useState<Step | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showMissing, setShowMissing] = useState(false)
  const pending = useRef<{ dirty: boolean; payload: () => SectionData } | null>(null)

  const sections = useMemo(() => (state ? sectionsFor(state.company.type) : []), [state])
  const current: Step = step ?? { kind: 'section', key: sections[0]?.key ?? '' }

  const save = useSend(
    ({ key, payload }: { key: string; payload: SectionData }) => api<OnboardingStateDto>(`/onboarding/sections/${key}`, { method: 'PUT', body: payload }),
    { invalidate: ['/onboarding', '/auth/me'], silent: true },
  )

  if (isLoading || !state) return <PageLoader />
  const locked = !['DRAFT', 'CHANGES_REQUESTED', 'APPROVED'].includes(state.company.onboardingStatus)

  const missingBySection = (key: string): MissingField[] => {
    const def = sections.find((s) => s.key === key)
    return def ? findMissingRequired(def, state.sections[key]) : []
  }
  const sectionDone = (key: string) => {
    const def = sections.find((s) => s.key === key)!
    return missingBySection(key).length === 0 && (!def.required || state.sections[key] !== undefined)
  }
  const missingDocKeys = new Set(state.submission.missing.filter((m) => m.kind === 'document').map((m) => m.key))
  const docsDone = documentTypesFor(state.company.type).filter((d) => d.required).every((d) => !missingDocKeys.has(d.key))
  const sectionTitle = (key: string) => tl(sections.find((s) => s.key === key)?.title)

  /** Salva pendências antes de trocar de etapa; se houver erro de validação, permanece na etapa atual. */
  const go = async (next: Step) => {
    if (current.kind === 'section' && pending.current?.dirty && !locked) {
      try {
        await save.mutateAsync({ key: current.key, payload: pending.current.payload() })
        setErrors({})
      } catch (e) {
        setErrors(parseSaveErrors(e))
        toast.error(t('onboarding.fixErrors'))
        return
      }
      pending.current = null
    }
    setErrors({})
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const doSave = async (key: string, payload: SectionData) => {
    try {
      await save.mutateAsync({ key, payload })
      pending.current = null
      setErrors({})
      toast.success(t('onboarding.saved'))
    } catch (e) {
      setErrors(parseSaveErrors(e))
      toast.error((e as Error).message || t('onboarding.fixErrors'))
    }
  }

  const steps: { step: Step; label: string; done: boolean; icon?: 'docs' | 'review' }[] = [
    ...sections.map((s) => ({ step: { kind: 'section', key: s.key } as Step, label: tl(s.title), done: sectionDone(s.key) })),
    { step: { kind: 'documents' } as Step, label: t('onboarding.step.documents'), done: docsDone, icon: 'docs' as const },
    { step: { kind: 'review' } as Step, label: t('onboarding.step.review'), done: state.submission.ready && state.company.onboardingStatus !== 'DRAFT', icon: 'review' as const },
  ]
  const isActive = (s: Step) => s.kind === current.kind && (s.kind !== 'section' || (current.kind === 'section' && s.key === current.key))
  const activeIdx = steps.findIndex((s) => isActive(s.step))
  const currentSection = current.kind === 'section' ? sections.find((s) => s.key === current.key) : undefined

  return (
    <div>
      <PageHeader
        title={t('onboarding.title')}
        subtitle={t(state.company.type === 'EXPORTER' ? 'onboarding.subtitle.exporter' : 'onboarding.subtitle.importer')}
        actions={<StatusBadge group="onboarding" value={state.company.onboardingStatus} />}
      />
      {state.company.onboardingStatus === 'CHANGES_REQUESTED' && state.company.reviewNote && (
        <Alert tone="warn" title={t('onboarding.changesRequested')} className="mb-5">{state.company.reviewNote}</Alert>
      )}
      {locked && state.company.onboardingStatus !== 'REJECTED' && <Alert tone="info" className="mb-5">{t('onboarding.locked')}</Alert>}
      {state.company.onboardingStatus === 'APPROVED' && <Alert tone="info" className="mb-5">{t('onboarding.editApproved')}</Alert>}

      <div className="mb-6 flex items-center gap-4">
        <ProgressBar value={state.submission.percent} className="flex-1" />
        <span className="text-sm font-semibold text-ink-700">{Math.round(state.submission.percent)}%</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav aria-label="steps" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {steps.map((s, i) => {
              const active = i === activeIdx
              return (
                <li key={i} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => go(s.step)}
                    aria-current={active ? 'step' : undefined}
                    className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors', active ? 'bg-brand-50 font-medium text-brand-800' : 'text-ink-600 hover:bg-ink-100')}
                  >
                    {s.icon === 'docs' ? <FileText className="h-4 w-4 shrink-0 text-ink-400" /> : s.icon === 'review' ? <ListChecks className="h-4 w-4 shrink-0 text-ink-400" /> : s.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-ink-300" />}
                    <span className="whitespace-nowrap lg:whitespace-normal">{s.label}</span>
                    {s.icon && s.done && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="card min-w-0 p-5 sm:p-7">
          {currentSection && (
            <>
              <h2 className="text-lg font-semibold text-ink-900">{tl(currentSection.title)}</h2>
              {currentSection.description && <p className="mt-1 mb-6 text-sm text-ink-500">{tl(currentSection.description)}</p>}
              <SectionForm
                key={currentSection.key}
                section={currentSection}
                data={state.sections[currentSection.key]}
                disabled={locked}
                missing={showMissing || state.company.onboardingStatus === 'CHANGES_REQUESTED' ? missingBySection(currentSection.key) : []}
                saving={save.isPending}
                errors={errors}
                onSave={(payload) => doSave(currentSection.key, payload)}
                onDirty={(dirty, payload) => (pending.current = { dirty, payload })}
              />
              <div className="mt-6 flex justify-between text-sm">
                <button className="btn-ghost" disabled={activeIdx === 0} onClick={() => go(steps[activeIdx - 1]!.step)}>
                  ← {t('common.back')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowMissing(true)
                    go(steps[activeIdx + 1]!.step)
                  }}
                >
                  {t('common.next')} →
                </button>
              </div>
            </>
          )}
          {current.kind === 'documents' && (
            <>
              <h2 className="mb-5 text-lg font-semibold text-ink-900">{t('onboarding.step.documents')}</h2>
              <DocumentsStep companyType={state.company.type} documents={state.documents} locked={locked} missingKeys={showMissing ? missingDocKeys : new Set()} />
              <div className="mt-6 flex justify-between text-sm">
                <button className="btn-ghost" onClick={() => go(steps[activeIdx - 1]!.step)}>← {t('common.back')}</button>
                <button className="btn-secondary" onClick={() => { setShowMissing(true); go({ kind: 'review' }) }}>{t('common.next')} →</button>
              </div>
            </>
          )}
          {current.kind === 'review' && (
            <>
              <h2 className="mb-5 text-lg font-semibold text-ink-900">{t('onboarding.step.review')}</h2>
              <ReviewStep
                state={state}
                emailVerified={!!session.data?.emailVerified}
                sectionTitle={sectionTitle}
                onGoto={(target) => {
                  setShowMissing(true)
                  go(target.documents ? { kind: 'documents' } : { kind: 'section', key: target.section! })
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
