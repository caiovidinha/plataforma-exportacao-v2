import { getWorkflow } from '@/lib/api'
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface Props { params: { id: string } }

export default async function WorkflowDetailPage({ params }: Props) {
  let workflow
  try {
    workflow = await getWorkflow(params.id)
  } catch {
    notFound()
  }

  const t = await getTranslations('workflow')

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/workflow" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" /> {t('backBtn')}
        </Link>
        <h1 className="page-title">{t('trackingTitle')}</h1>
      </div>

      <WorkflowTimeline workflow={workflow} />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  return { title: `Workflow ${params.id}` }
}
