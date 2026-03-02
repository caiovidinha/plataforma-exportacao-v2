'use client'

import { useState } from 'react'
import { X, Shield, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

type Stage = 'idle' | 'cpf' | 'otp' | 'signing' | 'success' | 'error'

interface Props {
  documentLabel: string
  onClose: () => void
  onSuccess: (signatureId: string) => void
}

export function GovBrSignatureModal({ documentLabel, onClose, onSuccess }: Props) {
  const [stage, setStage] = useState<Stage>('cpf')
  const [cpf, setCpf] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  async function handleCpf(e: React.FormEvent) {
    e.preventDefault()
    if (cpf.replace(/\D/g, '').length !== 11) { setError('CPF inválido'); return }
    setError('')
    setStage('otp')
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Código deve ter 6 dígitos'); return }
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
            <span className="text-sm font-semibold text-slate-100">Assinatura Gov.br</span>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
        </div>

        <p className="text-xs text-slate-400 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
          <Shield className="w-3 h-3 inline mr-1 text-[#1351b4]" />
          Documento: <span className="text-slate-200 font-medium">{documentLabel}</span>
        </p>

        {/* CPF stage */}
        {stage === 'cpf' && (
          <form onSubmit={handleCpf} className="space-y-4">
            <div>
              <label className="label">CPF</label>
              <input className="input" placeholder="000.000.000-00" value={cpf}
                     onChange={(e) => setCpf(e.target.value)} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center">
              Continuar com Gov.br
            </button>
          </form>
        )}

        {/* OTP stage */}
        {stage === 'otp' && (
          <form onSubmit={handleOtp} className="space-y-4">
            <p className="text-xs text-slate-400">
              Enviamos um código de 6 dígitos para o seu celular cadastrado no Gov.br.
            </p>
            <div>
              <label className="label">Código de verificação</label>
              <input className="input text-center tracking-widest text-lg font-mono"
                     maxLength={6} placeholder="––––––"
                     value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center">
              Verificar e Assinar
            </button>
          </form>
        )}

        {/* Signing */}
        {stage === 'signing' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 text-[#1351b4] animate-spin" />
            <p className="text-sm text-slate-300 font-medium">Processando assinatura…</p>
            <p className="text-xs text-slate-500">Aguarde enquanto comunicamos com o Gov.br</p>
          </div>
        )}

        {/* Success */}
        {stage === 'success' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            <p className="text-sm text-slate-100 font-semibold">Documento assinado com sucesso</p>
            <p className="text-xs text-slate-400 text-center">
              A assinatura digital foi aplicada e o documento foi enviado à contraparte.
            </p>
            <button className="btn-primary w-full justify-center mt-2" onClick={onClose}>Fechar</button>
          </div>
        )}

        {/* Error */}
        {stage === 'error' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-slate-100 font-semibold">Falha na autenticação</p>
            <p className="text-xs text-slate-400 text-center">
              Código inválido ou expirado. Por favor, tente novamente.
            </p>
            <button className="btn-secondary w-full justify-center mt-2" onClick={() => setStage('otp')}>
              Tentar novamente
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-600 text-center border-t border-slate-700 pt-3">
          Autenticação via Gov.br — Portal de Serviços Digitais do Governo Federal
        </p>
      </div>
    </div>
  )
}
