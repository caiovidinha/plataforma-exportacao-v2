// workflow-service — orquestra a exportação.
// Consome order.confirmed → cria ExportWorkflow (9 etapas) → emite workflow.started.
// Também é o ponto onde os eventos de customs.* / shipping.* (despachante/navegação)
// fazem as etapas avançarem (ver docs/api-despachante-navegacao.md).
const express = require('express')
const { makeProducer, subscribe } = require('../../shared/kafka')
const { EVENTS, TOPICS } = require('../../shared/events')

const PORT = 4004

const STEP_CODES = [
  'ASSINATURA_CONTRATOS',
  'EMISSAO_NF_ARMAZENAGEM',
  'ENTRADA_REDEX',
  'TERMINAL_PESAGEM_ESTUFAGEM',
  'FISCALIZACAO_MAPA',
  'CERTIFICADO_FITOSSANITARIO',
  'ENTRADA_SISCOMEX_DUE',
  'EMBARQUE_NAVIO_BL',
  'CHEGADA_PORTO_DESTINO',
]

const workflows = new Map()
let seq = 5000

function buildWorkflow(order) {
  const id = `wf_${++seq}`
  const steps = STEP_CODES.map((code, i) => ({
    id: `${id}_step_${i + 1}`,
    order: i + 1,
    code,
    status: i === 0 ? 'EM_ANDAMENTO' : 'PENDENTE',
    documents: [],
  }))
  return {
    id,
    contract_id: null,
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
    current_step_code: STEP_CODES[0],
    steps,
    created_at: new Date().toISOString(),
  }
}

async function main() {
  const producer = await makeProducer('workflow-service')

  // Reage aos eventos de pedido e de integração externa.
  await subscribe('workflow-service', 'workflow-service', [TOPICS.ORDERS, TOPICS.CUSTOMS, TOPICS.SHIPPING], async (type, data) => {
    if (type === EVENTS.ORDER_CONFIRMED) {
      const wf = buildWorkflow(data)
      workflows.set(wf.id, wf)
      await producer.publish(EVENTS.WORKFLOW_STARTED, wf, wf.id)
      console.log(`workflow ${wf.id} criado a partir do pedido ${data.id}`)
    }
    // Esqueleto: eventos do despachante/navegação avançam etapas.
    // Ex.: customs.due.registered → conclui ENTRADA_SISCOMEX_DUE;
    //      shipping.arrived → conclui CHEGADA_PORTO_DESTINO.
    if (type === EVENTS.CUSTOMS_DUE_REGISTERED || type === EVENTS.SHIPPING_ARRIVED) {
      const wf = [...workflows.values()].find((w) => w.order_id === data.order_id)
      if (wf) console.log(`(stub) ${type} recebido para workflow ${wf.id}`)
    }
  })

  const app = express()
  app.use(express.json())
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'workflow-service' }))
  app.get('/workflows', (_req, res) => res.json([...workflows.values()]))
  app.get('/workflows/:id', (req, res) => {
    const w = workflows.get(req.params.id)
    return w ? res.json(w) : res.status(404).json({ error: { code: 'WORKFLOW_NOT_FOUND' } })
  })
  app.listen(PORT, () => console.log(`workflow-service on :${PORT}`))
}

main().catch((e) => { console.error(e); process.exit(1) })
