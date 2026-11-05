'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { SessionUser } from '@amazon-trade/shared'
import { Field, Input } from '@/components/ui/form'
import { Alert, Button } from '@/components/ui/primitives'
import { api, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { homeFor } from '@/lib/session'

const schema = z.object({ email: z.email(), password: z.string().min(1) })
type Values = z.infer<typeof schema>

export function LoginForm() {
  const t = useT()
  const router = useRouter()
  const qc = useQueryClient()
  const next = useSearchParams().get('next')
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    try {
      await api('/auth/login', { method: 'POST', body: v })
      const me = await api<SessionUser>('/auth/me')
      qc.setQueryData(['/auth/me'], me)
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : homeFor(me))
    } catch (e) {
      setError(e instanceof ApiError ? (e.status === 423 ? t('auth.login.locked') : e.status === 401 ? t('auth.login.invalid') : e.message) : t('common.error'))
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <Field label={t('auth.email')} error={formState.errors.email && t('auth.err.email')}>
        <Input type="email" autoComplete="email" autoFocus invalid={!!formState.errors.email} {...register('email')} />
      </Field>
      <Field label={t('auth.password')} error={formState.errors.password && t('auth.err.required')}>
        <Input type="password" autoComplete="current-password" invalid={!!formState.errors.password} {...register('password')} />
      </Field>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm text-brand-700 hover:underline">
          {t('auth.login.forgot')}
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
        {t('auth.login.submit')}
      </Button>
    </form>
  )
}
