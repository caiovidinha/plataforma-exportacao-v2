import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export const metadata: Metadata = {
  description: 'Plataforma B2B de exportação de castanha-do-Brasil',
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('landing')
  return (
    <div className="min-h-screen bg-[#ede5dc] flex flex-col">
      {/* Header — identical to landing page navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-24 py-4 border-b border-[#3e2e1e]/40 bg-[#584531]/50 backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <Image src="/img/logo.webp" alt="Brazil X Hub" width={140} height={40} className="h-9 w-auto brightness-90" priority />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/entrar" className="inline-flex items-center gap-2 text-[#ede5dc]/80 hover:text-[#ede5dc] px-3 py-2 rounded-lg transition-colors text-sm">{t('nav.signIn')}</Link>
          <Link href="/registro" className="inline-flex items-center gap-2 bg-[#ede5dc] hover:bg-[#dbcbba] text-[#584531] shadow-sm px-2.5 py-1 rounded-full text-xs font-semibold transition-colors">{t('nav.register')}</Link>
        </div>
      </header>

      {/* Content — pt-[73px] offsets the fixed header */}
      <main className="flex-1 flex items-center justify-center px-4 pt-[73px] pb-10">
        {children}
      </main>

      <footer className="bg-[#dbcbba] px-6 py-8 text-center text-xs text-[#584531]">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
        <p className="mt-1">{t('footerIntegrations')}</p>
      </footer>
    </div>
  )
}
