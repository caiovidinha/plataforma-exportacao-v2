'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Leaf } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function EntrarPage() {
  const t = useTranslations('entrar')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Mock auth - accept any non-empty credentials
    await new Promise((r) => setTimeout(r, 800))
    if (!email || !password) {
      setError(t('errorFillFields'))
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo mark */}
      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-brand-500/15 flex items-center justify-center mx-auto mb-3">
          <Leaf className="w-6 h-6 text-brand-400" />
        </div>
        <h1 className="text-xl font-display font-bold text-slate-100">{t('welcomeBack')}</h1>
        <p className="text-sm text-slate-400">{t('accessAccount')}</p>
      </div>

      <div className="card space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">{t('emailLabel')}</label>
            <input id="email" className="input" type="email" placeholder={t('emailPlaceholder')}
                   value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0" htmlFor="password">{t('passwordLabel')}</label>
              <button type="button" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                {t('forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <input id="password" className="input pr-10" type={show ? 'text' : 'password'}
                     placeholder="••••••••"
                     value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('signInBtn')}
          </button>
        </form>

        <div className="relative flex items-center gap-3 text-xs text-slate-600">
          <div className="flex-1 border-t border-slate-700" />
          <span>{t('orDivider')}</span>
          <div className="flex-1 border-t border-slate-700" />
        </div>

        {/* Gov.br */}
        <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors py-2.5 text-sm font-medium text-slate-300">
          <div className="w-5 h-5 rounded bg-[#1351b4] flex items-center justify-center">
            <span className="text-white text-[9px] font-bold leading-none">gov</span>
          </div>
          {t('signInGov')}
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        {t('noAccount')}{' '}
        <Link href="/registro" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          {t('registerFree')}
        </Link>
      </p>
    </div>
  )
}
