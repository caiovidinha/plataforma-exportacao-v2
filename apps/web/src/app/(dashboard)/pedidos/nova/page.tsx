import { getListing } from '@/lib/api'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { NovoPedidoForm } from './NovoPedidoForm'

interface Props {
  searchParams: { listing?: string }
}

export const metadata = { title: 'Novo Pedido' }

export default async function NovoPedidoPage({ searchParams }: Props) {
  if (!searchParams.listing) redirect('/vitrine')

  let listing
  try {
    listing = await getListing(searchParams.listing)
  } catch {
    notFound()
  }

  const t = await getTranslations('pedidos')

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <Link href={`/vitrine/${listing.id}`} className="btn-ghost text-sm">
        <ArrowLeft className="w-4 h-4" /> {t('backBtn')}
      </Link>

      <div>
        <h1 className="page-title">{t('novaPageTitle')}</h1>
        <p className="text-sm text-[#584531] mt-1">
          {t('novaFromListing')}:{' '}
          <span className="text-[#3e2e1e] font-medium">{listing.product.name}</span>
        </p>
      </div>

      <NovoPedidoForm listing={listing} />
    </div>
  )
}
