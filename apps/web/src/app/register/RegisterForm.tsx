'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, Ship } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { COUNTRIES, registerInputSchema, type SessionUser } from '@amazon-trade/shared'
import { Checkbox, Field, Input, Select } from '@/components/ui/form'
import { Alert, Button } from '@/components/ui/primitives'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useL, useLocale, useT } from '@/lib/i18n'
import { homeFor } from '@/lib/session'
import { z } from 'zod'

const schema = registerInputSchema.extend({ acceptTerms: z.boolean().refine((v) => v, 'terms_required') })
type Values = z.input<typeof schema>

export function RegisterForm() {
  const t = useT()
  const tl = useL()
  const locale = useLocale()
  const router = useRouter()
  const qc = useQueryClient()
  const preset = useSearchParams().get('type')
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, control, watch, formState } = useForm<Values>({
    resolver: zodResolver(schema) as never,
    defaultValues: { companyType: preset === 'IMPORTER' ? 'IMPORTER' : 'EXPORTER', country: preset === 'IMPORTER' ? 'DE' : 'BR', locale, acceptTerms: false },
  })
  const type = watch('companyType')
  const e = formState.errors

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    try {
      await api('/auth/register', { method: 'POST', body: { ...v, locale } })
      const me = await api<SessionUser>('/auth/me')
      qc.setQueryData(['/auth/me'], me)
      router.replace(`${homeFor(me)}/onboarding`)
    } catch (err) {
      setError(err instanceof ApiError ? (err.code === 'email_in_use' ? t('auth.register.emailInUse') : err.message) : t('common.error'))
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <Controller
        control={control}
        name="companyType"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('auth.register.type')}>
            {([
              ['EXPORTER', Building2, t('auth.register.exporter'), t('auth.register.exporter.hint')],
              ['IMPORTER', Ship, t('auth.register.importer'), t('auth.register.importer.hint')],
            ] as const).map(([v, Icon, label, hint]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={field.value === v}
                onClick={() => field.onChange(v)}
                className={cn('rounded-xl border p-4 text-left transition-colors', field.value === v ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-ink-300 hover:border-ink-400')}
              >
                <Icon className={cn('h-5 w-5', field.value === v ? 'text-brand-700' : 'text-ink-400')} />
                <p className="mt-2 text-sm font-semibold text-ink-900">{label}</p>
                <p className="mt-0.5 text-xs text-ink-500">{hint}</p>
              </button>
            ))}
          </div>
        )}
      />
      <Field label={t('auth.register.company')} required error={e.companyName && t('auth.err.required')}>
        <Input autoComplete="organization" invalid={!!e.companyName} {...register('companyName')} />
      </Field>
      <Field label={t('auth.register.country')} required className={type === 'EXPORTER' ? 'hidden' : undefined}>
        <Select options={COUNTRIES.filter((c) => c.code !== 'BR').map((c) => ({ value: c.code, label: tl(c.name) }))} {...register('country')} />
      </Field>
      {type === 'EXPORTER' && <input type="hidden" value="BR" {...register('country')} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('auth.register.name')} required error={e.fullName && t('auth.err.required')}>
          <Input autoComplete="name" invalid={!!e.fullName} {...register('fullName')} />
        </Field>
        <Field label={t('auth.register.phone')}>
          <Input type="tel" autoComplete="tel" {...register('phone')} />
        </Field>
      </div>
      <Field label={t('auth.email')} required error={e.email && t('auth.err.email')}>
        <Input type="email" autoComplete="email" invalid={!!e.email} {...register('email')} />
      </Field>
      <Field label={t('auth.password')} required help={t('auth.register.passwordHelp')} error={e.password && t('auth.err.password')}>
        <Input type="password" autoComplete="new-password" invalid={!!e.password} {...register('password')} />
      </Field>
      <Controller
        control={control}
        name="acceptTerms"
        render={({ field }) => (
          <div>
            <Checkbox checked={!!field.value} onChange={field.onChange} label={t('auth.register.terms')} />
            {e.acceptTerms && <p className="error-text">{t('auth.err.terms')}</p>}
          </div>
        )}
      />
      <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
        {t('auth.register.submit')}
      </Button>
    </form>
  )
}
