'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMockSession } from '@/lib/mock-session'
import {
  Package,
  Leaf,
  AlertTriangle,
  ChevronRight,
  Truck,
  Ship,
  FileCheck,
  DollarSign,
  Microscope,
  Shield,
  Building,
  Users,
  Award,
} from 'lucide-react'

export default function CadastroPage() {
  const t = useTranslations('registrations')
  const tMapa = useTranslations('mapa')
  const { entityType, user } = useMockSession()

  const isExportador = entityType === 'exportador'
  const isImportador = entityType === 'importador'
  const isTrading = isExportador || isImportador

  const exporterItems = [
    { href: '/cadastro/produtos',  label: t('products'),       icon: Package, desc: t('productsDesc') },
    { href: '/cadastro/mapa',      label: t('mapa'),           icon: Leaf,    desc: t('mapaDesc') },
    { href: '/minha-conta',        label: t('exporterProfile'),icon: Users,   desc: t('exporterProfileDesc') },
  ]

  const importerItems = [
    { href: '/cadastro/produtos',  label: t('products'),       icon: Package,  desc: t('productsDesc') },
    { href: '/minha-conta',        label: t('importerProfile'),icon: Building, desc: t('importerProfileDesc') },
  ]

  const adminItems = [
    { href: '/cadastro/exportadores',    label: t('exporters'),      icon: Users,      desc: t('exportersDesc') },
    { href: '/cadastro/importadores',    label: t('importers'),      icon: Building,   desc: t('importersDesc') },
    { href: '/cadastro/produtos',        label: t('products'),       icon: Package,    desc: t('productsDesc') },
    { href: '/cadastro/transportadoras', label: t('transporters'),   icon: Truck,      desc: t('transportersDesc') },
    { href: '/cadastro/navegacao',       label: t('shippingLines'),  icon: Ship,       desc: t('shippingLinesDesc') },
    { href: '/cadastro/despachantes',    label: t('brokers'),        icon: FileCheck,  desc: t('brokersDesc') },
    { href: '/cadastro/corretoras',      label: t('exchangeHouses'), icon: DollarSign, desc: t('exchangeHousesDesc') },
    { href: '/cadastro/terminais',       label: t('terminals'),      icon: Package,    desc: t('terminalsDesc') },
    { href: '/cadastro/certificadoras',  label: t('certifiers'),     icon: Award,      desc: t('certifiersDesc') },
    { href: '/cadastro/laboratorios',    label: t('labs'),           icon: Microscope, desc: t('labsDesc') },
    { href: '/cadastro/seguradoras',     label: t('insurers'),       icon: Shield,     desc: t('insurersDesc') },
  ]

  const items = isExportador ? exporterItems : isImportador ? importerItems : adminItems

  const subtitle = isExportador
    ? t('exporterSubtitle')
    : isImportador
    ? t('importerSubtitle')
    : t('subtitle')

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>

      {isExportador && !user.mapa_registered && (
        <div className="bg-amber-400/10 border border-amber-400/30 p-4 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-200 font-medium">{tMapa('bannerTitle')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{tMapa('bannerDesc')}</p>
            </div>
          </div>
          <Link href="/cadastro/mapa" className="btn-primary whitespace-nowrap flex-shrink-0 text-sm py-1.5">
            {tMapa('bannerBtn')}
          </Link>
        </div>
      )}

      {isTrading && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-4">
          <p className="text-xs text-blue-300 leading-relaxed">
            <strong className="font-semibold">{t('providerTipHeading')}</strong>{' '}
            {t('providerTipBody1')}{' '}
            <Link href="/registro" className="underline hover:text-blue-200">/registro</Link>.{' '}
            {t('providerTipBody2')}{' '}
            <Link href="/servicos" className="underline hover:text-blue-200">{t('providerTipMarketplace')}</Link>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}
            className="card flex items-center gap-4 hover:border-slate-600 hover:bg-slate-800/60 transition-all group">
            <div className="w-10 h-10 bg-brand-400/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors">{label}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
