'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Field, Input } from '@/components/ui/form'
import { Alert, Button } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { AuthShell } from '@/components/layout/AuthShell'

const schema = z.object({ email: z.email() })

export default function ForgotPasswordPage() {
  const t = useT()
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  return (
    <AuthShell title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} footer={<Link href="/login" className="font-medium text-brand-700 hover:underline">{t('auth.backToLogin')}</Link>}>
      {sent ? (
        <Alert tone="success">{t('auth.forgot.sent')}</Alert>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={handleSubmit(async (v) => {
            await api('/auth/forgot-password', { method: 'POST', body: v }).catch(() => undefined) // resposta sempre neutra
            setSent(true)
          })}
        >
          <Field label={t('auth.email')} error={formState.errors.email && t('auth.err.email')}>
            <Input type="email" autoComplete="email" autoFocus {...register('email')} />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
            {t('auth.forgot.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
