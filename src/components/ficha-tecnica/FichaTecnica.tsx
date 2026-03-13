'use client'

import { useState } from 'react'
import {
  Microscope,
  Leaf,
  FlaskConical,
  ShieldCheck,
  Globe,
  Package,
  Info,
  CheckCircle2,
  XCircle,
  Ship,
  Plane,
  Tag,
  ClipboardList,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Product, LegalRequirement } from '@/types'

type TabId = 'geral' | 'organoleptico' | 'fisicoquimico' | 'nutricional' | 'exigencias'

// ---- Linha de dado simples ------------------------------------
function DataRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn('flex items-start justify-between py-2.5 border-b border-[#3e2e1e]/15 last:border-0 gap-4', highlight && 'bg-[#584531]/5 -mx-3 px-3')}>
      <span className="text-xs text-[#584531]/70 flex-shrink-0">{label}</span>
      <span className={cn('text-xs text-right font-medium', highlight ? 'text-[#3e2e1e] font-semibold' : 'text-[#3e2e1e]')}>{value}</span>
    </div>
  )
}

// ---- Tabela de aflatoxina por paÃ­s ----------------------------
function AflatoxinTable({ tolerances }: { tolerances: Product['physicochemical']['aflatoxin_tolerance_by_country'] }) {
  const t = useTranslations('ficha')
  return (
    <div className="border border-[#3e2e1e]/20 overflow-hidden">
      <div className="grid grid-cols-3 gap-0 bg-[#f0e8de] px-4 py-2 text-xs font-semibold text-[#584531]">
        <span>{t('aflatoxinCountry')}</span>
        <span className="text-center">{t('aflatoxinTolerance')}</span>
        <span className="text-right">{t('aflatoxinRisk')}</span>
      </div>
      {tolerances.map((row) => {
        const risk = row.tolerance_ppb <= 10 ? t('riskRestricted') : row.tolerance_ppb <= 15 ? t('riskModerate') : t('riskPermissive')
        const riskColor = row.tolerance_ppb <= 10 ? 'text-red-400' : row.tolerance_ppb <= 15 ? 'text-amber-400' : 'text-emerald-700'
        return (
          <div key={row.country_code} className="grid grid-cols-3 gap-0 px-4 py-2.5 border-t border-[#3e2e1e]/15 hover:bg-[#f0e8de]/60 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#584531]/50" />
              <span className="text-[#3e2e1e]">{row.country_name}</span>
            </div>
            <div className="text-center">
              <span className="font-mono font-semibold text-[#584531]">{row.tolerance_ppb}</span>
              <span className="text-slate-500 ml-1">ppb</span>
            </div>
            <div className={cn('text-right font-medium', riskColor)}>{risk}</div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Painel de exigÃªncias legais por paÃ­s ---------------------
function LegalRequirementsPanel({ requirements }: { requirements: LegalRequirement[] }) {
  const t = useTranslations('ficha')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    requirements[0]?.country_code ?? null,
  )

  const selected = requirements.find((r) => r.country_code === selectedCountry)

  const docTypeIconMap = {
    FITOSSANITARIO: Leaf,
    ORIGEM: Tag,
    HIGIENICO_SANITARIO: Microscope,
    MERCADO: ClipboardList,
    OUTROS: FileText,
  } as const

  const docTypeLabel = {
    FITOSSANITARIO: t('docTypeFito'),
    ORIGEM: t('docTypeOrigin'),
    HIGIENICO_SANITARIO: t('docTypeHigiene'),
    MERCADO: t('docTypeMercado'),
    OUTROS: t('docTypeOutros'),
  }

  return (
    <div className="flex gap-4">
      {/* Lista de paÃ­ses */}
      <div className="w-44 flex-shrink-0 space-y-1">
        <p className="text-xs font-semibold text-[#584531] mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> {t('destinationCountries')}
        </p>
        {requirements.map((r) => (
          <button
            key={r.country_code}
            onClick={() => setSelectedCountry(r.country_code)}
            className={cn(
              'w-full text-left px-3 py-2 text-xs transition-colors',
              selectedCountry === r.country_code
                ? 'bg-[#584531]/15 text-[#584531] border border-[#584531]/30'
                : 'text-[#584531]/70 hover:bg-[#f0e8de] hover:text-[#3e2e1e]',
            )}
          >
            {r.country_name}
          </button>
        ))}
      </div>

      {/* Documentos do paÃ­s selecionado */}
      {selected && (
        <div className="flex-1 space-y-3 animate-fade-in">
          <h4 className="text-sm font-semibold text-[#3e2e1e]">
            {t('requiredDocFor')} <span className="text-[#584531]">{selected.country_name}</span>
          </h4>
          {selected.documents.map((doc, i) => {
            const DocIcon = docTypeIconMap[doc.type] ?? FileText
            return (
            <div
              key={i}
              className={cn(
                'border p-4 space-y-1.5',
                doc.required
                  ? 'border-[#584531]/30 bg-[#584531]/5'
                  : 'border-[#3e2e1e]/20 bg-white/40',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DocIcon className="w-4 h-4 text-[#584531] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#3e2e1e]">{doc.name}</span>
                </div>
                {doc.required ? (
                  <span className="flex items-center gap-1 badge text-emerald-700 border-emerald-700/30 bg-emerald-700/10">
                    <CheckCircle2 className="w-3 h-3" /> {t('docRequired')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 badge text-slate-400 border-slate-600/30">
                    <XCircle className="w-3 h-3" /> {t('docOptional')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#584531]/70">
                {t('issuedBy')} <strong className="text-[#3e2e1e]">{doc.issuing_authority}</strong>
              </p>
              {doc.notes && <p className="text-xs text-amber-400/80 italic">{doc.notes}</p>}
              <span className="inline-block text-xs text-[#584531]/80 bg-[#584531]/10 px-1.5 py-0.5">
                {docTypeLabel[doc.type]}
              </span>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- Componente principal ----------------------------------------
export function FichaTecnica({ product }: { product: Product }) {
  const t = useTranslations('ficha')
  const [activeTab, setActiveTab] = useState<TabId>('geral')

  const TABS = [
    { id: 'geral' as TabId, label: t('tabGeneral'), icon: Info },
    { id: 'organoleptico' as TabId, label: t('tabOrganoleptic'), icon: Leaf },
    { id: 'fisicoquimico' as TabId, label: t('tabPhysicochemical'), icon: FlaskConical },
    { id: 'nutricional' as TabId, label: t('tabNutritional'), icon: Microscope },
    { id: 'exigencias' as TabId, label: t('tabLegal'), icon: ShieldCheck },
  ]

  return (
    <div className="space-y-5">
      {/* Abas */}
      <div className="flex gap-1 bg-[#f0e8de] p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
              activeTab === id
                ? 'bg-[#584531] text-[#ede5dc]'
                : 'text-[#584531]/70 hover:text-[#3e2e1e] hover:bg-white/50',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ConteÃºdo das abas */}
      <div className="animate-fade-in">
        {/* -------- GERAL -------- */}
        {activeTab === 'geral' && (
          <div className="card space-y-0">
            <DataRow label={t('rowProduct')} value={product.name} highlight />
            <DataRow label={t('rowDescription')} value={product.description} />
            <DataRow label={t('rowCategory')} value={product.category} />
            <DataRow label={t('rowPackaging')} value={product.packaging} />
            {product.expiration_date && (
              <DataRow label={t('rowExpiry')} value={product.expiration_date} />
            )}
            <DataRow
              label={t('rowTransport')}
              value={
                <div className="flex gap-2 justify-end">
                  {product.transport_modes.includes('MARITIMO') && (
                    <span className="flex items-center gap-1 badge text-blue-400 border-blue-400/30 bg-blue-400/10">
                      <Ship className="w-3 h-3" /> {t('transportMaritime')}
                    </span>
                  )}
                  {product.transport_modes.includes('AEREO') && (
                    <span className="flex items-center gap-1 badge text-violet-400 border-violet-400/30 bg-violet-400/10">
                      <Plane className="w-3 h-3" /> {t('transportAir')}
                    </span>
                  )}
                </div>
              }
            />
            {product.certifications.length > 0 && (
              <DataRow
                label={t('rowCertifications')}
                value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {product.certifications.map((c) => (
                      <span key={c} className="badge text-[#584531] border-[#584531]/30 bg-[#584531]/10">{c}</span>
                    ))}
                  </div>
                }
              />
            )}
          </div>
        )}

        {/* -------- ORGANOLÉPTICO -------- */}
        {activeTab === 'organoleptico' && (
          <div className="card space-y-0">
            <p className="text-xs text-[#584531]/70 mb-3">
              {t('orgSensoryNote')} <strong className="text-[#3e2e1e]">{product.organoleptical.analysis_method}</strong>
            </p>
            <DataRow label={t('orgAppearance')} value={product.organoleptical.appearance} />
            <DataRow label={t('orgColor')} value={product.organoleptical.color} />
            <DataRow label={t('orgAroma')} value={product.organoleptical.aroma} />
            <DataRow label={t('orgFormat')} value={product.organoleptical.format} />
            <DataRow label={t('orgTexture')} value={product.organoleptical.texture} />
            <DataRow label={t('orgMethod')} value={product.organoleptical.analysis_method} />
          </div>
        )}

        {/* -------- FÃSICO-QUÃMICO -------- */}
        {activeTab === 'fisicoquimico' && (
          <div className="space-y-4">
            <div className="card space-y-0">
              <p className="text-xs font-semibold text-[#584531] mb-3">
                {t('physQualityLimits')} {product.physicochemical.analysis_method}
              </p>
              <DataRow label={t('physDefective')} value={`${product.physicochemical.max_defective_units_pct}%`} />
              <DataRow label={t('physBroken')} value={`${product.physicochemical.max_broken_units_pct}%`} />
              <DataRow label={t('physRancid')} value={`${product.physicochemical.max_rancid_units_pct}%`} highlight />
            </div>

            <div className="space-y-2">
              <h4 className="section-title flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#584531]" />
                {t('physAflatoxinTitle')}
              </h4>
              <p className="text-xs text-[#584531]/70">
                {t('physAflatoxinDesc')}
              </p>
              <AflatoxinTable tolerances={product.physicochemical.aflatoxin_tolerance_by_country} />
            </div>
          </div>
        )}

        {/* -------- NUTRICIONAL -------- */}
        {activeTab === 'nutricional' && (
          <div className="card max-w-sm">
            <div className="text-center mb-4">
              <h4 className="font-display font-bold text-[#3e2e1e] text-base">{t('nutriTitle')}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('nutriServing', { g: product.nutritional.serving_size_g })}
              </p>
            </div>
            <div className="border-t-4 border-[#3e2e1e]/25 pt-3 space-y-0">
              <DataRow label={t('nutriEnergy')} value={`${product.nutritional.calories_kcal} kcal`} highlight />
              <DataRow label={t('nutriTotalFat')} value={`${product.nutritional.total_fat_g} g`} />
              <DataRow label={t('nutriSatFat')} value={`${product.nutritional.saturated_fat_g} g`} />
              <DataRow label={t('nutriSodium')} value={`${product.nutritional.sodium_mg} mg`} />
              <DataRow label={t('nutriCarbs')} value={`${product.nutritional.total_carbs_g} g`} />
              <DataRow label={t('nutriFiber')} value={`${product.nutritional.dietary_fiber_g} g`} />
              <DataRow label={t('nutriProtein')} value={`${product.nutritional.proteins_g} g`} />
              {product.nutritional.selenium_mcg && (
                <DataRow label={t('nutriSelenium')} value={`${product.nutritional.selenium_mcg} mcg`} highlight />
              )}
            </div>
            {product.nutritional.selenium_mcg && (
              <p className="text-xs text-amber-400/80 mt-3 italic">
                {t('nutriSeleniumWarning', { pct: Math.round((product.nutritional.selenium_mcg / 400) * 100) })}
              </p>
            )}
          </div>
        )}

        {/* -------- EXIGÃŠNCIAS LEGAIS -------- */}
        {activeTab === 'exigencias' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-[#584531]" />
              <div>
                <h4 className="section-title">{t('legalTitle')}</h4>
                  <p className="text-xs text-[#584531]/70 mt-0.5">
                  {t('legalSubtitle')}
                </p>
              </div>
            </div>
            {product.legal_requirements.length > 0 ? (
              <LegalRequirementsPanel requirements={product.legal_requirements} />
            ) : (
              <div className="text-center py-8 text-[#584531]/50">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('noLegalReqs')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

