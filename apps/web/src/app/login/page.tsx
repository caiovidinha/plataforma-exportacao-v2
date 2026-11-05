import { Suspense } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/layout/AuthShell'
import { getT } from '@/lib/i18n-server'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Login' }

export default function LoginPage() {
  const { t } = getT()
  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            {t('auth.login.create')}
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
