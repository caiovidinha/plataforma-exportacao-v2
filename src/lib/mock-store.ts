// Motor de estado mock - único lugar que "escreve" no mock da plataforma.
// Segue o mesmo padrão de src/lib/mock-session.ts (Zustand + persist em
// localStorage), mas guarda os dados de negócio (orders/workflows) em vez
// da sessão do usuário. Sem isso, ações como aceitar pedido ou emitir NF
// só existiam em useState local e se perdiam ao trocar de página/reload.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import mockData from '@/mock/data.json'
import type {
  Order,
  OrderStatus,
  ExportWorkflow,
  WorkflowStage,
  WorkflowStageDefinition,
  WorkflowDocument,
  DocumentType,
  PartnerActivityEvent,
  PartnerType,
  PartnerActivityStatus,
  OrderSimulationSummary,
  Incoterm,
} from '@/types'

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ---- Template de etapas para workflows criados dinamicamente -----
// (quando um pedido é confirmado e ainda não existe um ExportWorkflow
// pré-semeado no mock para ele)
function buildStageTemplate(incoterm: Incoterm): WorkflowStageDefinition[] {
  const stageOrder: WorkflowStage[] = [
    'CADASTRO',
    'NEGOCIO',
    'MERCADORIA_PRONTA',
    'MERCADORIA_PORTO',
    'MERCADORIA_LIBERADA',
    'PAGAMENTO',
  ]

  const meta: Record<WorkflowStage, { title: string; description: string; partners: PartnerType[] }> = {
    CADASTRO: {
      title: 'Cadastro',
      description: 'Contrato com a plataforma, análise de risco e cálculo de estimativa de rota de frete concluídos no cadastro.',
      partners: ['JURIDICO', 'CORRETORA_CAMBIO'],
    },
    NEGOCIO: {
      title: 'Negócio',
      description: `Geração e assinatura dos contratos de exportação, seguro, frete (${incoterm}) e serviço de despachante.`,
      partners: ['JURIDICO', 'SEGURADORA', 'CIA_NAVEGACAO', 'DESPACHANTE'],
    },
    MERCADORIA_PRONTA: {
      title: 'Mercadoria Pronta',
      description: 'Emissão da nota fiscal, coleta e entrega no porto, início da emissão dos documentos e alinhamento com o despachante antes de lacrar.',
      partners: ['LOGISTICA', 'DESPACHANTE'],
    },
    MERCADORIA_PORTO: {
      title: 'Mercadoria no Porto',
      description: 'Solicitação de fiscalização do MAPA, certificado aduaneiro e espaço no navio. Certificação e teste de aflatoxina.',
      partners: ['DESPACHANTE', 'CERTIFICADORA', 'LABORATORIO', 'CIA_NAVEGACAO'],
    },
    MERCADORIA_LIBERADA: {
      title: 'Mercadoria Liberada',
      description: 'Colocação da mercadoria no navio, emissão do BL, contrato de câmbio e liberação do pagamento.',
      partners: ['CIA_NAVEGACAO', 'DESPACHANTE', 'CORRETORA_CAMBIO', 'JURIDICO'],
    },
    PAGAMENTO: {
      title: 'Pagamento',
      description: 'Recebimento confirmado via SWIFT e liquidação do câmbio.',
      partners: ['CORRETORA_CAMBIO'],
    },
    MERCADORIA_RECUSADA: {
      title: 'Mercadoria Recusada',
      description: 'Importador recusou a mercadoria na inspeção final. Quebra de contrato acionada; cobertura de seguro em análise.',
      partners: ['JURIDICO', 'SEGURADORA'],
    },
  }

  const docsByStage: Partial<Record<WorkflowStage, Pick<WorkflowDocument, 'type' | 'name'>[]>> = {
    NEGOCIO: [
      { type: 'OUTROS', name: 'Contrato de Exportação' },
      { type: 'OUTROS', name: 'Contrato de Seguro de Carga' },
    ],
    MERCADORIA_PRONTA: [
      { type: 'NF', name: 'Nota Fiscal' },
      { type: 'INVOICE', name: 'Invoice Comercial' },
      { type: 'PACKING_LIST', name: 'Packing List' },
    ],
    MERCADORIA_PORTO: [
      { type: 'CERT_ORIGEM', name: 'Certificado de Origem Form A' },
      { type: 'LAUDO_LAB', name: 'Laudo Laboratorial - Aflatoxina' },
    ],
    MERCADORIA_LIBERADA: [{ type: 'BL', name: 'Bill of Lading' }],
    PAGAMENTO: [{ type: 'SWIFT', name: 'Comprovante SWIFT' }],
  }

  const today = new Date()

  return stageOrder.map((stage, i) => {
    const planned = new Date(today)
    planned.setDate(planned.getDate() + i * 12)
    const isFirst = i === 0
    return {
      id: genId('stg'),
      stage,
      title: meta[stage].title,
      description: meta[stage].description,
      responsible_partners: meta[stage].partners,
      status: isFirst ? 'CONCLUIDO' : i === 1 ? 'EM_ANDAMENTO' : 'PENDENTE',
      planned_date: planned.toISOString().slice(0, 10),
      actual_date: isFirst ? todayISODate() : undefined,
      documents: (docsByStage[stage] ?? []).map((d) => ({
        id: genId('doc'),
        type: d.type as DocumentType,
        name: d.name,
        status: 'PENDENTE',
      })),
    }
  })
}

interface MockStoreState {
  orders: Order[]
  workflows: ExportWorkflow[]

  // ---- Seletores ----
  getOrder: (id: string) => Order | undefined
  getWorkflow: (id: string) => ExportWorkflow | undefined
  getWorkflowByOrderId: (orderId: string) => ExportWorkflow | undefined

