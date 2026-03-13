import { getOffer } from '@/lib/api'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { StartNegotiationForm } from './StartNegotiationForm'

interface Props {
  searchParams: { offer?: string }
}

export const metadata = { title: 'Nova Negociação' }

export default async function NovaNegociacaoPage({ searchParams }: Props) {
  if (!searchParams.offer) redirect('/vitrine')

  let offer
  try {
    offer = await getOffer(searchParams.offer)
  } catch {
    notFound()
  }

  const t = await getTranslations('negociacao')

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <Link href={`/vitrine/${offer.id}`} className="btn-ghost text-sm">
        <ArrowLeft className="w-4 h-4" /> {t('backBtn')}
      </Link>

      <div>
        <h1 className="page-title">{t('novaPageTitle')}</h1>
        <p className="text-sm text-[#584531] mt-1">
          {t('novaFromOffer')}:{' '}
          <span className="text-[#3e2e1e] font-medium">{offer.product.name}</span>
        </p>
      </div>

      <StartNegotiationForm offer={offer} />
    </div>
  )
}
