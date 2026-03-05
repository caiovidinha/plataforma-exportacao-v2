import Link from 'next/link'
import { ENTITY_CONFIG, ENTITY_SLUGS } from '@/lib/entity-config'
import {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ElementType } from 'react'

export const metadata = { title: 'Cadastro — O que você é?' }

const ICONS: Record<string, ElementType> = {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
}

export default function RegistroPage() {
  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold text-slate-100">Como você vai usar a plataforma?</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Selecione o tipo que melhor descreve sua empresa. Seu cadastro será personalizado de acordo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ENTITY_SLUGS.map((slug) => {
          const cfg = ENTITY_CONFIG[slug]
          const Icon = ICONS[cfg.icon] ?? Globe
          return (
            <Link key={slug} href={`/registro/${slug}`}
              className={cn(
                'group card flex items-start gap-4 hover:border-slate-500 hover:bg-slate-800/70 transition-all cursor-pointer',
              )}>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105', cfg.bg)}>
                <Icon className={cn('w-6 h-6', cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold text-slate-100 group-hover:text-white transition-colors', cfg.color.replace('text-', 'group-hover:text-').replace('400', '300'))}>
                  {cfg.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cfg.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <p className="text-center text-sm text-slate-500 pt-2">
        Já tem conta?{' '}
        <Link href="/entrar" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Entrar
        </Link>
      </p>
    </div>
  )
}