  // ---- Actions ----
  confirmOrder: (orderId: string) => void
  rejectOrder: (orderId: string) => void
  advanceStage: (workflowId: string) => void
  rejectAtInspection: (workflowId: string, motivo: string) => void
  emitDocument: (
    workflowId: string,
    stageId: string,
    doc: { type: DocumentType; name: string; emittedBy: string },
  ) => void
  logPartnerActivity: (
    workflowId: string,
    event: { partner: PartnerType; stage: WorkflowStage; message: string; status?: PartnerActivityStatus },
  ) => void
  attachSimulation: (orderId: string, summary: OrderSimulationSummary) => void
  /** Zera pedidos/workflows de volta ao estado original do mock - usado
   * para reiniciar o fluxo antes de repetir uma demonstração. */
  resetAll: () => void
}

export const useMockStore = create<MockStoreState>()(
  persist(
    (set, get) => ({
      orders: mockData.orders as Order[],
      workflows: mockData.workflows as unknown as ExportWorkflow[],

      getOrder: (id) => get().orders.find((o) => o.id === id),
      getWorkflow: (id) => get().workflows.find((w) => w.id === id),
      getWorkflowByOrderId: (orderId) => get().workflows.find((w) => w.order_id === orderId),

      confirmOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'CONFIRMADO' as OrderStatus, confirmed_at: new Date().toISOString() }
              : o,
          ),
        }))

        const existingWorkflow = get().workflows.find((w) => w.order_id === orderId)
        if (existingWorkflow) return

        const newWorkflow: ExportWorkflow = {
          id: genId('wf'),
          order_id: order.id,
          order: {
            product_name: order.product_name,
            quantity_kg: order.quantity_kg,
            incoterm: order.incoterm,
            origin_port: order.origin_port,
            destination_port: order.destination_port,
          },
          exporter: order.exporter,
          importer: order.importer,
          incoterm: order.incoterm,
          overall_status: 'EM_ANDAMENTO',
          current_stage: 'NEGOCIO',
          created_at: new Date().toISOString(),
          estimated_completion: (() => {
            const d = new Date()
            d.setDate(d.getDate() + 70)
            return d.toISOString().slice(0, 10)
          })(),
          stages: buildStageTemplate(order.incoterm),
          activity_log: [],
        }

        set((state) => ({ workflows: [...state.workflows, newWorkflow] }))
      },

      rejectOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'RECUSADO' as OrderStatus } : o,
          ),
        }))
      },

      advanceStage: (workflowId) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w
            const idx = w.stages.findIndex((s) => s.stage === w.current_stage)
            if (idx === -1) return w

            const stages = w.stages.map((s, i) =>
              i === idx ? { ...s, status: 'CONCLUIDO' as const, actual_date: todayISODate() } : s,
            )

            const next = stages[idx + 1]
            if (!next) {
              return { ...w, stages, overall_status: 'CONCLUIDO' as const }
            }

            stages[idx + 1] = { ...next, status: 'EM_ANDAMENTO' as const }
            return { ...w, stages, current_stage: next.stage }
          }),
        }))
      },

      rejectAtInspection: (workflowId, motivo) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w
            const rejectedStage: WorkflowStageDefinition = {
              id: genId('stg'),
              stage: 'MERCADORIA_RECUSADA',
              title: 'Mercadoria Recusada',
              description: 'Importador recusou a mercadoria na inspeção final. Quebra de contrato acionada; cobertura de seguro em análise.',
              responsible_partners: ['JURIDICO', 'SEGURADORA'],
              status: 'CONCLUIDO',
              planned_date: todayISODate(),
              actual_date: todayISODate(),
              documents: [],
              notes: motivo,
            }
            return {
              ...w,
              stages: [...w.stages, rejectedStage],
              current_stage: 'MERCADORIA_RECUSADA',
              overall_status: 'CANCELADO',
            }
          }),
        }))
      },

      emitDocument: (workflowId, stageId, doc) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w
            return {
              ...w,
              stages: w.stages.map((s) => {
                if (s.id !== stageId) return s
                const existing = s.documents.find((d) => d.type === doc.type)
                const emittedDoc: WorkflowDocument = {
                  id: existing?.id ?? genId('doc'),
                  type: doc.type,
                  name: doc.name,
                  status: 'EMITIDO',
                  url: '/mock-doc.pdf',
                  emitted_by: doc.emittedBy,
                  emitted_at: new Date().toISOString(),
                }
                const documents = existing
                  ? s.documents.map((d) => (d.type === doc.type ? emittedDoc : d))
                  : [...s.documents, emittedDoc]
                return { ...s, documents }
              }),
            }
          }),
        }))
      },

      logPartnerActivity: (workflowId, event) => {
        const entry: PartnerActivityEvent = {
          id: genId('act'),
          partner: event.partner,
          stage: event.stage,
          message: event.message,
          at: new Date().toISOString(),
          status: event.status ?? 'INFO',
        }
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === workflowId ? { ...w, activity_log: [...(w.activity_log ?? []), entry] } : w,
          ),
        }))
      },

      attachSimulation: (orderId, summary) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, simulation_summary: summary } : o)),
        }))
      },

      resetAll: () => {
        set({
          orders: mockData.orders as Order[],
          workflows: mockData.workflows as unknown as ExportWorkflow[],
        })
      },
    }),
    {
      name: 'castanha-mock-store',
      // Hidrata manualmente (via StoreHydrator) depois do primeiro paint,
      // para o HTML do cliente bater com o do servidor (que sempre usa o
      // mock "de fábrica"). Sem isso, qualquer progresso salvo em sessões
      // anteriores causa erro de hidratação do React.
      skipHydration: true,
    },
  ),
)
