// catalog-service — produtos e ofertas (busca/filtros/paginação).
// Seed alinhado com o mock do frontend (src/mock/data.json) para migração suave.
const express = require('express')
const PORT = 4002

const products = [
  { id: 'prod_001', name: 'Castanha-do-Brasil Crua In Natura', description: 'Colhida de florestas nativas do Amazonas.', category: 'Oleaginosas', packaging: 'Sacos 25kg', images: [] },
]

const offers = [
  { id: 'off_001', product: products[0], exporter: { id: 'usr_001', company_name: 'Castanheira Export Ltda.', country: 'BR', rating: 4.7, mapa_registered: false }, available_quantity_kg: 20000, price_per_kg_usd: 4.85, incoterm: 'FOB', origin_port: 'Porto de Belém (PA)', destination_ports: ['Hamburg', 'Rotterdam'], delivery_days: 30, harvest_year: 2025, sale_modality: 'SPOT', status: 'ATIVA' },
  { id: 'off_003', product: { ...products[0], name: 'Castanha-do-Brasil Premium - Orgânica Fair Trade' }, exporter: { id: 'usr_002', company_name: 'AmazonNuts Export S.A.', country: 'BR', rating: 4.9, mapa_registered: true }, available_quantity_kg: 80000, price_per_kg_usd: 5.80, incoterm: 'CIF', origin_port: 'Porto de Santos (SP)', destination_ports: ['Rotterdam', 'Hamburg'], delivery_days: 28, harvest_year: 2025, sale_modality: 'CONTRATO_LONGO_PRAZO', status: 'ATIVA' },
]

const app = express()
app.use(express.json())
app.get('/health', (_req, res) => res.json({ ok: true, service: 'catalog-service' }))

app.get('/products', (_req, res) => res.json({ data: products, total: products.length, page: 1, limit: 20, total_pages: 1 }))
app.get('/products/:id', (req, res) => {
  const p = products.find((x) => x.id === req.params.id)
  return p ? res.json(p) : res.status(404).json({ error: { code: 'PRODUCT_NOT_FOUND' } })
})

app.get('/offers', (req, res) => {
  const { q, incoterm, origin_port } = req.query
  let data = offers
  if (q) data = data.filter((o) => `${o.product.name} ${o.product.description}`.toLowerCase().includes(String(q).toLowerCase()))
  if (incoterm) data = data.filter((o) => o.incoterm === incoterm)
  if (origin_port) data = data.filter((o) => o.origin_port === origin_port)
  res.json({ data, total: data.length, page: 1, limit: 20, total_pages: 1 })
})
app.get('/offers/:id', (req, res) => {
  const o = offers.find((x) => x.id === req.params.id)
  return o ? res.json(o) : res.status(404).json({ error: { code: 'OFFER_NOT_FOUND' } })
})
app.post('/offers', (req, res) => {
  const o = { id: `off_${Date.now()}`, status: 'ATIVA', ...req.body }
  offers.push(o)
  res.status(201).json(o)
})

app.listen(PORT, () => console.log(`catalog-service on :${PORT}`))
