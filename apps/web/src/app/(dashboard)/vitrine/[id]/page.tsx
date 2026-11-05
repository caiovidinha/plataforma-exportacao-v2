import { getListing, getProduct, getExporterByCompanyName } from '@/lib/api'
import { FichaTecnica } from '@/components/ficha-tecnica/FichaTecnica'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Ship, Calendar, ShoppingCart, AlertTriangle, ChevronRight } from 'lucide-react'
import { formatNumber, incotermLabel } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

interface Props { params: { id: string } }

export default async function VitrineDetailPage({ params }: Props) {
  let listing
  try {
    listing = await getListing(params.id)
  } catch {
    notFound()
  }

  const product = await getProduct(listing.product.id)
  const exporter = await getExporterByCompanyName(listing.exporter.company_name)
  const t = await getTranslations('vitrine')

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/vitrine" className="btn-ghost text-sm">
        <ArrowLeft className="w-4 h-4" /> {t('backToShowcase')}
      </Link>

      {/* Header do anúncio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h1 className="page-title mb-1">{product.name}</h1>
            <p className="text-sm text-[#584531] leading-relaxed">{product.description}</p>

            {/* Exportador */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#3e2e1e]/15">
              <div className="w-10 h-10 bg-[#584531]/15 flex items-center justify-center">
                <span className="text-[#584531] font-bold text-sm">
                  {listing.exporter.company_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#3e2e1e]">{listing.exporter.company_name}</p>
                <div className="flex items-center gap-2 text-xs text-[#584531]">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{listing.exporter.rating}</span>
                  <span>•</span>
                  <MapPin className="w-3 h-3" />
                  <span>{listing.exporter.country}</span>
                </div>
              </div>
              {!listing.exporter.mapa_registered && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('exporterNoMapa')}
                </div>
              )}
              {exporter && (
                <Link
                  href={`/vitrine/empresa/${exporter.id}?from=${listing.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-[#584531] hover:text-[#3e2e1e] transition-colors ml-auto"
                >
                  {t('viewCompany')}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Ficha Técnica */}
          <div>
            <h2 className="section-title mb-4">{t('techSheet')}</h2>
            <FichaTecnica product={product} />
          </div>
        </div>

        {/* Painel lateral de compra */}
        <div className="space-y-4">
          <div className="card space-y-3 sticky top-6">
            <h3 className="section-title">{t('offerDetails')}</h3>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-2 border-b border-[#3e2e1e]/15">
                <span className="text-xs text-slate-400">{t('priceKgLabel')}</span>
                <span className="text-lg font-display font-bold text-[#3e2e1e]">USD {listing.price_per_kg_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
              <span className="text-[#584531]/70">{t('availableQtyLabel')}</span>
                <span className="text-[#3e2e1e] font-medium">{formatNumber(listing.available_quantity_kg)} kg</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#584531]/70">{t('modalityLabel')}</span>
                <span className="text-[#3e2e1e] font-medium">{incotermLabel(listing.incoterm)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#584531]/70">{t('originPortLabel')}</span>
                <span className="text-[#3e2e1e] font-medium flex items-center gap-1">
                  <Ship className="w-3 h-3 text-[#584531]" /> {listing.origin_port}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#584531]/70">{t('deliveryLabel')}</span>
                <span className="text-[#3e2e1e] font-medium">{listing.delivery_days} dias</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#584531]/70">{t('harvestLabel')}</span>
                <span className="text-[#3e2e1e] font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#584531]" /> {listing.harvest_year}
                </span>
              </div>
              <div className="flex items-start justify-between text-xs">
                <span className="text-[#584531]/70">{t('destPortsLabel')}</span>
                <div className="text-right space-y-0.5">
                  {listing.destination_ports.map((p) => (
                    <p key={p} className="text-[#3e2e1e]">{p}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Total estimado */}
            <div className="bg-[#584531]/10 border border-[#584531]/20 px-3 py-2.5">
              <p className="text-xs text-[#584531] mb-0.5">{t('estimatedTotal')}</p>
              <p className="font-display font-bold text-[#3e2e1e] text-lg">
                USD {formatNumber(listing.available_quantity_kg * listing.price_per_kg_usd)}
              </p>
            </div>

            <Link
              href={`/pedidos/nova?listing=${listing.id}`}
              className="btn-primary w-full justify-center"
            >
              <ShoppingCart className="w-4 h-4" /> {t('makeOrder')}
            </Link>
            <p className="text-xs text-[#584531]/60 text-center">
              {t('orderNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
