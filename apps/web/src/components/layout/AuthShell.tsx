'use client'
import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/Logo'
import { LocaleSwitch } from '@/components/layout/LocaleSwitch'
import { useT } from '@/lib/i18n'

/** Moldura das telas de autenticação: painel verde de marca + formulário neutro. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const t = useT()
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-brand-700 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_90%_90%,rgba(7,32,26,0.55),transparent_55%)]" />
        <Link href="/" className="relative z-10 w-fit">
          <Logo tone="light" />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">{t('auth.side.title')}</h2>
          <ul className="mt-8 space-y-4 text-sm text-brand-50/90">
            {[t('auth.side.i1'), t('auth.side.i2'), t('auth.side.i3')].map((i) => (
              <li key={i} className="flex gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-brand-100/60">© {new Date().getFullYear()} Amazon Trade</p>
      </aside>
      <main className="flex flex-col bg-white px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <LocaleSwitch />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ink-600">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
