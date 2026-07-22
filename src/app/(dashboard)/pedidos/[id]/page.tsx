import { getOrder } from '@/lib/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PedidoDetailClient } from './PedidoDetailClient'

interface Props { params: { id: string } }

export default async function PedidoDetailPage({ params }: Props) {
  let order
  try {
    order = await getOrder(params.id)
  } catch {
    notFound()
  }
  const t = await getTranslations('pedidos')

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <Link href="/pedidos" className="btn-ghost">
        <ArrowLeft className="w-4 h-4" /> {t('backBtn')}
      </Link>
      <h1 className="page-title">{t('dealTitle', { product: order.product_name })}</h1>
      <PedidoDetailClient order={order} />
    </div>
  )
}
