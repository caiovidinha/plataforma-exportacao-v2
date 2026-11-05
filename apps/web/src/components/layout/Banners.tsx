'use client'
import { ArrowRight, MailWarning } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { SessionUser } from '@amazon-trade/shared'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { useSend } from '@/lib/query'
import { Alert, Button } from '@/components/ui/primitives'

/** Avisos globais: e-mail não verificado e cadastro pendente/recusado. */
export function AccountBanners({ user, onboardingHref }: { user: SessionUser; onboardingHref: string }) {
  const t = useT()
  const resend = useSend(() => api('/auth/resend-verification', { method: 'POST' }), { onSuccess: () => toast.success(t('banner.verify.sent')) })
  const status = user.company?.onboardingStatus
  return (
    <div className="space-y-3 empty:hidden">
      {!user.emailVerified && (
        <Alert tone="warn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <MailWarning className="h-4 w-4" /> {t('banner.verify.text')}
            </span>
            <Button size="sm" variant="secondary" loading={resend.isPending} onClick={() => resend.mutate()}>
              {t('banner.verify.resend')}
            </Button>
          </div>
        </Alert>
      )}
      {status && status !== 'APPROVED' && (
        <Alert tone={status === 'REJECTED' ? 'error' : status === 'CHANGES_REQUESTED' ? 'warn' : 'info'}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t(`banner.onboarding.${status}` as never)}</span>
            <Link href={onboardingHref} className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline">
              {t('banner.onboarding.cta')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Alert>
      )}
    </div>
  )
}
