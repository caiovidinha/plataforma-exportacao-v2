import { getWorkflow } from '@/lib/api'
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props { params: { id: string } }

export default async function WorkflowDetailPage({ params }: Props) {
  let workflow
  try {
    workflow = await getWorkflow(params.id)
  } catch {
    notFound()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/workflow" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="page-title">Rastreamento da Exportação</h1>
      </div>

      <WorkflowTimeline workflow={workflow} />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  return { title: `Workflow ${params.id}` }
}
