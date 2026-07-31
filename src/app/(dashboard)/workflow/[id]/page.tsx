import { getWorkflow } from '@/lib/api'
import { WorkflowDetailClient } from './WorkflowDetailClient'

interface Props { params: { id: string } }

export default async function WorkflowDetailPage({ params }: Props) {
  let workflow = null
  try {
    workflow = await getWorkflow(params.id)
  } catch {
    // Pode ser um workflow criado dinamicamente (só existe no mock-store
    // local) - deixa o client component decidir se é 404 de verdade.
    workflow = null
  }

  return <WorkflowDetailClient workflowId={params.id} initialWorkflow={workflow} />
}

export async function generateMetadata({ params }: Props) {
  return { title: `Workflow ${params.id}` }
}
