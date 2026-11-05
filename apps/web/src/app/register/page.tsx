import { Suspense } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/layout/AuthShell'
import { getT } from '@/lib/i18n-server'
import { RegisterForm } from './RegisterForm'

export const metadata = { title: 'Cadastro' }

export default function RegisterPage() {
  const { t } = getT()
  return (
    <AuthShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            {t('auth.register.signin')}
          </Link>
        </>
      }
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  )
}
