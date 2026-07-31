'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import {
  Globe, Building2,
  ChevronRight, ChevronLeft, CheckCircle, Loader2,
  Eye, EyeOff, X, ShieldCheck, Ship,
} from 'lucide-react'
import { getEntityConfig } from '@/lib/entity-config'
import { cn, formatCNPJ } from '@/lib/utils'
import { isValidCNPJ, formatPhoneBR, isValidPhoneBR, isValidPhoneIntl, isValidUrl, isValidEmail, isValidNCMList } from '@/lib/validators'
import { useTranslations } from 'next-intl'
import type { ElementType } from 'react'

const ICONS: Record<string, ElementType> = {
  Globe, Building2,
}

const STEP_COUNT = 5

const DIAL_CODES = [
  { code: '+55', country: 'Brasil' },
  { code: '+1', country: 'EUA/Canadá' },
  { code: '+44', country: 'Reino Unido' },
  { code: '+49', country: 'Alemanha' },
  { code: '+33', country: 'França' },
  { code: '+31', country: 'Países Baixos' },
  { code: '+34', country: 'Espanha' },
  { code: '+351', country: 'Portugal' },
  { code: '+41', country: 'Suíça' },
  { code: '+39', country: 'Itália' },
  { code: '+81', country: 'Japão' },
  { code: '+86', country: 'China' },
  { code: '+52', country: 'México' },
  { code: '+54', country: 'Argentina' },
  { code: '+56', country: 'Chile' },
  { code: '+57', country: 'Colômbia' },
  { code: '+91', country: 'Índia' },
  { code: '+65', country: 'Singapura' },
  { code: '+971', country: 'Emirados' },
  { code: '+7', country: 'Rússia' },
]

const INPUT_CLS = 'w-full bg-white/60 border border-[#3e2e1e]/20 px-3 py-2 text-sm text-[#3e2e1e] placeholder:text-[#584531]/40 focus:outline-none focus:ring-2 focus:ring-[#584531]/30 focus:border-[#584531] transition'
const LABEL_CLS = 'block text-xs font-medium text-[#584531]/80 mb-1.5'

function getPasswordStrength(pw: string) {
  const reqs = {
    length: pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  }
  const score = Object.values(reqs).filter(Boolean).length
  return { score, reqs }
}

interface FormField {
  label: string
  type?: string
  placeholder?: string
  options?: string[]
  hint?: string
  required?: boolean
}

