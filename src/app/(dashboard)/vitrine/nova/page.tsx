'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NovoAnuncioPage() {
  const t = useTranslations('vitrine')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState(20000)
  const [price, setPrice] = useState(4.85)
  const [incoterm, setIncoterm] = useState<'FOB' | 'CIF'>('FOB')
  const [originPort, setOriginPort] = useState('')
  const [destinationPorts, setDestinationPorts] = useState('')
  const [deliveryDays, setDeliveryDays] = useState(30)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    toast.success(t('newListingCreated'))
    router.push('/vitrine')
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <Link href="/vitrine" className="btn-ghost text-sm">
        <ArrowLeft className="w-4 h-4" /> {t('backToShowcase')}
      </Link>

      <div>
        <h1 className="page-title">{t('newOffer')}</h1>
        <p className="text-sm text-[#584531] mt-1">{t('newListingSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#584531]">{t('formProductName')}</label>
          <input className="input w-full" value={productName} onChange={(e) => setProductName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#584531]">{t('availableQty')}</label>
            <input type="number" className="input w-full" value={quantity} min={0} step={100}
              onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#584531]">{t('pricePerKg')}</label>
            <input type="number" className="input w-full" value={price} min={0} step={0.01}
              onChange={(e) => setPrice(Number(e.target.value))} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#584531]">{t('modalityLabel')}</label>
            <select className="input w-full" value={incoterm} onChange={(e) => setIncoterm(e.target.value as 'FOB' | 'CIF')}>
              <option value="FOB">FOB</option>
              <option value="CIF">CIF</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#584531]">{t('deliveryLabel')}</label>
            <input type="number" className="input w-full" value={deliveryDays} min={1}
              onChange={(e) => setDeliveryDays(Number(e.target.value))} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#584531]">{t('originPortLabel')}</label>
          <input className="input w-full" value={originPort} onChange={(e) => setOriginPort(e.target.value)} placeholder="Ex.: Porto de Belém (PA)" required />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#584531]">{t('destPortsLabel')}</label>
          <input className="input w-full" value={destinationPorts} onChange={(e) => setDestinationPorts(e.target.value)} placeholder="Ex.: Hamburg, Rotterdam" required />
        </div>

        <div className="flex gap-3 pt-1">
          <Link href="/vitrine" className="btn-ghost flex-1 justify-center">{t('cancelBtn')}</Link>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t('publishing')}</>) : t('publishBtn')}
          </button>
        </div>
      </form>
    </div>
  )
}
