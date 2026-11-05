'use client'
import { CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Spinner } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'

function Verify() {
  const t = useT()
  const token = useSearchParams().get('token')
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error')
  const started = useRef(false)
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState('ok'))
      .catch(() => setState('error'))
  }, [token])

  if (state === 'loading') return <Spinner className="mx-auto h-8 w-8" />
  const ok = state === 'ok'
  return (
    <div className="text-center">
      {ok ? <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" /> : <XCircle className="mx-auto h-12 w-12 text-red-500" />}
      <p className="mt-4 text-sm text-ink-700">{ok ? t('auth.verify.ok') : t('auth.verify.error')}</p>
      <Link href="/login" className="btn-primary mt-6">
        {t('auth.verify.continue')}
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  const t = useT()
  return (
    <AuthShell title={t('auth.verify.title')}>
      <Suspense>
        <Verify />
      </Suspense>
    </AuthShell>
  )
}
