'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
  ChevronRight, ChevronLeft, CheckCircle, Loader2,
} from 'lucide-react'
import { getEntityConfig } from '@/lib/entity-config'
import { cn } from '@/lib/utils'
import type { ElementType } from 'react'

const ICONS: Record<string, ElementType> = {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
}

const STEPS = ['Empresa', 'Detalhes', 'Acesso', 'Confirmação']

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
  if (def.type === 'select') {
    return (
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecionar…</option>
        {def.options?.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (def.type === 'textarea') {
    return (
      <textarea className="input resize-none h-20" placeholder={def.placeholder}
                value={value} onChange={(e) => onChange(e.target.value)} />
    )
  }
  return (
    <input className="input" type={def.type ?? 'text'} placeholder={def.placeholder}
           value={value} onChange={(e) => onChange(e.target.value)} />
  )
}

export default function RegistroTipoPage({ params }: { params: { tipo: string } }) {
  const { tipo } = params
  const cfgOrNull = getEntityConfig(tipo)
  if (!cfgOrNull) notFound()
  const cfg = cfgOrNull  // non-null, safe for closure capture

  const router = useRouter()
  const Icon = ICONS[cfg.icon] ?? Globe

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Step 0 — Empresa
  const [empresa, setEmpresa] = useState({
    company_name: '',
    cnpj: '',
    contact_phone: '',
    website: '',
  })

  // Step 1 — Específicos (keyed by field.key)
  const [specifics, setSpecifics] = useState<Record<string, string>>({})

  // Step 2 — Acesso
  const [acesso, setAcesso] = useState({ email: '', password: '', confirm: '' })
  const [acessoError, setAcessoError] = useState('')

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
    if (step === 0) return !!empresa.company_name && !!empresa.cnpj
    if (step === 1) {
      // Required specifics
      return cfg.specificFields.filter((f) => f.required).every((f) => !!specifics[f.key])
    }
    if (step === 2) {
      return !!acesso.email && acesso.password.length >= 8 && acesso.password === acesso.confirm
    }
    return true
  }

  function handleNext() {
    if (step === 2) {
      setAcessoError('')
      if (acesso.password !== acesso.confirm) {
        setAcessoError('As senhas não coincidem.')
        return
      }
      if (acesso.password.length < 8) {
        setAcessoError('A senha deve ter pelo menos 8 caracteres.')
        return
      }
    }
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSubmitting(false)
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  // ---- Success state ----------------------------------------
  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="card text-center space-y-4 py-10">
          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Cadastro realizado!</h2>
            <p className="text-sm text-slate-400 mt-1">
              Bem-vindo à plataforma, <strong className="text-slate-200">{empresa.company_name}</strong>.
            </p>
          </div>
          <p className="text-xs text-slate-500">Redirecionando para o painel…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Entity badge */}
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
          <Icon className={cn('w-5 h-5', cfg.color)} />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Cadastro como</p>
          <p className="text-base font-semibold text-slate-100">{cfg.label}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className={cn(
              'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors',
              i < step ? 'bg-brand-500 text-white' :
              i === step ? 'bg-brand-400/20 text-brand-300 ring-2 ring-brand-400' :
              'bg-slate-800 text-slate-600',
            )}>
              {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={cn('text-xs truncate', i === step ? 'text-slate-300' : 'text-slate-600')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-800 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card space-y-4 min-h-[260px]">
        {/* ---- Step 0: Empresa ---- */}
        {step === 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-100 mb-2">Dados da Empresa</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Razão Social / Nome da Empresa <span className="text-red-400">*</span></label>
                <input className="input" placeholder="Ex.: Cooperativa Amazônica Ltda."
                       value={empresa.company_name} onChange={(e) => updateEmpresa('company_name', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">{cfg.cnpjLabel ?? 'CNPJ'} <span className="text-red-400">*</span></label>
                <input className="input" placeholder={cfg.cnpjLabel ? 'VAT / Tax ID' : 'XX.XXX.XXX/XXXX-XX'}
                       value={empresa.cnpj} onChange={(e) => updateEmpresa('cnpj', e.target.value)} />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" type="tel" placeholder="(XX) X XXXX-XXXX"
                       value={empresa.contact_phone} onChange={(e) => updateEmpresa('contact_phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Website</label>
                <input className="input" placeholder="https://..."
                       value={empresa.website} onChange={(e) => updateEmpresa('website', e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* ---- Step 1: Detalhes específicos ---- */}
        {step === 1 && (
          <>
            <h2 className="text-sm font-semibold text-slate-100 mb-2">Detalhes de {cfg.label}</h2>
            <div className="grid grid-cols-2 gap-4">
              {cfg.specificFields.map((f) => (
                <div key={f.key} className="col-span-2 sm:col-span-1">
                  <label className="label">
                    {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <FieldInput fieldKey={f.key} def={f} value={specifics[f.key] ?? ''}
                              onChange={(v) => updateSpecific(f.key, v)} />
                  {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- Step 2: Acesso ---- */}
        {step === 2 && (
          <>
            <h2 className="text-sm font-semibold text-slate-100 mb-2">Acesso à Plataforma</h2>
            <div className="space-y-4">
              <div>
                <label className="label">E-mail corporativo <span className="text-red-400">*</span></label>
                <input className="input" type="email" placeholder="voce@empresa.com.br"
                       value={acesso.email} onChange={(e) => updateAcesso('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Senha <span className="text-red-400">*</span></label>
                <input className="input" type="password" placeholder="Mínimo 8 caracteres"
                       value={acesso.password} onChange={(e) => updateAcesso('password', e.target.value)} />
              </div>
              <div>
                <label className="label">Confirmar Senha <span className="text-red-400">*</span></label>
                <input className="input" type="password" placeholder="Repita a senha"
                       value={acesso.confirm} onChange={(e) => updateAcesso('confirm', e.target.value)} />
              </div>
              {acessoError && <p className="text-xs text-red-400">{acessoError}</p>}
            </div>
          </>
        )}

        {/* ---- Step 3: Confirmação ---- */}
        {step === 3 && (
          <>
            <h2 className="text-sm font-semibold text-slate-100 mb-4">Revise seus dados</h2>
            <div className="space-y-4 text-xs">
              <Section title="Empresa">
                <Row label="Razão Social" value={empresa.company_name} />
                <Row label={cfg.cnpjLabel ?? 'CNPJ'} value={empresa.cnpj} />
                {empresa.contact_phone && <Row label="Telefone" value={empresa.contact_phone} />}
                {empresa.website && <Row label="Website" value={empresa.website} />}
              </Section>
              {Object.keys(specifics).length > 0 && (
                <Section title="Detalhes">
                  {cfg.specificFields.filter((f) => specifics[f.key]).map((f) => (
                    <Row key={f.key} label={f.label} value={specifics[f.key]} />
                  ))}
                </Section>
              )}
              <Section title="Acesso">
                <Row label="E-mail" value={acesso.email} />
                <Row label="Senha" value="••••••••" />
              </Section>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        {step > 0 ? (
          <button className="btn-ghost flex items-center gap-1" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        ) : (
          <a href="/registro" className="btn-ghost flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300">
            <ChevronLeft className="w-4 h-4" /> Mudar tipo
          </a>
        )}

        {step < STEPS.length - 1 ? (
          <button className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canAdvance()} onClick={handleNext}>
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting} onClick={handleSubmit}>
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Cadastrando…</>
              : <><CheckCircle className="w-4 h-4 mr-1" /> Finalizar Cadastro</>
            }
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-2">{title}</p>
      <div className="rounded-lg bg-slate-800/60 border border-slate-700 divide-y divide-slate-700/60">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium text-right">{value || '—'}</span>
    </div>
  )
}
