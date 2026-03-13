import Link from 'next/link'
import { ENTITY_CONFIG, ENTITY_SLUGS } from '@/lib/entity-config'
import {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { ElementType } from 'react'

export const metadata = { title: 'Cadastro - O que você é?' }

const ICONS: Record<string, ElementType> = {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
}

// Maps slug → description key in the "entities" namespace
const DESC_KEY: Record<string, string> = {
  exportador:             'exportadorDesc',
  importador:             'importadorDesc',
  transportadora:         'transportadoraDesc',
  'companhia-navegacao':  'companhia-navegacaoDesc',
  despachante:            'despachantDesc',
  corretora:              'corretoraDesc',
  terminal:               'terminalDesc',
  seguradora:             'seguradoraDesc',
  certificadora:          'certificadoraDesc',
  laboratorio:            'laboratorioDesc',
}

export default async function RegistroPage() {
  const t = await getTranslations('registro')
  const tEntities = await getTranslations('entities')

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-sans font-bold text-[#3e2e1e] pt-10">{t('pageTitle')}</h1>
        <p className="text-sm text-[#584531]/80 max-w-md mx-auto font-sans">
          {t('pageDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ENTITY_SLUGS.map((slug) => {
          const cfg = ENTITY_CONFIG[slug]
          const Icon = ICONS[cfg.icon] ?? Globe
          return (
            <Link key={slug} href={`/registro/${slug}`}
              className="group flex items-start gap-4 bg-[#584531]/10 hover:border-[#584531] hover:brightness-150 transition-all cursor-pointer p-5 shadow-sm">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-[#584531]/10">
                <Icon className="w-5 h-5 text-[#584531]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#3e2e1e] group-hover:text-[#110b06] transition-colors font-sans">
                  {tEntities(slug as Parameters<typeof tEntities>[0])}
                </p>
                <p className="text-[0.69rem] text-[#584531] mt-0.5 leading-relaxed font-sans">
                  {tEntities(DESC_KEY[slug] as Parameters<typeof tEntities>[0])}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <p className="text-center text-sm text-[#584531]/80 pt-2 font-sans">
        {t('hasAccount')}{' '}
        <Link href="/entrar" className="text-[#3e2e1e] hover:text-[#110b06] hover:underline font-semibold transition-colors">
          {t('signIn')}
        </Link>
      </p>
    </div>
  )
}
