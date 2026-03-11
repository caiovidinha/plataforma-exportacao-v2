'use client'

import { useState } from 'react'
import { X, Shield, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Stage = 'idle' | 'cpf' | 'otp' | 'signing' | 'success' | 'error'

interface Props {
  documentLabel: string
  onClose: () => void
  onSuccess: (signatureId: string) => void
}

export function GovBrSignatureModal({ documentLabel, onClose, onSuccess }: Props) {
  const t = useTranslations('govbr')
  const [stage, setStage] = useState<Stage>('cpf')
  const [cpf, setCpf] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  async function handleCpf(e: React.FormEvent) {
    e.preventDefault()
    if (cpf.replace(/\D/g, '').length !== 11) { setError(t('errCpfInvalid')); return }
    setError('')
    setStage('otp')
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) { setError(t('errOtpLength')); return }
    setError('')
    setStage('signing')
    // Simulate Gov.br API call
    await new Promise((r) => setTimeout(r, 2000))
    const ok = otp !== '000000'
    if (ok) {
      setStage('success')
      onSuccess(`govbr_sig_${Date.now()}`)
    } else {
      setStage('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Gov.br mock logo */}
            <div className="w-8 h-8 rounded bg-[#1351b4] flex items-center justify-center">
              <span className="text-white text-xs font-bold leading-none">gov</span>
            </div>
            <span className="text-sm font-semibold text-slate-100">{t('modalTitle')}</span>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
        </div>

        <p className="text-xs text-slate-400 bg-slate-800 px-3 py-2 border border-slate-700">
          <Shield className="w-3 h-3 inline mr-1 text-[#1351b4]" />
          {t('documentLabel')} <span className="text-slate-200 font-medium">{documentLabel}</span>
        </p>

        {/* CPF stage */}
        {stage === 'cpf' && (
          <form onSubmit={handleCpf} className="space-y-4">
            <div>
              <label className="label">{t('cpfLabel')}</label>
              <input className="input" placeholder={t('cpfPlaceholder')} value={cpf}
                     onChange={(e) => setCpf(e.target.value)} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center">
              {t('btnContinue')}
            </button>
          </form>
        )}

        {/* OTP stage */}
        {stage === 'otp' && (
          <form onSubmit={handleOtp} className="space-y-4">
            <p className="text-xs text-slate-400">
              {t('otpDescription')}
            </p>
            <div>
              <label className="label">{t('otpLabel')}</label>
              <input className="input text-center tracking-widest text-lg font-mono"
                     maxLength={6} placeholder="––––––"
                     value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center">
              {t('btnVerify')}
            </button>
          </form>
        )}

        {/* Signing */}
        {stage === 'signing' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 text-[#1351b4] animate-spin" />
            <p className="text-sm text-slate-300 font-medium">{t('signingMessage')}</p>
            <p className="text-xs text-slate-500">{t('signingSubtext')}</p>
          </div>
        )}

        {/* Success */}
        {stage === 'success' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            <p className="text-sm text-slate-100 font-semibold">{t('successTitle')}</p>
            <p className="text-xs text-slate-400 text-center">
              {t('successDescription')}
            </p>
            <button className="btn-primary w-full justify-center mt-2" onClick={onClose}>{t('btnClose')}</button>
          </div>
        )}

        {/* Error */}
        {stage === 'error' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-slate-100 font-semibold">{t('errorTitle')}</p>
            <p className="text-xs text-slate-400 text-center">
              {t('errorDescription')}
            </p>
            <button className="btn-secondary w-full justify-center mt-2" onClick={() => setStage('otp')}>
              {t('btnRetry')}
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-600 text-center border-t border-slate-700 pt-3">
          {t('footer')}
        </p>
      </div>
    </div>
  )
}
