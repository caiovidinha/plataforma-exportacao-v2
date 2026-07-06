// order-service — pedidos a preço fixo + confirmação do exportador.
// Emite order.created / order.confirmed / order.rejected no tópico "orders".
const express = require('express')
const fetch = require('node-fetch')
const { makeProducer } = require('../../shared/kafka')
const { EVENTS } = require('../../shared/events')

const PORT = 4003
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:4002'

// Armazenamento em memória (Fase 1; troca por Postgres depois).
const orders = new Map()
let seq = 100

async function main() {
  const producer = await makeProducer('order-service')
  const app = express()
  app.use(express.json())

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'order-service' }))

  app.get('/orders', (_req, res) => res.json([...orders.values()]))
  app.get('/orders/:id', (req, res) => {
    const o = orders.get(req.params.id)
    return o ? res.json(o) : res.status(404).json({ error: { code: 'ORDER_NOT_FOUND' } })
  })

  // Cria um pedido a partir de uma oferta (preço fixo, sem barganha).
  app.post('/orders', async (req, res) => {
    const { offer_id, importer_id, quantity_kg } = req.body || {}
    if (!offer_id || !quantity_kg) {
      return res.status(422).json({ error: { code: 'INVALID_ORDER', message: 'offer_id e quantity_kg são obrigatórios' } })
    }
    let offer
    try {
      const r = await fetch(`${CATALOG_URL}/offers/${offer_id}`)
      if (!r.ok) throw new Error('offer not found')
      offer = await r.json()
    } catch {
      return res.status(404).json({ error: { code: 'OFFER_NOT_FOUND' } })
    }
    const id = `ord_${++seq}`
    const order = {
      id,
      offer_id,
      product_id: offer.product.id,
      product_name: offer.product.name,
      exporter: offer.exporter,
      importer: { id: importer_id || 'imp_unknown' },
      quantity_kg,
      price_per_kg_usd: offer.price_per_kg_usd,
      total_usd: +(offer.price_per_kg_usd * quantity_kg).toFixed(2),
      incoterm: offer.incoterm,
      transport_mode: 'MARITIMO',
      origin_port: offer.origin_port,
      destination_port: offer.destination_ports?.[0] || '',
      payment_conditions: '30% adiantado, 70% contra apresentação do BL',
      delivery_days: offer.delivery_days,
      status: 'AGUARDANDO_CONFIRMACAO',
      created_at: new Date().toISOString(),
    }
    orders.set(id, order)
    await producer.publish(EVENTS.ORDER_CREATED, order, id)
    res.status(201).json(order)
  })

  // Exportador aceita → order.confirmed (workflow-service reage).
  app.post('/orders/:id/confirm', async (req, res) => {
    const o = orders.get(req.params.id)
    if (!o) return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND' } })
    o.status = 'CONFIRMADO'
    o.confirmed_at = new Date().toISOString()
    await producer.publish(EVENTS.ORDER_CONFIRMED, o, o.id)
    res.json(o)
  })

  // Exportador recusa → order.rejected.
  app.post('/orders/:id/reject', async (req, res) => {
    const o = orders.get(req.params.id)
    if (!o) return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND' } })
    o.status = 'RECUSADO'
    o.rejection_reason = req.body?.reason
    await producer.publish(EVENTS.ORDER_REJECTED, o, o.id)
    res.json(o)
  })

  app.listen(PORT, () => console.log(`order-service on :${PORT}`))
}

main().catch((e) => { console.error(e); process.exit(1) })
