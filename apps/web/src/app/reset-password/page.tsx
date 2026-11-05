'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { passwordSchema } from '@amazon-trade/shared'
import { AuthShell } from '@/components/layout/AuthShell'
import { Field, Input } from '@/components/ui/form'
import { Alert, Button } from '@/components/ui/primitives'
import { api, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'

const schema = z.object({ password: passwordSchema })

function Form() {
  const t = useT()
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  if (!token) return <Alert tone="error">{t('auth.reset.invalid')}</Alert>
  if (done) {
    setTimeout(() => router.replace('/login'), 1800)
    return <Alert tone="success">{t('auth.reset.done')}</Alert>
  }
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit(async (v) => {
        setError(null)
        try {
          await api('/auth/reset-password', { method: 'POST', body: { token, password: v.password } })
          setDone(true)
        } catch (e) {
          setError(e instanceof ApiError ? t('auth.reset.invalid') : t('common.error'))
        }
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <Field label={t('auth.reset.newPassword')} help={t('auth.register.passwordHelp')} error={formState.errors.password && t('auth.err.password')}>
        <Input type="password" autoComplete="new-password" autoFocus {...register('password')} />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
        {t('auth.reset.submit')}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  const t = useT()
  return (
    <AuthShell title={t('auth.reset.title')} footer={<Link href="/login" className="font-medium text-brand-700 hover:underline">{t('auth.backToLogin')}</Link>}>
      <Suspense>
        <Form />
      </Suspense>
    </AuthShell>
  )
}
