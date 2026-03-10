import Link from 'next/link'
import Image from 'next/image'
import {
  Leaf, Globe, GitBranch, FileText, Package,
  TrendingUp, Shield, ChevronRight, Star, ArrowRight,
  Truck, Ship, Microscope, Building2, DollarSign, Warehouse,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default async function LandingPage() {
  const t = await getTranslations('landing')

  const FEATURES = [
    { icon: Globe,      title: t('matchmakingTitle'),  desc: t('matchmakingDesc') },
    { icon: FileText,   title: t('techSheetTitle'),    desc: t('techSheetDesc') },
    { icon: GitBranch,  title: t('wfTitle'),           desc: t('wfDesc') },
    { icon: Package,    title: t('marketplaceTitle'),  desc: t('marketplaceDesc') },
    { icon: Shield,     title: t('securityTitle'),     desc: t('securityDesc') },
    { icon: TrendingUp, title: t('marketIntelTitle'),  desc: t('marketIntelDesc') },
  ]

  const ENTITIES = [
    { icon: Globe,      label: t('entityExporters'),    color: 'text-brand-400',   bg: 'bg-brand-400/10',   slug: 'exportador' },
    { icon: Building2,  label: t('entityImporters'),    color: 'text-blue-400',    bg: 'bg-blue-400/10',    slug: 'importador' },
    { icon: Truck,      label: t('entityCarriers'),     color: 'text-orange-400',  bg: 'bg-orange-400/10',  slug: 'transportadora' },
    { icon: Ship,       label: t('entityShippingLines'),color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    slug: 'companhia-navegacao' },
    { icon: FileText,   label: t('entityBrokers'),      color: 'text-green-400',   bg: 'bg-green-400/10',   slug: 'despachante' },
    { icon: DollarSign, label: t('entityExchangeHouses'),color:'text-emerald-400', bg: 'bg-emerald-400/10', slug: 'corretora' },
    { icon: Warehouse,  label: t('entityTerminals'),    color: 'text-amber-400',   bg: 'bg-amber-400/10',   slug: 'terminal' },
    { icon: Shield,     label: t('entityInsurers'),     color: 'text-violet-400',  bg: 'bg-violet-400/10',  slug: 'seguradora' },
    { icon: Star,       label: t('entityCertifiers'),   color: 'text-rose-400',    bg: 'bg-rose-400/10',    slug: 'certificadora' },
    { icon: Microscope, label: t('entityLabs'),         color: 'text-red-400',     bg: 'bg-red-400/10',     slug: 'laboratorio' },
  ]

  const STEPS = [
    { n: '01', title: t('step01Title'), desc: t('step01Desc') },
    { n: '02', title: t('step02Title'), desc: t('step02Desc') },
    { n: '03', title: t('step03Title'), desc: t('step03Desc') },
    { n: '04', title: t('step04Title'), desc: t('step04Desc') },
    { n: '05', title: t('step05Title'), desc: t('step05Desc') },
    { n: '06', title: t('step06Title'), desc: t('step06Desc') },
  ]

  return (
    <div className="min-h-screen bg-[#110b06] text-slate-100">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[#4a2e18]/40 bg-[#110b06]/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-display font-semibold tracking-wide">CastanhaExport</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#funcionalidades" className="hidden sm:block hover:text-slate-200 transition-colors">{t('nav.features')}</a>
          <a href="#como-funciona" className="hidden sm:block hover:text-slate-200 transition-colors">{t('nav.howItWorks')}</a>
          <a href="#quem-usa" className="hidden sm:block hover:text-slate-200 transition-colors">{t('nav.whoUses')}</a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/entrar" className="btn-ghost text-sm">{t('nav.signIn')}</Link>
          <Link href="/registro" className="btn-primary text-sm">{t('nav.register')}</Link>
        </div>
      </header>

      {/* ── BANNER ── */}
      <div className="w-full">
        <Image
          src="/img/banner.jpeg"
          alt="CastanhaExport Banner"
          width={1920}
          height={600}
          className="w-full object-cover"
          priority
        />
      </div>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-[#4a2e18]/60 bg-[#1c1208]/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#4a2e18]/60">
          {[
            { v: '120+', l: t('statsExporters') },
            { v: '300+', l: t('statsImporters') },
            { v: '42',   l: t('statsCountries') },
            { v: '98%',  l: t('statsMapa') },
          ].map((s) => (
            <div key={s.l} className="py-8 text-center">
              <p className="text-3xl font-display font-bold text-brand-300">{s.v}</p>
              <p className="text-xs text-slate-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="max-w-5xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-white">{t('featuresSectionTitle')}</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">{t('featuresSectionSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card space-y-3 hover:border-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="bg-[#1c1208]/40 border-y border-[#4a2e18]/60">
        <div className="max-w-5xl mx-auto px-6 py-24 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-white">{t('howWorksSectionTitle')}</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">{t('howWorksSectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card flex gap-4">
                <span className="text-3xl font-display font-bold text-brand-400/30 leading-none flex-shrink-0 select-none">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO USES IT ── */}
      <section id="quem-usa" className="max-w-5xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-white">{t('whoUsesSectionTitle')}</h2>
          <p className="text-slate-400 text-sm">{t('whoUsesSectionSubtitle')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ENTITIES.map(({ icon: Icon, label, color, bg, slug }) => (
            <Link key={slug} href={`/registro/${slug}`}
              className={cn(
                'card flex flex-col items-center gap-2 py-5 text-center hover:border-[#7a4e30]/60 hover:bg-[#3e2818]/70 transition-all group cursor-pointer',
              )}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors leading-tight">
                {label}
              </p>
            </Link>
          ))}
        </div>
        <div className="text-center">
          <Link href="/registro" className="btn-primary text-sm px-8">
            {t('whoUsesCta')} <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-2xl bg-gradient-to-br from-brand-900/40 via-[#1c1208] to-[#1c1208] border border-brand-400/20 p-10 text-center space-y-5">
          <Leaf className="w-10 h-10 text-brand-400 mx-auto" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            {t('ctaTitle')}
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            {t('ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/registro" className="btn-primary text-sm px-8 py-3 rounded-xl">
              {t('ctaCreateAccount')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/entrar" className="btn-ghost text-sm">
              {t('ctaAlreadyHaveAccount')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#4a2e18]/60 px-6 py-8 text-center text-xs text-slate-600">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
        <p className="mt-1">{t('footerIntegrations')}</p>
      </footer>
    </div>
  )
}

