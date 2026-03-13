import Link from 'next/link'
import Image from 'next/image'
import {
  Globe, GitBranch, FileText, Package,
  TrendingUp, Shield, ChevronRight, ArrowRight,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ExportFlowAnimation } from '@/components/landing/ExportFlowAnimation'

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
    { label: t('entityExporters'),      desc: t('entityExportersDesc'),      slug: 'exportador' },
    { label: t('entityImporters'),      desc: t('entityImportersDesc'),      slug: 'importador' },
    { label: t('entityCarriers'),       desc: t('entityCarriersDesc'),       slug: 'transportadora' },
    { label: t('entityShippingLines'),  desc: t('entityShippingLinesDesc'),  slug: 'companhia-navegacao' },
    { label: t('entityBrokers'),        desc: t('entityBrokersDesc'),        slug: 'despachante' },
    { label: t('entityExchangeHouses'), desc: t('entityExchangeHousesDesc'), slug: 'corretora' },
    { label: t('entityTerminals'),      desc: t('entityTerminalsDesc'),      slug: 'terminal' },
    { label: t('entityInsurers'),       desc: t('entityInsurersDesc'),       slug: 'seguradora' },
    { label: t('entityCertifiers'),     desc: t('entityCertifiersDesc'),     slug: 'certificadora' },
    { label: t('entityLabs'),           desc: t('entityLabsDesc'),           slug: 'laboratorio' },
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
          <Image src="/img/logo.webp" alt="Brazil X Hub" width={140} height={40} className="h-9 w-auto brightness-90" priority />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/entrar" className="inline-flex items-center gap-2 text-[#ede5dc]/80 hover:text-[#ede5dc] px-3 py-2 rounded-lg transition-colors text-sm">{t('nav.signIn')}</Link>
          <Link href="/registro" className="inline-flex items-center gap-2 bg-[#ede5dc] hover:bg-[#dbcbba] text-[#584531] shadow-sm px-2.5 py-1 rounded-full text-xs font-semibold transition-colors">{t('nav.register')}</Link>
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
        <div className="absolute bottom-0 left-0 px-12 2xl:px-24 pb-6 2xl:pb-16 flex flex-col items-start gap-4 xl:gap-6 2xl:gap-9 max-w-xl 2xl:max-w-2xl">

          {/* Subtítulo */}
          <p className="font-montserrat text-sm xl:text-base 2xl:text-lg text-white leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Headline */}
          <h1 className="font-montserrat text-3xl xl:text-4xl 2xl:text-5xl font-medium text-white mb-1 -mt-1">
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
            alt="partners-icons"
            width={500}
            height={0}
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
            <h2 className="font-display text-[2.4rem] font-bold text-[#584531]">{t('featuresSectionTitle')}</h2>
            <p className="text-[#584531] max-w-md mx-auto text-sm">{t('featuresSectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#dbcbba] p-5 space-y-3">
                <div className="w-10 h-10 bg-[#ede5dc] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#584531]" />
                </div>
                <h3 className="font-semibold text-[#584531]">{title}</h3>
                <p className="text-sm text-[#584531] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPORT FLOW ANIMATION ── */}
      <section id="fluxo" className="bg-[#ede5dc] w-full py-16 hidden">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-1">
            <p className="text-[0.7rem] tracking-widest uppercase text-[#584531]/50 font-medium">Do campo ao pagamento</p>
            <h2 className="font-display text-2xl font-bold text-[#584531]">O fluxo completo da exportação</h2>
          </div>
          <ExportFlowAnimation />
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
            <h2 className="font-display text-[2.4rem] font-bold text-[#ede5dc]">{t('howWorksSectionTitle')}</h2>
            <p className="text-[#ede5dc] text-sm max-w-lg mx-auto">{t('howWorksSectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-[#dbcbba] p-5 flex gap-4">
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
            <h2 className="font-display text-[2.4rem] font-bold text-[#584531]">{t('whoUsesSectionTitle')}</h2>
            <p className="text-[#584531] text-sm">{t('whoUsesSectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ENTITIES.map(({ label, desc, slug }) => (
              <Link key={slug} href={`/registro/${slug}`}
                className="bg-[#ede5dc] flex flex-col hover:brightness-105 transition-all cursor-pointer">
                {/* Título acima da imagem — altura fixa para alinhar imagens */}
                <div className="px-3 pt-6 pb-2 text-center flex items-center justify-center" style={{ maxHeight: '2.75rem' }}>
                  <h3 className="font-display font-bold text-[#584531] uppercase tracking-wide text-[0.75rem] leading-tight">{label}</h3>
                </div>
                {/* Imagem com dimensões originais */}
                <div className="px-3 pt-3">
                  <Image
                    src={`/img/${slug}.webp`}
                    alt={label}
                    width={400}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
                {/* Texto + seta */}
                <div className="px-3 pb-3 flex flex-col flex-1 justify-between gap-2">
                  <p className="text-[0.62rem] text-[#584531] leading-relaxed">{desc}</p>
                  <div className="flex justify-end">
                    <ArrowRight className="w-3 h-3 text-[#584531]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/registro" className="inline-flex items-center gap-2 text-sm px-6 py-2 rounded-full bg-[#462a1f] hover:bg-[#5a3529] text-white transition-colors">
              {t('whoUsesCta')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#ede5dc] w-full pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#584531] p-10 text-center space-y-5">
            <Image src="/img/logo-branca-icon.webp" alt="" width={40} height={40} className="mx-auto" />
            <h2 className="font-display text-[1.95rem] md:text-[2.4rem] font-bold text-[#ede5dc]">
              {t('ctaTitle')}
            </h2>
            <p className="text-[#ede5dc]/80 text-sm max-w-sm mx-auto">
              {t('ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/registro" className="inline-flex items-center gap-2 text-sm px-6 py-2 rounded-full bg-[#dbcbba] hover:bg-[#ede5dc] text-[#584531] transition-colors">
                {t('ctaCreateAccount')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/entrar" className="inline-flex items-center gap-2 text-sm px-6 py-2 rounded-full bg-[#574531] hover:bg-[#6b5540] text-white/80 transition-colors">
                {t('ctaAlreadyHaveAccount')}
              </Link>
            </div>
          </div>
            <div className="w-full flex items-center justify-center pt-12">
              <Image
              src="/img/logo-cor.webp"
              alt="logo colorida"
              width={110} height={37}
              />
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

