'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, X, Shield, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const INPUT_CLS = 'w-full bg-white/60 border border-[#3e2e1e]/20 px-3 py-2 text-xs text-[#3e2e1e] placeholder:text-[#584531]/40 focus:outline-none focus:ring-2 focus:ring-[#584531]/30 focus:border-[#584531] transition'
const LABEL_CLS = 'block text-xs font-medium text-[#584531]/80 mb-1.5'

// ── Gov.br Login Modal ────────────────────────────────────────────────────────
type GovStage = 'cpf' | 'otp' | 'loading' | 'success'

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function GovBrModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [stage, setStage] = useState<GovStage>('cpf')
  const [cpf, setCpf] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  async function handleCpf(e: React.FormEvent) {
    e.preventDefault()
    if (cpf.replace(/\D/g, '').length !== 11) { setError('CPF inválido.'); return }
    setError('')
    setStage('otp')
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Código deve ter 6 dígitos.'); return }
    setError('')
    setStage('loading')
    await new Promise((r) => setTimeout(r, 1800))
    setStage('success')
    setTimeout(onSuccess, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#ede5dc] border border-[#3e2e1e]/20 w-full max-w-sm p-6 space-y-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1351b4] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold tracking-tight">gov</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1351b4] leading-tight">gov.br</p>
              <p className="text-[10px] text-[#584531]/70 leading-tight">Login único do governo federal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#584531]/60 hover:text-[#3e2e1e] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-[#3e2e1e]/10" />

        <div className="flex items-start gap-2 bg-[#1351b4]/8 border border-[#1351b4]/20 px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-[#1351b4] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#3e2e1e]/70 leading-relaxed">
            Autenticação segura via <span className="font-semibold text-[#1351b4]">gov.br</span>.
            Seus dados não são compartilhados com a plataforma.
          </p>
        </div>

        {/* CPF stage */}
        {stage === 'cpf' && (
          <form onSubmit={handleCpf} className="space-y-4">
            <div>
              <label className={LABEL_CLS}>CPF</label>
              <input className={INPUT_CLS} placeholder="000.000.000-00"
                     value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit"
                    className="w-full bg-[#1351b4] hover:bg-[#0d3f8f] text-white font-semibold px-4 py-2 text-sm transition-colors">
              Continuar
            </button>
          </form>
        )}

        {/* OTP stage */}
        {stage === 'otp' && (
          <form onSubmit={handleOtp} className="space-y-4">
            <p className="text-xs text-[#584531]/80">
              Código enviado para o aplicativo <span className="font-semibold">Gov.br</span> ou SMS cadastrado no CPF <span className="font-semibold">{cpf}</span>.
            </p>
            <div>
              <label className={LABEL_CLS}>Código de 6 dígitos</label>
              <input className={cn(INPUT_CLS, 'tracking-[0.4em] text-center font-mono text-base')}
                     placeholder="000000" maxLength={6}
                     value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setStage('cpf'); setOtp(''); setError('') }}
                      className="flex-1 border border-[#3e2e1e]/20 text-[#584531] hover:bg-[#584531]/10 px-4 py-2 text-sm transition-colors">
                Voltar
              </button>
              <button type="submit"
                      className="flex-1 bg-[#1351b4] hover:bg-[#0d3f8f] text-white font-semibold px-4 py-2 text-sm transition-colors">
                Autenticar
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {stage === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#1351b4]" />
            <p className="text-sm text-[#584531]/80">Verificando identidade…</p>
          </div>
        )}

        {/* Success */}
        {stage === 'success' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
            <p className="text-sm font-semibold text-[#3e2e1e]">Identidade verificada!</p>
            <p className="text-xs text-[#584531]/70">Redirecionando…</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EntrarPage() {
  const t = useTranslations('entrar')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [govModal, setGovModal] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError(t('errorFillFields')); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    router.push('/dashboard')
  }

  return (
    <>
      {govModal && (
        <GovBrModal
          onClose={() => setGovModal(false)}
          onSuccess={() => { setGovModal(false); router.push('/dashboard') }}
        />
      )}

      <div className="w-full max-w-sm space-y-3 pt-10 ">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-sans font-bold text-[#3e2e1e]">{t('welcomeBack')}</h1>
          <p className="text-sm text-[#584531]/80">{t('accessAccount')}</p>
        </div>

        <div className="p-5 space-y-5 bg-[#584531]/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLS} htmlFor="email">{t('emailLabel')}</label>
              <input id="email" className={INPUT_CLS} type="email" placeholder={t('emailPlaceholder')}
                     value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#584531]/80" htmlFor="password">{t('passwordLabel')}</label>
                <button type="button" className="text-xs text-[#584531] hover:text-[#3e2e1e] transition-colors">
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <input id="password" className={cn(INPUT_CLS, 'pr-10')} type={show ? 'text' : 'password'}
                       placeholder="••••••••"
                       value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#584531]/50 hover:text-[#584531]">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center bg-[#584531] hover:bg-[#3e2e1e] text-[#ede5dc] font-semibold px-4 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('signInBtn')}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-[#584531]/50">
            <div className="flex-1 border-t border-[#3e2e1e]/15" />
            <span>{t('orDivider')}</span>
            <div className="flex-1 border-t border-[#3e2e1e]/15" />
          </div>

          {/* Gov.br */}
          <button
            onClick={() => setGovModal(true)}
            className="w-full flex items-center justify-center gap-2.5 border border-[#3e2e1e]/20 bg-white/40 hover:bg-white/70 transition-colors py-2.5 text-sm font-medium text-[#3e2e1e]">
            <div className="w-5 h-5 bg-[#1351b4] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-bold leading-none">gov</span>
            </div>
            {t('signInGov')}
          </button>
        <p className="text-center text-sm text-[#584531]/80">
          {t('noAccount')}{' '}
          <Link href="/registro" className="text-[#3e2e1e] hover:text-[#110b06] hover:underline font-semibold transition-colors">
            {t('registerFree')}
          </Link>
        </p>
        </div>

      </div>
    </>
  )
}