function FieldInput({ fieldKey, def, value, onChange }: {
  fieldKey: string
  def: FormField
  value: string
  onChange: (v: string) => void
}) {
  const t = useTranslations('registro')
  if (def.type === 'multiselect') {
    const selected = value ? value.split(',').map((v) => v.trim()).filter(Boolean) : []
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
      onChange(next.join(', '))
    }
    return (
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {def.options?.map((o) => {
          const active = selected.includes(o)
          return (
            <button key={o} type="button" onClick={() => toggle(o)}
              className={cn('px-2 py-0.5 text-xs transition-colors border',
                active
                  ? 'bg-[#584531] text-[#ede5dc] border-[#584531]'
                  : 'bg-white/40 text-[#584531] border-[#3e2e1e]/20 hover:border-[#584531]'
              )}>
              {o}
            </button>
          )
        })}
      </div>
    )
  }
  if (def.type === 'select') {
    return (
      <select className={INPUT_CLS} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('selectOption')}</option>
        {def.options?.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (def.type === 'textarea') {
    return (
      <textarea className={cn(INPUT_CLS, 'resize-none h-20')} placeholder={def.placeholder}
                value={value} onChange={(e) => onChange(e.target.value)} />
    )
  }
  return (
    <input className={INPUT_CLS} type={def.type ?? 'text'} placeholder={def.placeholder}
           value={value} onChange={(e) => onChange(e.target.value)} />
  )
}

export default function RegistroTipoPage({ params }: { params: { tipo: string } }) {
  const { tipo } = params
  const cfgOrNull = getEntityConfig(tipo)
  if (!cfgOrNull) notFound()
  const cfg = cfgOrNull  // non-null, safe for closure capture

  const t = useTranslations('registro')
  const STEPS = [t('stepCompany'), t('stepDetails'), t('stepAccess'), t('stepConfirm'), t('stepRiskEstimate')]

  const router = useRouter()
  const Icon = ICONS[cfg.icon] ?? Globe

  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  // Step 0 - Empresa
  const [empresa, setEmpresa] = useState({
    company_name: '',
    cnpj: '',
    phone_prefix: '+55',
    contact_phone: '',
    website: '',
  })

  // Step 1 - Específicos (keyed by field.key)
  const [specifics, setSpecifics] = useState<Record<string, string>>({})

  // Step 2 - Acesso
  const [acesso, setAcesso] = useState({ email: '', password: '', confirm: '' })
  const [acessoError, setAcessoError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Step 4 - Análise de risco + estimativa de rota de frete
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisDone, setAnalysisDone] = useState(false)

  useEffect(() => {
    if (step !== 4) return
    setAnalyzing(true)
    const timer = setTimeout(() => {
      setAnalyzing(false)
      setAnalysisDone(true)
    }, 1800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function updateEmpresa(key: string, val: string) {
    setEmpresa((p) => ({ ...p, [key]: val }))
  }
  function updateSpecific(key: string, val: string) {
    setSpecifics((p) => ({ ...p, [key]: val }))
  }
  function updateAcesso(key: string, val: string) {
    setAcesso((p) => ({ ...p, [key]: val }))
  }

  function canAdvance(): boolean {
    if (step === 0) {
      if (!empresa.company_name || !empresa.cnpj) return false
      // CNPJ com dígito verificador só se aplica a exportador (importador usa VAT/Tax ID livre)
      if (!cfg.cnpjLabel && !isValidCNPJ(empresa.cnpj)) return false
      return true
    }
    if (step === 1) {
      // Required specifics
      return cfg.specificFields.filter((f) => f.required).every((f) => !!specifics[f.key])
    }
    if (step === 2) {
      const { score, reqs } = getPasswordStrength(acesso.password)
      return isValidEmail(acesso.email) && reqs.length && score >= 3 && acesso.password === acesso.confirm
    }
    return true
  }

  function handleNext() {
    if (step === 2) {
      setAcessoError('')
      if (acesso.password !== acesso.confirm) {
        setAcessoError(t('errPasswordsMismatch'))
        return
      }
      if (acesso.password.length < 8) {
        setAcessoError(t('errPasswordTooShort'))
        return
      }
    }
    setStep((s) => s + 1)
  }

  function handleFinish() {
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  // ---- Success state ----------------------------------------
  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-[#584531]/10 border border-[#3e2e1e]/20 p-5 text-center space-y-4 py-10">
          <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-[#3e2e1e]">{t('successTitle')}</h2>
            <p className="text-sm text-[#584531]/80 mt-1">
              {t('successWelcome', { company: empresa.company_name })}
            </p>
          </div>
          <p className="text-xs text-[#584531]/60">{t('successRedirecting')}</p>
        </div>
      </div>
    )
  }

  const pwdStrength = getPasswordStrength(acesso.password)

  // Estimativa mockada da rota de frete, com base nos dados informados
  const routeOrigin = tipo === 'exportador' && specifics['origem_uf']
    ? `Porto mais próximo de ${specifics['origem_uf']}`
    : 'Porto de Santos (SP)'
  const routeDestination = tipo === 'importador' && specifics['target_port']
    ? specifics['target_port']
    : 'Rotterdam'

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Entity badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-[#584531]/10">
          <Icon className="w-5 h-5 text-[#584531]" />
        </div>
        <div>
          <p className="text-xs text-[#584531]/60 uppercase tracking-wider">{t('registeredAs')}</p>
          <p className="text-base font-semibold text-[#3e2e1e]">{cfg.label}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className={cn(
              'w-6 h-6 text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors',
              i < step  ? 'bg-[#584531] text-[#ede5dc]' :
              i === step ? 'bg-[#584531]/20 text-[#584531] ring-2 ring-[#584531]' :
                           'bg-[#584531]/10 text-[#584531]/40',
            )}>
              {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={cn('text-xs truncate', i === step ? 'text-[#3e2e1e]' : 'text-[#584531]/40')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[#584531]/20 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-[#584531]/10 border border-[#3e2e1e]/20 p-5 space-y-4 min-h-[260px]">
        {/* ---- Step 0: Empresa ---- */}
        {step === 0 && (
          <>
            <h2 className="text-sm font-semibold text-[#3e2e1e] mb-2">{t('companyDataTitle')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={LABEL_CLS}>{t('companyNameLabel')} <span className="text-red-600">*</span></label>
                <input className={INPUT_CLS} placeholder="Ex.: Cooperativa Amazônica Ltda."
                       value={empresa.company_name} onChange={(e) => updateEmpresa('company_name', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL_CLS}>{cfg.cnpjLabel ?? t('cnpjLabel')} <span className="text-red-600">*</span></label>
                <input className={INPUT_CLS} placeholder={cfg.cnpjLabel ? 'VAT / Tax ID' : 'XX.XXX.XXX/XXXX-XX'}
                       value={empresa.cnpj}
                       onChange={(e) => updateEmpresa('cnpj', cfg.cnpjLabel ? e.target.value : formatCNPJ(e.target.value))} />
                {!cfg.cnpjLabel && empresa.cnpj && !isValidCNPJ(empresa.cnpj) && (
                  <p className="mt-1 text-xs text-red-600">{t('errInvalidCnpj')}</p>
                )}
              </div>
              <div>
                <label className={LABEL_CLS}>{t('phoneLabel')}</label>
                <div className="flex bg-white/60 border border-[#3e2e1e]/20 focus-within:ring-2 focus-within:ring-[#584531]/30 focus-within:border-[#584531] transition">
                  <select
                    className="w-20 flex-shrink-0 bg-transparent border-0 border-r border-[#3e2e1e]/15 pl-2 pr-1 py-2 text-sm text-[#3e2e1e] focus:outline-none focus:ring-0 truncate"
                    value={empresa.phone_prefix}
                    onChange={(e) => updateEmpresa('phone_prefix', e.target.value)}
                  >
                    {DIAL_CODES.map((d) => (
                      <option key={d.code} value={d.code}>{d.code} · {d.country}</option>
                    ))}
                  </select>
                  <input className="flex-1 min-w-0 bg-transparent border-0 px-3 py-2 text-sm text-[#3e2e1e] placeholder:text-[#584531]/40 focus:outline-none"
                         type="tel" placeholder="(XX) X XXXX-XXXX"
                         value={empresa.contact_phone}
                         onChange={(e) => updateEmpresa('contact_phone',
                           empresa.phone_prefix === '+55' ? formatPhoneBR(e.target.value) : e.target.value)} />
                </div>
                {empresa.contact_phone && (
                  empresa.phone_prefix === '+55'
                    ? !isValidPhoneBR(empresa.contact_phone) && <p className="mt-1 text-xs text-red-600">{t('errInvalidPhone')}</p>
                    : !isValidPhoneIntl(empresa.contact_phone) && <p className="mt-1 text-xs text-red-600">{t('errInvalidPhone')}</p>
                )}
              </div>
              <div>
                <label className={LABEL_CLS}>{t('websiteLabel')}</label>
                <input className={INPUT_CLS} placeholder="https://..."
                       value={empresa.website} onChange={(e) => updateEmpresa('website', e.target.value)} />
                {empresa.website && !isValidUrl(empresa.website) && (
                  <p className="mt-1 text-xs text-red-600">{t('errInvalidUrl')}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ---- Step 1: Detalhes específicos ---- */}
        {step === 1 && (
          <>
            <h2 className="text-sm font-semibold text-[#3e2e1e] mb-2">{t('detailsTitle', { type: cfg.label })}</h2>
            <div className="grid grid-cols-2 gap-4">
              {cfg.specificFields.map((f) => (
                <div key={f.key} className={f.type === 'multiselect' ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
                  <label className={LABEL_CLS}>
                    {f.label}{f.required && <span className="text-red-600 ml-0.5">*</span>}
                  </label>
                  <FieldInput fieldKey={f.key} def={f} value={specifics[f.key] ?? ''}
                              onChange={(v) => updateSpecific(f.key, v)} />
                  {f.key === 'ncm_codes' && specifics[f.key] && !isValidNCMList(specifics[f.key]) && (
                    <p className="mt-1 text-xs text-red-600">{t('errInvalidNcm')}</p>
                  )}
                  {f.hint && <p className="mt-1 text-xs text-[#584531]/60">{f.hint}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- Step 2: Acesso ---- */}
        {step === 2 && (
          <>
            <h2 className="text-sm font-semibold text-[#3e2e1e] mb-2">{t('accessTitle')}</h2>
            <div className="space-y-4 ">
              <div>
                <label className={LABEL_CLS}>{t('corporateEmailLabel')} <span className="text-red-600">*</span></label>
                <input className={INPUT_CLS} type="email"
                       value={acesso.email} onChange={(e) => updateAcesso('email', e.target.value)} />
                {acesso.email && !isValidEmail(acesso.email) && (
                  <p className="mt-1 text-xs text-red-600">{t('errInvalidEmail')}</p>
                )}
              </div>

              {/* Password with strength meter */}
              <div>
                <label className={LABEL_CLS}>{t('passwordCreateLabel')} <span className="text-red-600">*</span></label>
                <div className="relative">
                  <input className={cn(INPUT_CLS, 'pr-10')} type={showPwd ? 'text' : 'password'}
                         placeholder={t('passwordMinHint')}
                         value={acesso.password} onChange={(e) => updateAcesso('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#584531]/50 hover:text-[#584531]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {acesso.password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {/* Strength bar */}
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-[#584531]/20 overflow-hidden">
                        <div
                          className={cn('h-1.5 transition-all duration-300',
                            pwdStrength.score >= 4 ? 'bg-emerald-500'
                            : pwdStrength.score === 3 ? 'bg-amber-400'
                            : 'bg-red-500')}
                          style={{ width: `${pwdStrength.score * 20}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-medium whitespace-nowrap',
                        pwdStrength.score >= 4 ? 'text-emerald-600'
                        : pwdStrength.score === 3 ? 'text-amber-600'
                        : 'text-red-600')}>
                        {pwdStrength.score >= 4 ? t('pwdStrengthStrong')
                          : pwdStrength.score === 3 ? t('pwdStrengthFair')
                          : t('pwdStrengthWeak')}
                      </span>
                    </div>
                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {(['length', 'upper', 'lower', 'number'] as const).map((key) => {
                        const labels = {
                          length: t('pwdReqLength'),
                          upper:  t('pwdReqUpper'),
                          lower:  t('pwdReqLower'),
                          number: t('pwdReqNumber'),
                        }
                        const met = pwdStrength.reqs[key]
                        return (
                          <div key={key} className={cn('flex items-center gap-1 text-[11px]',
                            met ? 'text-emerald-600' : 'text-[#584531]/40')}>
                            {met
                              ? <CheckCircle className="w-3 h-3 flex-shrink-0" />
                              : <X className="w-3 h-3 flex-shrink-0" />}
                            {labels[key]}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password with match indicator */}
              <div>
                <label className={LABEL_CLS}>{t('confirmPasswordLabel')} <span className="text-red-600">*</span></label>
                <div className="relative">
                  <input className={cn(INPUT_CLS, 'pr-10')} type={showConfirm ? 'text' : 'password'}
                         placeholder={t('repeatPasswordPlaceholder')}
                         value={acesso.confirm} onChange={(e) => updateAcesso('confirm', e.target.value)} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#584531]/50 hover:text-[#584531]">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {acesso.confirm.length > 0 && (
                  <p className={cn('mt-1.5 text-xs flex items-center gap-1',
                    acesso.password === acesso.confirm ? 'text-emerald-600' : 'text-red-600')}>
                    {acesso.password === acesso.confirm
                      ? <><CheckCircle className="w-3 h-3" /> {t('pwdMatch')}</>
                      : <><X className="w-3 h-3" /> {t('pwdNoMatch')}</>}
                  </p>
                )}
              </div>

              {acessoError && <p className="text-xs text-red-600">{acessoError}</p>}
            </div>
          </>
        )}

        {/* ---- Step 3: Confirmação ---- */}
        {step === 3 && (
          <>
            <h2 className="text-sm font-semibold text-[#3e2e1e] mb-4">{t('reviewTitle')}</h2>
            <div className="space-y-4 text-xs">
              <Section title={t('sectionCompany')}>
                <Row label={t('razaoSocialLabel')} value={empresa.company_name} />
                <Row label={cfg.cnpjLabel ?? t('cnpjLabel')} value={empresa.cnpj} />
                {empresa.contact_phone && <Row label={t('phoneLabel')} value={`${empresa.phone_prefix} ${empresa.contact_phone}`} />}
                {empresa.website && <Row label={t('websiteLabel')} value={empresa.website} />}
              </Section>
              {Object.keys(specifics).length > 0 && (
                <Section title={t('sectionDetails')}>
                  {cfg.specificFields.filter((f) => specifics[f.key]).map((f) => (
                    <Row key={f.key} label={f.label} value={specifics[f.key]} />
                  ))}
                </Section>
              )}
              <Section title={t('sectionAccess')}>
                <Row label={t('emailReviewLabel')} value={acesso.email} />
                <Row label={t('passwordReviewLabel')} value={t('passwordMasked')} />
              </Section>
            </div>
          </>
        )}

        {/* ---- Step 4: Análise de risco + estimativa de rota de frete ---- */}
        {step === 4 && (
          <>
            <h2 className="text-sm font-semibold text-[#3e2e1e] mb-4">{t('riskEstimateTitle')}</h2>
            {analyzing && (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <Loader2 className="w-8 h-8 text-[#584531] animate-spin" />
                <p className="text-xs text-[#584531]/70">{t('analyzingText')}</p>
              </div>
            )}
            {analysisDone && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-emerald-600/10 border border-emerald-600/25 px-3 py-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">{t('riskLevelLabel')}: {t('riskLevelLow')}</p>
                    <p className="text-[11px] text-[#584531]/70 mt-0.5">{t('riskLevelDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-[#584531]/10 border border-[#3e2e1e]/20 px-3 py-2.5">
                  <Ship className="w-5 h-5 text-[#584531] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#3e2e1e]">{t('routeEstimateLabel')}</p>
                    <p className="text-[11px] text-[#584531]/80 mt-0.5">{routeOrigin} → {routeDestination}</p>
                    <p className="text-[11px] text-[#584531]/70 mt-1">{t('routeDaysLabel')}: ~28 {t('daysUnit')} · {t('routeCostLabel')}: USD 1.850</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        {step > 0 ? (
          <button className="inline-flex items-center gap-1 text-[#584531]/80 hover:text-[#3e2e1e] hover:bg-[#584531]/10 px-3 py-2 transition-colors text-sm" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="w-4 h-4" /> {t('btnBack')}
          </button>
        ) : (
          <a href="/registro" className="inline-flex items-center gap-1 text-[#584531]/80 hover:text-[#3e2e1e] hover:bg-[#584531]/10 px-3 py-2 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> {t('btnChangeType')}
          </a>
        )}

        {step < STEP_COUNT - 1 ? (
          <button className="inline-flex items-center gap-2 bg-[#584531] hover:bg-[#3e2e1e] text-[#ede5dc] font-semibold px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={!canAdvance()} onClick={handleNext}>
            {step === STEP_COUNT - 2
              ? <>{t('btnAnalyze')} <ChevronRight className="w-4 h-4 ml-1" /></>
              : <>{t('btnNext')} <ChevronRight className="w-4 h-4 ml-1" /></>
            }
          </button>
        ) : (
          <button className="inline-flex items-center gap-2 bg-[#584531] hover:bg-[#3e2e1e] text-[#ede5dc] font-semibold px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  disabled={!analysisDone} onClick={handleFinish}>
            <CheckCircle className="w-4 h-4 mr-1" /> {t('btnGoDashboard')}
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[#584531]/60 font-semibold uppercase tracking-wider text-[10px] mb-2">{title}</p>
      <div className="bg-[#584531]/10 border border-[#3e2e1e]/20 divide-y divide-[#3e2e1e]/10">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-2">
      <span className="text-[#584531]/60">{label}</span>
      <span className="text-[#3e2e1e] font-medium text-right">{value || '-'}</span>
    </div>
  )
}
