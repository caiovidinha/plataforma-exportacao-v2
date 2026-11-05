import { getExporter } from '@/lib/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, MapPin, Building2, Globe, Mail, Phone,
  Award, ShieldCheck, Package, Users, TrendingUp, Calendar,
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'

interface Props { params: { id: string }; searchParams: { from?: string } }

export default async function EmpresaPage({ params, searchParams }: Props) {
  let exporter
  try {
    exporter = await getExporter(params.id)
  } catch {
    notFound()
  }

  const t = await getTranslations('vitrine')
  const backHref = searchParams.from ? `/vitrine/${searchParams.from}` : '/vitrine'

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back */}
      <Link href={backHref} className="btn-ghost text-sm">
        <ArrowLeft className="w-4 h-4" /> {searchParams.from ? t('companyBackToOffer') : t('backToShowcase')}
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-[#584531]/15 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-[#584531]" />
          </div>
          <div className="flex-1">
            <h1 className="page-title mb-0.5">{exporter.company_name}</h1>
            {exporter.city && exporter.state && (
              <p className="text-sm text-[#584531] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {exporter.city}, {exporter.state} — {exporter.country}
              </p>
            )}
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold',
            exporter.mapa_registered
              ? 'text-emerald-700 bg-emerald-700/10 border border-emerald-700/30'
              : 'text-amber-600 bg-amber-500/10 border border-amber-500/30'
          )}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {exporter.mapa_registered ? t('companyMapaYes') : t('companyMapaNo')}
          </div>
        </div>

        {/* Descrição */}
        {exporter.description && (
          <div className="mt-4 pt-4 border-t border-[#3e2e1e]/10">
            <p className="text-xs font-medium text-[#584531]/70 mb-1">{t('companyAbout')}</p>
            <p className="text-sm text-[#3e2e1e] leading-relaxed">{exporter.description}</p>
          </div>
        )}
      </div>

      {/* Grid de dados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CNPJ */}
        <div className="card">
          <p className="text-[10px] text-[#584531]/60 uppercase tracking-wide mb-1">{t('companyCnpj')}</p>
          <p className="text-sm font-semibold text-[#3e2e1e]">{exporter.cnpj}</p>
        </div>

        {/* Fundação */}
        {exporter.founded_year && (
          <div className="card">
            <p className="text-[10px] text-[#584531]/60 uppercase tracking-wide mb-1">{t('companyFounded')}</p>
            <p className="text-sm font-semibold text-[#3e2e1e] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#584531]" />
              {exporter.founded_year}
            </p>
          </div>
        )}

        {/* Funcionários */}
        {exporter.employees_range && (
          <div className="card">
            <p className="text-[10px] text-[#584531]/60 uppercase tracking-wide mb-1">{t('companyEmployees')}</p>
            <p className="text-sm font-semibold text-[#3e2e1e] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#584531]" />
              {exporter.employees_range}
            </p>
          </div>
        )}

        {/* Volume anual */}
        {exporter.annual_export_volume_tons && (
          <div className="card">
            <p className="text-[10px] text-[#584531]/60 uppercase tracking-wide mb-1">{t('companyAnnualVolume')}</p>
            <p className="text-sm font-semibold text-[#3e2e1e] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#584531]" />
              {formatNumber(exporter.annual_export_volume_tons)} {t('companyTons')}
            </p>
          </div>
        )}

        {/* MAPA */}
        <div className="card">
          <p className="text-[10px] text-[#584531]/60 uppercase tracking-wide mb-1">{t('companyMapaRegistered')}</p>
          <p className={cn('text-sm font-semibold flex items-center gap-1.5', exporter.mapa_registered ? 'text-emerald-700' : 'text-amber-600')}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {exporter.mapa_registered ? t('companyMapaYes') : t('companyMapaNo')}
          </p>
          {exporter.mapa_registration_code && (
            <p className="text-xs text-[#584531]/50 mt-0.5">{t('companyMapaCode')}: {exporter.mapa_registration_code}</p>
          )}
        </div>
      </div>

      {/* Produtos, Certificações, Destinos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Produtos principais */}
        {exporter.main_products && exporter.main_products.length > 0 && (
          <div className="card">
            <p className="text-xs font-medium text-[#584531]/70 mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> {t('companyMainProducts')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exporter.main_products.map(p => (
                <span key={p} className="badge text-[#3e2e1e] border-[#3e2e1e]/20 text-xs">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Certificações */}
        {exporter.certifications && exporter.certifications.length > 0 && (
          <div className="card">
            <p className="text-xs font-medium text-[#584531]/70 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> {t('companyCertifications')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exporter.certifications.map(c => (
                <span key={c} className="badge text-emerald-700 border-emerald-700/30 bg-emerald-700/5 text-xs">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Destinos principais */}
        {exporter.main_destinations && exporter.main_destinations.length > 0 && (
          <div className="card">
            <p className="text-xs font-medium text-[#584531]/70 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> {t('companyMainDestinations')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exporter.main_destinations.map(d => (
                <span key={d} className="badge text-[#584531] border-[#584531]/20 text-xs">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contato */}
      <div className="card">
        <p className="text-xs font-medium text-[#584531]/70 mb-3">{t('companyContact')}</p>
        <div className="flex flex-wrap gap-6 text-sm text-[#3e2e1e]">
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#584531]" />
            {exporter.contact_email}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#584531]" />
            {exporter.contact_phone}
          </span>
          {exporter.website && (
            <a href={exporter.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#584531] hover:underline">
              <Globe className="w-4 h-4" />
              {exporter.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
