import { getOffer, getProduct } from '@/lib/api'
import { FichaTecnica } from '@/components/ficha-tecnica/FichaTecnica'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Ship, Calendar, MessageSquare, AlertTriangle } from 'lucide-react'
import { formatNumber, incotermLabel } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

interface Props { params: { id: string } }

export default async function OfertaDetailPage({ params }: Props) {
  let offer
  try {
    offer = await getOffer(params.id)
  } catch {
    notFound()
  }

  const product = await getProduct(offer.product.id)
  const t = await getTranslations('vitrine')

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/vitrine" className="btn-ghost text-sm">
        <ArrowLeft className="w-4 h-4" /> {t('backToShowcase')}
      </Link>

      {/* Header da oferta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h1 className="page-title mb-1">{product.name}</h1>
            <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>

            {/* Exportador */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/40">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                <span className="text-brand-300 font-bold text-sm">
                  {offer.exporter.company_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{offer.exporter.company_name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Star className="w-3 h-3 text-brand-400 fill-brand-400" />
                  <span>{offer.exporter.rating}</span>
                  <span>•</span>
                  <MapPin className="w-3 h-3" />
                  <span>{offer.exporter.country}</span>
                </div>
              </div>
              {!offer.exporter.mapa_registered && (
                <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('exporterNoMapa')}
                </div>
              )}
            </div>
          </div>

          {/* Ficha Técnica */}
          <div>
            <h2 className="section-title mb-4">{t('techSheet')}</h2>
            <FichaTecnica product={product} />
          </div>
        </div>

        {/* Painel lateral de negociação */}
        <div className="space-y-4">
          <div className="card space-y-3 sticky top-6">
            <h3 className="section-title">{t('offerDetails')}</h3>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-xs text-slate-400">{t('priceKgLabel')}</span>
                <span className="text-lg font-display font-bold text-brand-300">USD {offer.price_per_kg_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('availableQtyLabel')}</span>
                <span className="text-slate-200 font-medium">{formatNumber(offer.available_quantity_kg)} kg</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('modalityLabel')}</span>
                <span className="text-slate-200 font-medium">{incotermLabel(offer.incoterm)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('originPortLabel')}</span>
                <span className="text-slate-200 font-medium flex items-center gap-1">
                  <Ship className="w-3 h-3 text-blue-400" /> {offer.origin_port}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('deliveryLabel')}</span>
                <span className="text-slate-200 font-medium">{offer.delivery_days} dias</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('harvestLabel')}</span>
                <span className="text-slate-200 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-brand-400" /> {offer.harvest_year}
                </span>
              </div>
              <div className="flex items-start justify-between text-xs">
                <span className="text-slate-400">{t('destPortsLabel')}</span>
                <div className="text-right space-y-0.5">
                  {offer.destination_ports.map((p) => (
                    <p key={p} className="text-slate-200">{p}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Total estimado */}
            <div className="bg-brand-500/10 border border-brand-500/20 px-3 py-2.5">
              <p className="text-xs text-slate-400 mb-0.5">{t('estimatedTotal')}</p>
              <p className="font-display font-bold text-white text-lg">
                USD {formatNumber(offer.available_quantity_kg * offer.price_per_kg_usd)}
              </p>
            </div>

            <Link
              href={`/negociacao/nova?offer=${offer.id}`}
              className="btn-primary w-full justify-center"
            >
              <MessageSquare className="w-4 h-4" /> {t('startNegotiation')}
            </Link>
            <p className="text-xs text-slate-500 text-center">
              {t('negotiationNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
