import { getWorkflows } from '@/lib/api'
import { WorkflowListClient } from './WorkflowListClient'

export const metadata = { title: 'Workflow' }

export default async function WorkflowPage() {
  const workflows = await getWorkflows()
  return <WorkflowListClient initialWorkflows={workflows} />
}
