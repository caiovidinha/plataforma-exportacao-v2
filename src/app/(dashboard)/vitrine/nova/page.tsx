'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, PackagePlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getProducts, createOffer } from '@/lib/api'
import type { Product, Incoterm, SaleModality } from '@/types'

export default function NovaOfertaPage() {
  const t = useTranslations('vitrineNova')
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState<number>(10000)
  const [price, setPrice] = useState<number>(4.8)
  const [incoterm, setIncoterm] = useState<Incoterm>('FOB')
  const [originPort, setOriginPort] = useState('Porto de Belém (PA)')
  const [destPorts, setDestPorts] = useState('Rotterdam, Hamburg')
  const [deliveryDays, setDeliveryDays] = useState<number>(30)
  const [harvest, setHarvest] = useState<number>(new Date().getFullYear())
  const [modality, setModality] = useState<SaleModality>('SPOT')

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getProducts().then((res) => {
      setProducts(res.data)
      if (res.data[0]) setProductId(res.data[0].id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !productId) return
    setSubmitting(true)
    try {
      await createOffer({
        product_id: productId,
        available_quantity_kg: quantity,
        price_per_kg_usd: price,
        incoterm,
        origin_port: originPort,
        destination_ports: destPorts.split(',').map((p) => p.trim()).filter(Boolean),
        delivery_days: deliveryDays,
        harvest_year: harvest,
        sale_modality: modality,
      })
      setDone(true)
      setTimeout(() => router.push('/vitrine'), 800)
    } finally {
      setSubmitting(false)
    }
  }

  const field = 'input w-full'
  const labelCls = 'text-xs text-[#584531]/80 mb-1 block'

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Link href="/vitrine" className="btn-ghost text-sm">
        <ArrowLeft className="w-4 h-4" /> {t('back')}
      </Link>

      <div>
        <h1 className="page-title flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-[#584531]" /> {t('pageTitle')}
        </h1>
        <p className="text-sm text-[#584531] mt-1">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className={labelCls}>{t('product')}</label>
          <select className={field} value={productId} onChange={(e) => setProductId(e.target.value)} required>
            {products.length === 0 && <option value="">…</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('quantity')}</label>
            <input type="number" min={1} className={field} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>
          <div>
            <label className={labelCls}>{t('price')}</label>
            <input type="number" min={0} step="0.01" className={field} value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('incoterm')}</label>
            <select className={field} value={incoterm} onChange={(e) => setIncoterm(e.target.value as Incoterm)}>
              <option value="FOB">FOB</option>
              <option value="CIF">CIF</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{t('modality')}</label>
            <select className={field} value={modality} onChange={(e) => setModality(e.target.value as SaleModality)}>
              <option value="SPOT">{t('modalitySpot')}</option>
              <option value="CONTRATO_LONGO_PRAZO">{t('modalityLongTerm')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>{t('originPort')}</label>
          <input className={field} value={originPort} onChange={(e) => setOriginPort(e.target.value)} required />
        </div>

        <div>
          <label className={labelCls}>{t('destPorts')}</label>
          <input className={field} value={destPorts} onChange={(e) => setDestPorts(e.target.value)} placeholder="Rotterdam, Hamburg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('deliveryDays')}</label>
            <input type="number" min={1} className={field} value={deliveryDays} onChange={(e) => setDeliveryDays(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>{t('harvest')}</label>
            <input type="number" className={field} value={harvest} onChange={(e) => setHarvest(Number(e.target.value))} />
          </div>
        </div>

        <button type="submit" disabled={submitting || done} className="btn-primary w-full justify-center disabled:opacity-60">
          {done ? (
            <><CheckCircle2 className="w-4 h-4" /> {t('published')}</>
          ) : submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {t('publishing')}</>
          ) : (
            <><PackagePlus className="w-4 h-4" /> {t('publish')}</>
          )}
        </button>
      </form>
    </div>
  )
}
