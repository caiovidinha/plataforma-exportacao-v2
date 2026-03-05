import { getNegotiation, getMe } from '@/lib/api'
import { NegotiationChat } from '@/components/negociacao/NegotiationChat'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface Props { params: { id: string } }

export default async function NegociacaoDetailPage({ params }: Props) {
  let negotiation
  try {
    negotiation = await getNegotiation(params.id)
  } catch {
    notFound()
  }
  const user = await getMe()
  const t = await getTranslations('negociacao')

  return (
    <div className="p-6 space-y-4">
      <Link href="/negociacao" className="btn-ghost">
        <ArrowLeft className="w-4 h-4" /> {t('backBtn')}
      </Link>
      <h1 className="page-title">{t('dealTitle', { product: negotiation.deal.product_name })}</h1>
      <NegotiationChat negotiation={negotiation} currentUserId={user.id} />
    </div>
  )
}
