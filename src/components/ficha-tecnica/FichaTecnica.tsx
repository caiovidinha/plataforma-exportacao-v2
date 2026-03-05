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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Product, LegalRequirement } from '@/types'

type TabId = 'geral' | 'organoléptico' | 'fisicoquimico' | 'nutricional' | 'exigencias'

// ---- Linha de dado simples ------------------------------------
function DataRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn('flex items-start justify-between py-2.5 border-b border-slate-700/30 last:border-0 gap-4', highlight && 'bg-brand-500/5 -mx-3 px-3 rounded')}>
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <span className={cn('text-xs text-right font-medium', highlight ? 'text-brand-300' : 'text-slate-200')}>{value}</span>
    </div>
  )
}

// ---- Tabela de aflatoxina por país ----------------------------
function AflatoxinTable({ tolerances }: { tolerances: Product['physicochemical']['aflatoxin_tolerance_by_country'] }) {
  const t = useTranslations('ficha')
  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="grid grid-cols-3 gap-0 bg-dark-100 px-4 py-2 text-xs font-semibold text-slate-400">
        <span>{t('aflatoxinCountry')}</span>
        <span className="text-center">{t('aflatoxinTolerance')}</span>
        <span className="text-right">{t('aflatoxinRisk')}</span>
      </div>
      {tolerances.map((row) => {
        const risk = row.tolerance_ppb <= 10 ? t('riskRestricted') : row.tolerance_ppb <= 15 ? t('riskModerate') : t('riskPermissive')
        const riskColor = row.tolerance_ppb <= 10 ? 'text-red-400' : row.tolerance_ppb <= 15 ? 'text-amber-400' : 'text-emerald-400'
        return (
          <div key={row.country_code} className="grid grid-cols-3 gap-0 px-4 py-2.5 border-t border-slate-700/30 hover:bg-dark-100/50 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-200">{row.country_name}</span>
            </div>
            <div className="text-center">
              <span className="font-mono font-semibold text-brand-300">{row.tolerance_ppb}</span>
              <span className="text-slate-500 ml-1">ppb</span>
            </div>
            <div className={cn('text-right font-medium', riskColor)}>{risk}</div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Painel de exigências legais por país ---------------------
function LegalRequirementsPanel({ requirements }: { requirements: LegalRequirement[] }) {
  const t = useTranslations('ficha')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    requirements[0]?.country_code ?? null,
  )

  const selected = requirements.find((r) => r.country_code === selectedCountry)

  const docTypeIcon = {
    FITOSSANITARIO: '🌿',
    ORIGEM: '🏷️',
    HIGIENICO_SANITARIO: '🔬',
    MERCADO: '📋',
    OUTROS: '📄',
  }

  const docTypeLabel = {
    FITOSSANITARIO: t('docTypeFito'),
    ORIGEM: t('docTypeOrigin'),
    HIGIENICO_SANITARIO: t('docTypeHigiene'),
    MERCADO: t('docTypeMercado'),
    OUTROS: t('docTypeOutros'),
  }

  return (
    <div className="flex gap-4">
      {/* Lista de países */}
      <div className="w-44 flex-shrink-0 space-y-1">
        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> {t('destinationCountries')}
        </p>
        {requirements.map((r) => (
          <button
            key={r.country_code}
            onClick={() => setSelectedCountry(r.country_code)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
              selectedCountry === r.country_code
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:bg-dark-100 hover:text-slate-200',
            )}
          >
            {r.country_name}
          </button>
        ))}
      </div>

      {/* Documentos do país selecionado */}
      {selected && (
        <div className="flex-1 space-y-3 animate-fade-in">
          <h4 className="text-sm font-semibold text-slate-200">
            {t('requiredDocFor')} <span className="text-brand-400">{selected.country_name}</span>
          </h4>
          {selected.documents.map((doc, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-4 space-y-1.5',
                doc.required
                  ? 'border-brand-500/30 bg-brand-500/5'
                  : 'border-slate-700/40 bg-dark-50',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{docTypeIcon[doc.type]}</span>
                  <span className="text-xs font-semibold text-slate-200">{doc.name}</span>
                </div>
                {doc.required ? (
                  <span className="flex items-center gap-1 badge text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                    <CheckCircle2 className="w-3 h-3" /> {t('docRequired')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 badge text-slate-400 border-slate-600/30">
                    <XCircle className="w-3 h-3" /> {t('docOptional')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {t('issuedBy')} <strong className="text-slate-300">{doc.issuing_authority}</strong>
              </p>
              {doc.notes && <p className="text-xs text-amber-400/80 italic">{doc.notes}</p>}
              <span className="inline-block text-xs text-brand-400/80 bg-brand-500/10 rounded px-1.5 py-0.5">
                {docTypeLabel[doc.type]}
              </span>
            </div>
          ))}
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
    { id: 'organoléptico' as TabId, label: t('tabOrganoleptic'), icon: Leaf },
    { id: 'fisicoquimico' as TabId, label: t('tabPhysicochemical'), icon: FlaskConical },
    { id: 'nutricional' as TabId, label: t('tabNutritional'), icon: Microscope },
    { id: 'exigencias' as TabId, label: t('tabLegal'), icon: ShieldCheck },
  ]

  return (
    <div className="space-y-5">
      {/* Abas */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              activeTab === id
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-50',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
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
                      <span key={c} className="badge text-brand-400 border-brand-400/30 bg-brand-400/10">{c}</span>
                    ))}
                  </div>
                }
              />
            )}
          </div>
        )}

        {/* -------- ORGANOLÉPTICO -------- */}
        {activeTab === 'organoléptico' && (
          <div className="card space-y-0">
            <p className="text-xs text-slate-400 mb-3">
              {t('orgSensoryNote')} <strong className="text-slate-300">{product.organoleptical.analysis_method}</strong>
            </p>
            <DataRow label={t('orgAppearance')} value={product.organoleptical.appearance} />
            <DataRow label={t('orgColor')} value={product.organoleptical.color} />
            <DataRow label={t('orgAroma')} value={product.organoleptical.aroma} />
            <DataRow label={t('orgFormat')} value={product.organoleptical.format} />
            <DataRow label={t('orgTexture')} value={product.organoleptical.texture} />
            <DataRow label={t('orgMethod')} value={product.organoleptical.analysis_method} />
          </div>
        )}

        {/* -------- FÍSICO-QUÍMICO -------- */}
        {activeTab === 'fisicoquimico' && (
          <div className="space-y-4">
            <div className="card space-y-0">
              <p className="text-xs font-semibold text-slate-400 mb-3">
                {t('physQualityLimits')} {product.physicochemical.analysis_method}
              </p>
              <DataRow label={t('physDefective')} value={`${product.physicochemical.max_defective_units_pct}%`} />
              <DataRow label={t('physBroken')} value={`${product.physicochemical.max_broken_units_pct}%`} />
              <DataRow label={t('physRancid')} value={`${product.physicochemical.max_rancid_units_pct}%`} highlight />
            </div>

            <div className="space-y-2">
              <h4 className="section-title flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-brand-400" />
                {t('physAflatoxinTitle')}
              </h4>
              <p className="text-xs text-slate-400">
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
              <h4 className="font-display font-bold text-white text-base">{t('nutriTitle')}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('nutriServing', { g: product.nutritional.serving_size_g })}
              </p>
            </div>
            <div className="border-t-4 border-slate-200 pt-3 space-y-0">
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

        {/* -------- EXIGÊNCIAS LEGAIS -------- */}
        {activeTab === 'exigencias' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <div>
                <h4 className="section-title">{t('legalTitle')}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('legalSubtitle')}
                </p>
              </div>
            </div>
            {product.legal_requirements.length > 0 ? (
              <LegalRequirementsPanel requirements={product.legal_requirements} />
            ) : (
              <div className="text-center py-8 text-slate-500">
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

// ---- Linha de dado simples ------------------------------------
function DataRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn('flex items-start justify-between py-2.5 border-b border-slate-700/30 last:border-0 gap-4', highlight && 'bg-brand-500/5 -mx-3 px-3 rounded')}>
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <span className={cn('text-xs text-right font-medium', highlight ? 'text-brand-300' : 'text-slate-200')}>{value}</span>
    </div>
  )
}

// ---- Tabela de aflatoxina por país ----------------------------
function AflatoxinTable({ tolerances }: { tolerances: Product['physicochemical']['aflatoxin_tolerance_by_country'] }) {
  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="grid grid-cols-3 gap-0 bg-dark-100 px-4 py-2 text-xs font-semibold text-slate-400">
        <span>País / Região</span>
        <span className="text-center">Tolerância (ppb)</span>
        <span className="text-right">Nível de Risco</span>
      </div>
      {tolerances.map((t) => {
        const risk = t.tolerance_ppb <= 10 ? 'Restrito' : t.tolerance_ppb <= 15 ? 'Moderado' : 'Permissivo'
        const riskColor = t.tolerance_ppb <= 10 ? 'text-red-400' : t.tolerance_ppb <= 15 ? 'text-amber-400' : 'text-emerald-400'
        return (
          <div key={t.country_code} className="grid grid-cols-3 gap-0 px-4 py-2.5 border-t border-slate-700/30 hover:bg-dark-100/50 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-200">{t.country_name}</span>
            </div>
            <div className="text-center">
              <span className="font-mono font-semibold text-brand-300">{t.tolerance_ppb}</span>
              <span className="text-slate-500 ml-1">ppb</span>
            </div>
            <div className={cn('text-right font-medium', riskColor)}>{risk}</div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Painel de exigências legais por país ---------------------
function LegalRequirementsPanel({ requirements }: { requirements: LegalRequirement[] }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    requirements[0]?.country_code ?? null,
  )

  const selected = requirements.find((r) => r.country_code === selectedCountry)

  const docTypeIcon = {
    FITOSSANITARIO: '🌿',
    ORIGEM: '🏷️',
    HIGIENICO_SANITARIO: '🔬',
    MERCADO: '📋',
    OUTROS: '📄',
  }

  const docTypeLabel = {
    FITOSSANITARIO: 'Certificado Fitossanitário',
    ORIGEM: 'Certificado de Origem',
    HIGIENICO_SANITARIO: 'Cert. Higiênico-Sanitário',
    MERCADO: 'Certificação de Mercado',
    OUTROS: 'Outro Documento',
  }

  return (
    <div className="flex gap-4">
      {/* Lista de países */}
      <div className="w-44 flex-shrink-0 space-y-1">
        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Países Destino
        </p>
        {requirements.map((r) => (
          <button
            key={r.country_code}
            onClick={() => setSelectedCountry(r.country_code)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
              selectedCountry === r.country_code
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:bg-dark-100 hover:text-slate-200',
            )}
          >
            {r.country_name}
          </button>
        ))}
      </div>

      {/* Documentos do país selecionado */}
      {selected && (
        <div className="flex-1 space-y-3 animate-fade-in">
          <h4 className="text-sm font-semibold text-slate-200">
            Documentos exigidos para — <span className="text-brand-400">{selected.country_name}</span>
          </h4>
          {selected.documents.map((doc, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-4 space-y-1.5',
                doc.required
                  ? 'border-brand-500/30 bg-brand-500/5'
                  : 'border-slate-700/40 bg-dark-50',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{docTypeIcon[doc.type]}</span>
                  <span className="text-xs font-semibold text-slate-200">{doc.name}</span>
                </div>
                {doc.required ? (
                  <span className="flex items-center gap-1 badge text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                    <CheckCircle2 className="w-3 h-3" /> Obrigatório
                  </span>
                ) : (
                  <span className="flex items-center gap-1 badge text-slate-400 border-slate-600/30">
                    <XCircle className="w-3 h-3" /> Opcional
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Emitido por: <strong className="text-slate-300">{doc.issuing_authority}</strong>
              </p>
              {doc.notes && <p className="text-xs text-amber-400/80 italic">{doc.notes}</p>}
              <span className="inline-block text-xs text-brand-400/80 bg-brand-500/10 rounded px-1.5 py-0.5">
                {docTypeLabel[doc.type]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Componente principal ----------------------------------------
export function FichaTecnica({ product }: { product: Product }) {
  const [activeTab, setActiveTab] = useState<TabId>('geral')

  return (
    <div className="space-y-5">
      {/* Abas */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              activeTab === id
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-50',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      <div className="animate-fade-in">
        {/* -------- GERAL -------- */}
        {activeTab === 'geral' && (
          <div className="card space-y-0">
            <DataRow label="Produto" value={product.name} highlight />
            <DataRow label="Descrição" value={product.description} />
            <DataRow label="Categoria" value={product.category} />
            <DataRow label="Embalagem" value={product.packaging} />
            {product.expiration_date && (
              <DataRow label="Validade" value={product.expiration_date} />
            )}
            <DataRow
              label="Transporte"
              value={
                <div className="flex gap-2 justify-end">
                  {product.transport_modes.includes('MARITIMO') && (
                    <span className="flex items-center gap-1 badge text-blue-400 border-blue-400/30 bg-blue-400/10">
                      <Ship className="w-3 h-3" /> Marítimo
                    </span>
                  )}
                  {product.transport_modes.includes('AEREO') && (
                    <span className="flex items-center gap-1 badge text-violet-400 border-violet-400/30 bg-violet-400/10">
                      <Plane className="w-3 h-3" /> Aéreo
                    </span>
                  )}
                </div>
              }
            />
            {product.certifications.length > 0 && (
              <DataRow
                label="Certificações"
                value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {product.certifications.map((c) => (
                      <span key={c} className="badge text-brand-400 border-brand-400/30 bg-brand-400/10">{c}</span>
                    ))}
                  </div>
                }
              />
            )}
          </div>
        )}

        {/* -------- ORGANOLÉPTICO -------- */}
        {activeTab === 'organoléptico' && (
          <div className="card space-y-0">
            <p className="text-xs text-slate-400 mb-3">
              Características sensoriais avaliadas conforme <strong className="text-slate-300">{product.organoleptical.analysis_method}</strong>
            </p>
            <DataRow label="Aspecto Físico" value={product.organoleptical.appearance} />
            <DataRow label="Cor" value={product.organoleptical.color} />
            <DataRow label="Aroma" value={product.organoleptical.aroma} />
            <DataRow label="Formato" value={product.organoleptical.format} />
            <DataRow label="Textura" value={product.organoleptical.texture} />
            <DataRow label="Método de Análise" value={product.organoleptical.analysis_method} />
          </div>
        )}

        {/* -------- FÍSICO-QUÍMICO -------- */}
        {activeTab === 'fisicoquimico' && (
          <div className="space-y-4">
            <div className="card space-y-0">
              <p className="text-xs font-semibold text-slate-400 mb-3">
                Limites de Qualidade — Método: {product.physicochemical.analysis_method}
              </p>
              <DataRow label="Castanhas com defeito (máx.)" value={`${product.physicochemical.max_defective_units_pct}%`} />
              <DataRow label="Castanhas quebradas (máx.)" value={`${product.physicochemical.max_broken_units_pct}%`} />
              <DataRow label="Castanhas rançosas (máx.)" value={`${product.physicochemical.max_rancid_units_pct}%`} highlight />
            </div>

            <div className="space-y-2">
              <h4 className="section-title flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-brand-400" />
                Tolerância de Aflatoxina por País
              </h4>
              <p className="text-xs text-slate-400">
                A tolerância varia por mercado destino. Valores em ppb (partes por bilhão).
                Análise por laboratório credenciado pelo MAPA obrigatória antes do embarque.
              </p>
              <AflatoxinTable tolerances={product.physicochemical.aflatoxin_tolerance_by_country} />
            </div>
          </div>
        )}

        {/* -------- NUTRICIONAL -------- */}
        {activeTab === 'nutricional' && (
          <div className="card max-w-sm">
            <div className="text-center mb-4">
              <h4 className="font-display font-bold text-white text-base">Informação Nutricional</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Porção de {product.nutritional.serving_size_g}g
              </p>
            </div>
            <div className="border-t-4 border-slate-200 pt-3 space-y-0">
              <DataRow label="Valor energético" value={`${product.nutritional.calories_kcal} kcal`} highlight />
              <DataRow label="Gorduras totais" value={`${product.nutritional.total_fat_g} g`} />
              <DataRow label="Gorduras saturadas" value={`${product.nutritional.saturated_fat_g} g`} />
              <DataRow label="Sódio" value={`${product.nutritional.sodium_mg} mg`} />
              <DataRow label="Carboidratos totais" value={`${product.nutritional.total_carbs_g} g`} />
              <DataRow label="Fibra alimentar" value={`${product.nutritional.dietary_fiber_g} g`} />
              <DataRow label="Proteínas" value={`${product.nutritional.proteins_g} g`} />
              {product.nutritional.selenium_mcg && (
                <DataRow label="Selênio" value={`${product.nutritional.selenium_mcg} mcg`} highlight />
              )}
            </div>
            {product.nutritional.selenium_mcg && (
              <p className="text-xs text-amber-400/80 mt-3 italic">
                ⚠️ Uma porção de 30g pode fornecer até {Math.round((product.nutritional.selenium_mcg / 400) * 100)}% da IDR de Selênio.
              </p>
            )}
          </div>
        )}

        {/* -------- EXIGÊNCIAS LEGAIS -------- */}
        {activeTab === 'exigencias' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <div>
                <h4 className="section-title">Exigências Legais por País Destino</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecione o país do importador para ver os documentos necessários.
                </p>
              </div>
            </div>
            {product.legal_requirements.length > 0 ? (
              <LegalRequirementsPanel requirements={product.legal_requirements} />
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma exigência legal cadastrada.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
