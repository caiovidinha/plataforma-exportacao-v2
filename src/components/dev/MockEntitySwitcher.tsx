'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMockSession } from '@/lib/mock-session'
import { ENTITY_CONFIG, ENTITY_SLUGS } from '@/lib/entity-config'
import {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
  ChevronDown, X, SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { ElementType } from 'react'

const ICONS: Record<string, ElementType> = {
  Globe, Building2, Truck, Ship, FileCheck,
  DollarSign, Warehouse, Shield, BadgeCheck, Microscope,
}

export function MockEntitySwitcher() {
  const t = useTranslations('devtools')
  const [open, setOpen] = useState(false)
  const { entityType, user, setEntityType } = useMockSession()
  const router = useRouter()
  const current = ENTITY_CONFIG[entityType]
  const Icon = ICONS[current.icon] ?? Globe

  function handleSwitch(slug: typeof ENTITY_SLUGS[number]) {
    setEntityType(slug)
    setOpen(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-slate-200">{t('simulateEntity')}</span>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            </button>
          </div>

          {/* Current user info */}
          <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-700/50">
            <p className="text-xs text-slate-400">{t('loggedAs')}</p>
            <p className="text-sm font-semibold text-slate-100 truncate">{user.company_name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>

          {/* Entity list */}
          <div className="max-h-72 overflow-y-auto py-1.5">
            {ENTITY_SLUGS.map((slug) => {
              const cfg = ENTITY_CONFIG[slug]
              const ItemIcon = ICONS[cfg.icon] ?? Globe
              const isActive = slug === entityType
              return (
                <button key={slug} onClick={() => handleSwitch(slug)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800 transition-colors',
                    isActive && 'bg-slate-800 border-l-2 pl-3.5',
                    isActive ? `border-current ${cfg.color}` : 'border-transparent',
                  )}>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <ItemIcon className={cn('w-3.5 h-3.5', cfg.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-xs font-medium', isActive ? 'text-slate-100' : 'text-slate-300')}>
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{ENTITY_CONFIG[slug].tagline}</p>
                  </div>
                  {isActive && <span className="ml-auto text-[10px] text-brand-400 font-semibold">{t('activeBadge')}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl border transition-all text-xs font-semibold',
          'bg-slate-900 border-violet-500/40 text-violet-300 hover:bg-slate-800 hover:border-violet-400',
        )}>
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        <div className={cn('w-4 h-4 rounded flex items-center justify-center flex-shrink-0', current.bg)}>
          <Icon className={cn('w-2.5 h-2.5', current.color)} />
        </div>
        <span className="max-w-[100px] truncate">{current.label}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>
    </div>
  )
}
