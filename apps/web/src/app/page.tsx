import { ArrowRight, BadgeCheck, Calculator, ClipboardCheck, FileCheck2, Globe2, Handshake, Lock, Ship, ShieldCheck, Truck, Wallet } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getStageDef, MAIN_FLOW } from '@amazon-trade/shared'
import { Logo } from '@/components/brand/Logo'
import { LocaleSwitch } from '@/components/layout/LocaleSwitch'
import { getT } from '@/lib/i18n-server'

/** Landing pública — tom principal #1b6145. Conteúdo 100% estático (sem dados de exemplo fingindo ser reais). */
export default function Landing() {
  const { t, locale } = getT()

  const steps = [
    { icon: ClipboardCheck, title: t('landing.step1.title'), text: t('landing.step1.text') },
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

  return (
    <div className="bg-white">
      {/* ------------------------------------------------ hero */}
      <section className="relative isolate overflow-hidden bg-brand-900 text-white">
        <Image src="/img/hero-background.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-center opacity-60 mix-blend-luminosity" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-900/90 to-brand-700/40" />
        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Logo tone="light" />
          <nav className="hidden items-center gap-7 text-sm text-white/80 md:flex">
            <a href="#como-funciona" className="hover:text-white">{t('landing.nav.how')}</a>
            <a href="#para-quem" className="hover:text-white">{t('landing.nav.who')}</a>
            <a href="#parceiros" className="hover:text-white">{t('landing.nav.partners')}</a>
            <a href="#processo" className="hover:text-white">{t('landing.nav.process')}</a>
          </nav>
          <div className="flex items-center gap-4">
            <LocaleSwitch tone="light" className="hidden sm:inline-flex" />
            <Link href="/login" className="text-sm font-medium text-white/90 hover:text-white">{t('landing.login')}</Link>
            <Link href="/register" className="hidden rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 sm:inline-block">{t('landing.register')}</Link>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pb-32 sm:pt-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 ring-1 ring-white/20">
            <BadgeCheck className="h-3.5 w-3.5" /> {t('landing.hero.badge')}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">{t('landing.hero.title')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-50/90">{t('landing.hero.subtitle')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register?type=EXPORTER" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-800 shadow-lg hover:bg-brand-50">
              {t('landing.cta.exporter')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/register?type=IMPORTER" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10">
              {t('landing.cta.importer')}
            </Link>
          </div>
          <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
            {[
              [t('landing.stat1.v'), t('landing.stat1.l')],
              [t('landing.stat2.v'), t('landing.stat2.l')],
              [t('landing.stat3.v'), t('landing.stat3.l')],
              [t('landing.stat4.v'), t('landing.stat4.l')],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-2xl font-semibold text-white sm:text-3xl">{v}</dt>
                <dd className="mt-1 text-xs text-brand-100/80">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------ como funciona */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{t('landing.how.kicker')}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{t('landing.how.title')}</h2>
          <p className="mt-4 text-lg text-ink-600">{t('landing.how.subtitle')}</p>
        </div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
              <span className="absolute right-5 top-5 text-5xl font-semibold text-brand-50">{i + 1}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------ para quem */}
      <section id="para-quem" className="bg-brand-50 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-2">
          {[
            { img: 'exportador', title: t('landing.exporter.title'), text: t('landing.exporter.text'), items: [t('landing.exporter.i1'), t('landing.exporter.i2'), t('landing.exporter.i3')], cta: t('landing.cta.exporter'), href: '/register?type=EXPORTER' },
            { img: 'importador', title: t('landing.importer.title'), text: t('landing.importer.text'), items: [t('landing.importer.i1'), t('landing.importer.i2'), t('landing.importer.i3')], cta: t('landing.cta.importer'), href: '/register?type=IMPORTER' },
          ].map((c) => (
            <article key={c.img} className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-brand-100">
              <div className="relative h-56">
                <Image src={`/img/${c.img}.webp`} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
              </div>
              <div className="p-7 pt-2">
                <h3 className="text-2xl font-semibold tracking-tight text-ink-900">{c.title}</h3>
                <p className="mt-2 text-ink-600">{c.text}</p>
                <ul className="mt-5 space-y-2.5">
                  {c.items.map((i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-ink-700">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {i}
                    </li>
                  ))}
                </ul>
                <Link href={c.href} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ parceiros */}
      <section id="parceiros" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{t('landing.partners.kicker')}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{t('landing.partners.title')}</h2>
          <p className="mt-4 text-lg text-ink-600">{t('landing.partners.subtitle')}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {partners.map((p) => (
            <article key={p.name} className="group overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-shadow hover:shadow-pop">
              <div className="relative h-36 overflow-hidden bg-brand-900">
                <Image src={`/img/${p.img}.webp`} alt="" fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover object-top opacity-80 transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-brand-900/30" />
                <span className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-lg bg-white text-brand-700 shadow">
                  <p.icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-ink-900">{p.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{p.text}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-ink-500">
          <Lock className="h-4 w-4" /> {t('landing.partners.privacy')}
        </p>
      </section>

      {/* ------------------------------------------------ processo (etapas reais do embarque) */}
      <section id="processo" className="bg-brand-950 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">{t('landing.process.kicker')}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.process.title')}</h2>
            <p className="mt-4 text-lg text-brand-100/80">{t('landing.process.subtitle')}</p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {MAIN_FLOW.map((stage, i) => {
              const def = getStageDef(stage)
              return (
                <li key={stage} className="relative rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <span className="text-xs font-semibold text-brand-300">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 text-base font-semibold">{def.title[locale]}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-brand-100/70">{def.description[locale]}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ CTA + rodapé */}
      <section className="bg-brand-600 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('landing.final.title')}</h2>
            <p className="mt-2 text-brand-50/90">{t('landing.final.text')}</p>
          </div>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-brand-800 hover:bg-brand-50">
            {t('landing.register')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-brand-950 text-brand-100/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo tone="light" />
            <p className="mt-3 max-w-sm text-xs leading-relaxed">{t('landing.footer.about')}</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="hover:text-white">{t('landing.login')}</Link>
            <Link href="/register" className="hover:text-white">{t('landing.register')}</Link>
            <LocaleSwitch tone="light" />
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-brand-100/50">
          <Globe2 className="mr-1.5 inline h-3 w-3" /> © {new Date().getFullYear()} Amazon Trade
        </div>
      </footer>
    </div>
  )
}
