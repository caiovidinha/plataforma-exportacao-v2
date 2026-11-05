'use client'
import { Alert, PageLoader } from '@/components/ui/primitives'
import { ProductForm } from '@/components/products/ProductForm'
import { useT } from '@/lib/i18n'
import { useGet } from '@/lib/query'
import type { ProductDto } from '@amazon-trade/shared'

export default function Page({ params }: { params: { id: string } }) {
  const t = useT()
  const { data, isLoading, isError } = useGet<ProductDto>(`/products/${params.id}`, { staleTime: 0 })
  if (isLoading) return <PageLoader />
  if (isError || !data) return <Alert tone="error">{t('common.notFound')}</Alert>
  return <ProductForm key={data.updatedAt} product={data} />
}
