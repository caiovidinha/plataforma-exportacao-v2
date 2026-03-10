import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export const metadata: Metadata = {
  description: 'Plataforma B2B de exportação de castanha-do-Brasil',
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('landing')
  return (
    <div className="min-h-screen bg-[#110b06] flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <Link href="/" className="flex items-center gap-2 text-slate-100 hover:text-brand-300 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-display font-semibold text-sm tracking-wide">CastanhaExport</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-400">
          <LanguageSwitcher />
          <Link href="/entrar" className="hover:text-slate-200 transition-colors">{t('nav.signIn')}</Link>
          <Link href="/registro" className="btn-primary py-1.5 text-xs">{t('nav.register')}</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-800/40">
        {t('footerCopyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  )
}
