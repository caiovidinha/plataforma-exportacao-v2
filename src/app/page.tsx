import Link from 'next/link'
import Image from 'next/image'
import {
  Globe, GitBranch, FileText, Package,
  TrendingUp, Shield, ChevronRight, Star, ArrowRight,
  Truck, Ship, Microscope, Building2, DollarSign, Warehouse,
} from 'lucide-react'
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
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-24 py-4 border-b border-[#3e2e1e]/40 bg-[#584531]/50 backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <Image src="/img/logo.webp" alt="brazilXHUB" width={140} height={40} className="h-9 w-auto brightness-90" priority />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/entrar" className="inline-flex items-center gap-2 text-[#ede5dc]/80 hover:text-[#ede5dc] px-3 py-2 rounded-lg transition-colors text-sm">{t('nav.signIn')}</Link>
          <Link href="/registro" className="inline-flex items-center gap-2 bg-[#ede5dc] hover:bg-[#dbcbba] text-[#584531] font-semibold px-4 py-2 rounded-lg transition-colors text-sm">{t('nav.register')}</Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative w-full">

        {/* Fundo */}
        <Image
          src="/img/hero-background.webp"
          alt="Castanha-do-Brasil"
          width={2560}
          height={1237}
          className="w-screen h-auto block"
          priority
        />

        {/* Elementos - esquerda, rodapé */}
        <div className="absolute bottom-0 left-0 px-24 pb-16 flex flex-col items-start gap-9 max-w-2xl">

          {/* Subtítulo */}
          <p className="font-montserrat text-lg text-white leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Headline */}
          <h1 className="font-montserrat text-4xl md:text-5xl font-medium text-white mb-1 -mt-1">
            {t('hero.headline')}
          </h1>

          {/* Botões */}
          <div className="flex flex-wrap gap-3">
            <Link href="/registro"
              className="inline-flex items-center gap-2 font-montserrat text-sm px-6 py-2 rounded-full bg-[#462a1f] hover:bg-[#5a3529] text-white transition-colors">
              {t('hero.ctaPrimary')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/entrar"
              className="inline-flex items-center gap-2 font-montserrat text-sm px-6 py-2 rounded-full bg-[#574531] hover:bg-[#6b5540] text-white/80 transition-colors">
              {t('hero.ctaSecondary')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Ícones */}
          <Image
            src="/img/hero-icons.webp"
            alt=""
            width={400}
            height={100}
            className="h-12 w-auto pt-1 mt-4 -mb-4"
          />

        </div>

      </section>

      {/* ── STATS STRIP ── */}
      <section className="hidden border-y border-[#4a2e18]/60 bg-[#1c1208]/40">
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
      <section id="funcionalidades" className="bg-[#ede5dc] w-full py-24">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-[#584531]">{t('featuresSectionTitle')}</h2>
            <p className="text-[#584531] max-w-md mx-auto text-sm">{t('featuresSectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#dbcbba] rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#ede5dc] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#584531]" />
                </div>
                <h3 className="font-semibold text-[#584531]">{title}</h3>
                <p className="text-sm text-[#584531] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="relative w-full overflow-hidden">
        <Image
          src="/img/banner-sec.webp"
          alt=""
          width={2560}
          height={1200}
          className="w-full h-auto block opacity-60"
        />
        <div className="absolute inset-0"/>
        <div className="absolute inset-0 flex items-center">
          <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-24 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-[#ede5dc]">{t('howWorksSectionTitle')}</h2>
            <p className="text-[#ede5dc] text-sm max-w-lg mx-auto">{t('howWorksSectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-[#dbcbba] rounded-xl p-5 flex gap-4">
                <span className="text-3xl font-display font-bold text-[#584531]/30 leading-none flex-shrink-0 select-none">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-[#584531] text-sm">{s.title}</p>
                  <p className="text-xs text-[#584531] mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── WHO USES IT ── */}
      <section id="quem-usa" className="bg-[#dbcbba] w-full py-24">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-[#584531]">{t('whoUsesSectionTitle')}</h2>
            <p className="text-[#584531] text-sm">{t('whoUsesSectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ENTITIES.map(({ icon: Icon, label, color, bg, slug }) => (
              <Link key={slug} href={`/registro/${slug}`}
                className="bg-[#ede5dc] rounded-xl p-5 flex flex-col items-center gap-2 text-center hover:brightness-105 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[#dbcbba] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#584531]" />
                </div>
                <p className="text-xs font-medium text-[#584531] leading-tight">
                  {label}
                </p>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/registro" className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-2.5 rounded-lg bg-[#584531] text-[#ede5dc] hover:bg-[#6b5540] transition-colors">
              {t('whoUsesCta')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#ede5dc] w-full py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl bg-[#584531] p-10 text-center space-y-5">
            <Image src="/img/logo-branca-icon.webp" alt="" width={40} height={40} className="mx-auto" />
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[#ede5dc]">
              {t('ctaTitle')}
            </h2>
            <p className="text-[#ede5dc]/80 text-sm max-w-sm mx-auto">
              {t('ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/registro" className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3 rounded-xl bg-[#dbcbba] text-[#584531] hover:bg-[#ede5dc] transition-colors">
                {t('ctaCreateAccount')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/entrar" className="inline-flex items-center gap-2 text-[#ede5dc] hover:text-white px-3 py-2 rounded-lg transition-colors text-sm">
                {t('ctaAlreadyHaveAccount')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#dbcbba] px-6 py-8 text-center text-xs text-[#584531]">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
        <p className="mt-1">{t('footerIntegrations')}</p>
      </footer>
    </div>
  )
}

