'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline'
import { useMockStore } from '@/lib/mock-store'
import type { ExportWorkflow } from '@/types'

export function WorkflowDetailClient({
  workflowId,
  initialWorkflow,
}: {
  workflowId: string
  initialWorkflow: ExportWorkflow | null
}) {
  const t = useTranslations('workflow')

  // Workflows criados dinamicamente (ex.: ao aceitar um pedido) só existem
  // no mock-store local, guardado em localStorage - o server component não
  // os enxerga e teria chamado notFound() indevidamente. Aqui, se não veio
  // nada do servidor, aguardamos a hidratação do store antes de decidir se
  // é um 404 de verdade.
  const storeWorkflow = useMockStore((s) => s.getWorkflow(workflowId))
  // useMockStore.persist só existe no navegador (a middleware não consegue
  // acessar localStorage durante o SSR em Node.js) - acesso opcional aqui
  // porque este useState roda tanto no render do servidor quanto no cliente.
  const [hydrated, setHydrated] = useState(() => useMockStore.persist?.hasHydrated() ?? false)

  useEffect(() => {
    const unsub = useMockStore.persist.onFinishHydration(() => setHydrated(true))
    useMockStore.persist.rehydrate()
    return unsub
  }, [])

  const workflow = storeWorkflow ?? initialWorkflow ?? undefined

  if (!workflow) {
    if (!hydrated) {
      return (
        <div className="p-6">
          <p className="text-sm text-[#584531]">{t('loadingWorkflow')}</p>
        </div>
      )
    }
    return (
      <div className="p-6 space-y-4">
        <Link href="/workflow" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" /> {t('backBtn')}
        </Link>
        <div className="card text-center py-16">
          <p className="text-[#584531]">{t('workflowNotFound')}</p>
        </div>
      </div>
    )
  }

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
