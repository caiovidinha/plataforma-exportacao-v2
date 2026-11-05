import { ArrowRight, BadgeCheck, Calculator, FileCheck2, Handshake, Landmark, LineChart, Lock, PackageCheck, Route, ShieldCheck, Ship, Tags, Truck, Wallet } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getStageDef, MAIN_FLOW, PARTNER_META, tr, type PartnerType } from '@amazon-trade/shared'
import { Logo } from '@/components/brand/Logo'
import { FlagSwitch } from '@/components/layout/FlagSwitch'
import { LocaleSwitch } from '@/components/layout/LocaleSwitch'
import { getT } from '@/lib/i18n-server'

/** Verde de destaque = o mesmo do botão "Log in" do banner. */
const LIME = 'bg-[#a9d43f]'
const GUTTER = 'px-[6%] md:px-[9%]'
const VIDEO_ID = 'DSyAje9OG7g'

/** Landing pública — banner no layout de referência, demais seções com o mesmo respiro lateral. */
export default function Landing() {
  const { t, locale } = getT()

  const features = [
    { icon: Tags, title: t('landing.feat1.title'), text: t('landing.feat1.text') },
    { icon: FileCheck2, title: t('landing.feat2.title'), text: t('landing.feat2.text') },
    { icon: Route, title: t('landing.feat3.title'), text: t('landing.feat3.text') },
    { icon: Truck, title: t('landing.feat4.title'), text: t('landing.feat4.text') },
    { icon: ShieldCheck, title: t('landing.feat5.title'), text: t('landing.feat5.text') },
    { icon: LineChart, title: t('landing.feat6.title'), text: t('landing.feat6.text') },
  ]
  const steps = [
    { icon: Landmark, title: t('landing.step1.title'), text: t('landing.step1.text') },
    { icon: Calculator, title: t('landing.step2.title'), text: t('landing.step2.text') },
    { icon: Handshake, title: t('landing.step3.title'), text: t('landing.step3.text') },
    { icon: Ship, title: t('landing.step4.title'), text: t('landing.step4.text') },
  ]
  const partners = [
    { img: 'despachante', icon: FileCheck2, name: t('landing.partner.customs'), text: t('landing.partner.customs.text') },
    { img: 'companhia-navegacao', icon: Ship, name: t('landing.partner.ocean'), text: t('landing.partner.ocean.text') },
    { img: 'transportadora', icon: Truck, name: t('landing.partner.land'), text: t('landing.partner.land.text') },
    { img: 'corretora', icon: Wallet, name: t('landing.partner.fx'), text: t('landing.partner.fx.text') },
    { img: 'seguradora', icon: ShieldCheck, name: t('landing.partner.insurance'), text: t('landing.partner.insurance.text') },
  ]
  const stagePartners = (stage: (typeof MAIN_FLOW)[number]) => [...new Set(getStageDef(stage).tasks.map((x) => x.partner).filter(Boolean))] as PartnerType[]

  return (
    <div className="bg-white">
      {/* ------------------------------------------------ banner (layout de referência) */}
      <section className="relative isolate overflow-hidden bg-[#02260f] text-white">
        <div className="relative min-h-[480px] md:aspect-[2000/736] md:max-h-[520px] md:min-h-0">
          <Image src="/img/banner-lp.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[72%_center]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#02260f]/70 via-transparent to-transparent md:hidden" />

          <header className="absolute inset-x-0 top-0 flex items-center justify-between px-[6%] pt-4 md:px-[9%] md:pt-[1.8%]">
            <Link href="/" aria-label="Amazon Trade">
              <Logo tone="light" className="h-7 md:h-[clamp(1.5rem,2.3vw,2.4rem)]" />
            </Link>
            <nav className="hidden items-center gap-[clamp(1.25rem,3.4vw,3.5rem)] font-display text-[clamp(0.7rem,0.85vw,0.85rem)] text-white md:flex">
              <a href="#como-funciona" className="hover:text-[#a9d43f]">{t('landing.nav.how')}</a>
              <a href="#para-quem" className="hover:text-[#a9d43f]">{t('landing.nav.who')}</a>
              <a href="#parceiros" className="hover:text-[#a9d43f]">{t('landing.nav.partners')}</a>
              <a href="#processo" className="hover:text-[#a9d43f]">{t('landing.nav.process')}</a>
            </nav>
            <div className="flex items-center gap-4">
              <FlagSwitch />
              <Link href="/login" className={`inline-flex items-center gap-2 rounded-full ${LIME} px-4 py-1.5 font-display text-xs font-medium text-brand-950 transition-colors hover:bg-[#bde253]`}>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-950" /> {t('landing.login')}
              </Link>
            </div>
          </header>

          <div className="absolute left-[6%] top-[20%] max-w-[88%] font-display md:left-[9%] md:top-[24%] md:max-w-[44%]">
            <h1 className="max-w-[11em] text-[clamp(1.9rem,3.1vw,3.2rem)] font-normal leading-[1.05] tracking-tight">{t('landing.hero.title')}</h1>
            <div className="mt-[clamp(0.75rem,1.4vw,1.6rem)] space-y-0.5 text-[clamp(0.8rem,1vw,1.05rem)] font-light leading-snug text-white/95">
              <p>{t('landing.hero.line1')}</p>
              <p>{t('landing.hero.line2')}</p>
              <p className="text-[0.82em] text-white/85">{t('landing.hero.line3')}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 md:hidden">
              <Link href="/register?type=EXPORTER" className={`${LIME} px-4 py-2 text-xs font-semibold text-brand-950`}>{t('landing.cta.exporter')}</Link>
              <Link href="/register?type=IMPORTER" className="border border-white/50 px-4 py-2 text-xs font-semibold">{t('landing.cta.importer')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ recursos */}
      <section id="recursos" className={`${GUTTER} py-12 md:py-16`}>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{t('landing.feat.kicker')}</p>
          <h2 className="mt-2 font-display text-xl font-medium tracking-tight text-ink-900 md:text-2xl">{t('landing.feat.title')}</h2>
        </div>
        <div className="mt-8 grid gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="bg-white p-5 transition-colors hover:bg-brand-50/60">
              <span className={`grid h-9 w-9 place-items-center ${LIME} text-brand-950`}>
                <f.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ como funciona + vídeo */}
      <section id="como-funciona" className="relative isolate overflow-hidden bg-brand-950 text-white">
        <Image src="/img/hero-background.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25 mix-blend-luminosity" />
        <div className={`${GUTTER} py-12 md:py-16`}>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#a9d43f]">{t('landing.how.kicker')}</p>
            <h2 className="mt-2 font-display text-xl font-medium tracking-tight md:text-2xl">{t('landing.how.title')}</h2>
            <p className="mt-2 text-sm text-brand-100/80">{t('landing.how.subtitle')}</p>
          </div>
          <div className="relative mx-auto mt-8 aspect-video w-full max-w-2xl shadow-2xl ring-1 ring-white/15">
            <iframe
              src={`https://www.youtube.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
              title="Amazon Trade"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <ol className="mt-10 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative bg-brand-950/90 p-5">
                <span className="absolute right-4 top-3 font-display text-4xl font-light text-white/10">{i + 1}</span>
                <span className={`grid h-9 w-9 place-items-center ${LIME} text-brand-950`}><s.icon className="h-4 w-4" /></span>
                <h3 className="mt-4 text-sm font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-brand-100/75">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ para quem (cards compactos, imagem até a borda) */}
      <section id="para-quem" className={`bg-brand-50 ${GUTTER} py-10 md:py-14`}>
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            { img: 'exportador', title: t('landing.exporter.title'), text: t('landing.exporter.text'), items: [t('landing.exporter.i1'), t('landing.exporter.i2'), t('landing.exporter.i3')], cta: t('landing.cta.exporter'), href: '/register?type=EXPORTER' },
            { img: 'importador', title: t('landing.importer.title'), text: t('landing.importer.text'), items: [t('landing.importer.i1'), t('landing.importer.i2'), t('landing.importer.i3')], cta: t('landing.cta.importer'), href: '/register?type=IMPORTER' },
          ].map((c) => (
            <article key={c.img} className="flex flex-col overflow-hidden border border-brand-100 bg-white sm:flex-row">
              <div className="relative h-36 shrink-0 overflow-hidden sm:h-auto sm:w-[34%]">
                <Image src={`/img/${c.img}.webp`} alt="" fill sizes="(min-width:1024px) 20vw, 100vw" className="origin-top scale-[1.3] object-cover object-top" />
              </div>
              <div className="flex-1 p-5">
                <h3 className="font-display text-lg font-medium text-ink-900">{c.title}</h3>
                <p className="mt-1 text-[13px] text-ink-600">{c.text}</p>
                <ul className="mt-3 space-y-1.5">
                  {c.items.map((i) => (
                    <li key={i} className="flex gap-2 text-xs leading-snug text-ink-700">
                      <BadgeCheck className="mt-px h-4 w-4 shrink-0 text-brand-600" />
                      {i}
                    </li>
                  ))}
                </ul>
                <Link href={c.href} className={`mt-4 inline-flex items-center gap-2 ${LIME} px-3.5 py-1.5 text-xs font-semibold text-brand-950 hover:bg-[#bde253]`}>
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ parceiros */}
      <section id="parceiros" className={`${GUTTER} py-12 md:py-16`}>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{t('landing.partners.kicker')}</p>
          <h2 className="mt-2 font-display text-xl font-medium tracking-tight text-ink-900 md:text-2xl">{t('landing.partners.title')}</h2>
          <p className="mt-2 text-sm text-ink-600">{t('landing.partners.subtitle')}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {partners.map((p) => (
            <article key={p.name} className="group overflow-hidden border border-ink-200 bg-white transition-shadow hover:shadow-pop">
              <div className="relative h-28 overflow-hidden bg-brand-900">
                <Image src={`/img/${p.img}.webp`} alt="" fill sizes="(min-width:1024px) 18vw, 50vw" className="origin-top scale-[1.25] object-cover object-top opacity-85 transition-transform duration-500 group-hover:scale-[1.35]" />
                <div className="absolute inset-0 bg-brand-900/25" />
                <span className={`absolute bottom-0 left-0 grid h-8 w-8 place-items-center ${LIME} text-brand-950`}>
                  <p.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="text-[13px] font-semibold text-ink-900">{p.name}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-600">{p.text}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs text-ink-500">
          <Lock className="h-4 w-4" /> {t('landing.partners.privacy')}
        </p>
      </section>

      {/* ------------------------------------------------ processo: caminho (path) das etapas */}
      <section id="processo" className="bg-brand-950 py-20 text-white md:py-28">
        <div className={GUTTER}>
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#a9d43f]">{t('landing.process.kicker')}</p>
            <h2 className="mt-2 font-display text-xl font-medium tracking-tight md:text-2xl">{t('landing.process.title')}</h2>
            <p className="mt-2 text-sm text-brand-100/80">{t('landing.process.subtitle')}</p>
          </div>

          {/* trilho principal */}
          <div className="relative mt-10">
            <div aria-hidden className="absolute left-[10%] right-[10%] top-[15px] hidden h-[2px] bg-gradient-to-r from-[#a9d43f]/20 via-[#a9d43f] to-[#a9d43f]/20 md:block" />
            <div aria-hidden className="absolute bottom-6 left-[15px] top-6 w-[2px] bg-[#a9d43f]/50 md:hidden" />
            <ol className="relative grid gap-10 md:grid-cols-5 md:gap-4">
              {MAIN_FLOW.map((stage, i) => {
                const def = getStageDef(stage)
                const last = i === MAIN_FLOW.length - 1
                return (
                  <li key={stage} className="relative flex gap-5 md:block md:text-center">
                    <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center font-display text-xs font-semibold text-brand-950 md:mx-auto ${last ? 'bg-white ring-2 ring-[#a9d43f]' : `${LIME} ring-2 ring-brand-950`}`}>
                      {last ? <PackageCheck className="h-5 w-5" /> : String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="md:mt-4">
                      <h3 className="font-display text-sm font-medium">{tr(def.title, locale)}</h3>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-brand-100/70">{tr(def.description, locale)}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5 md:justify-center">
                        {stagePartners(stage).map((p) => (
                          <span key={p} className="border border-white/20 px-1.5 py-px text-[10px] text-brand-100/80">{tr(PARTNER_META[p].label, locale)}</span>
                        ))}
                        {stagePartners(stage).length === 0 && <span className="border border-white/20 px-1.5 py-px text-[10px] text-brand-100/80">{t('landing.process.platform')}</span>}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* ramificações de exceção */}
          <div className="relative mt-10 md:mx-[10%] md:mt-9">
            <div aria-hidden className="absolute -top-9 right-[12.5%] hidden h-9 w-px border-l-2 border-dashed border-[#a9d43f]/60 md:block" />
            <div aria-hidden className="absolute -top-9 right-[37.5%] hidden h-9 w-px border-l-2 border-dashed border-[#a9d43f]/60 md:block" />
            <div className="grid gap-4 md:grid-cols-2">
              {(['NAO_PAGAMENTO', 'MERCADORIA_RECUSADA'] as const).map((stage) => {
                const def = getStageDef(stage)
                return (
                  <div key={stage} className="border border-dashed border-[#a9d43f]/50 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#a9d43f]">
                      <ShieldCheck className="h-4 w-4" /> {t('landing.process.exception')}
                    </p>
                    <h3 className="mt-1.5 font-display text-sm font-medium">{tr(def.title, locale)}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-brand-100/70">{tr(def.description, locale)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ CTA + rodapé */}
      <section className={`bg-brand-700 ${GUTTER} py-9 text-white`}>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-lg font-medium tracking-tight md:text-xl">{t('landing.final.title')}</h2>
            <p className="mt-1 text-sm text-brand-50/90">{t('landing.final.text')}</p>
          </div>
          <Link href="/register" className={`inline-flex items-center gap-2 ${LIME} px-5 py-2 text-sm font-semibold text-brand-950 hover:bg-[#bde253]`}>
            {t('landing.register')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-brand-950 text-brand-100/80">
        <div className={`${GUTTER} flex flex-col gap-6 py-7 md:flex-row md:items-center md:justify-between`}>
          <div>
            <Logo tone="light" className="h-7" />
            <p className="mt-2 max-w-sm text-[11px] leading-relaxed">{t('landing.footer.about')}</p>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/login" className="hover:text-white">{t('landing.login')}</Link>
            <Link href="/register" className="hover:text-white">{t('landing.register')}</Link>
            <LocaleSwitch tone="light" />
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-brand-100/50">© {new Date().getFullYear()} Amazon Trade</div>
      </footer>
    </div>
  )
}
