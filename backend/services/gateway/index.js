// gateway (BFF) — única superfície REST consumida pelo frontend Next.js.
// Encaminha para os serviços internos, seguindo os paths que src/lib/api.ts espera.
const express = require('express')
const fetch = require('node-fetch')
const PORT = 4000

const ROUTES = {
  IDENTITY: process.env.IDENTITY_URL || 'http://localhost:4001',
  CATALOG: process.env.CATALOG_URL || 'http://localhost:4002',
  ORDER: process.env.ORDER_URL || 'http://localhost:4003',
  WORKFLOW: process.env.WORKFLOW_URL || 'http://localhost:4004',
  PARTNER: process.env.PARTNER_URL || 'http://localhost:4005',
}

// Mapeia prefixo de path → serviço de destino.
const PREFIX = [
  ['/users', ROUTES.IDENTITY],
  ['/auth', ROUTES.IDENTITY],
  ['/products', ROUTES.CATALOG],
  ['/offers', ROUTES.CATALOG],
  ['/orders', ROUTES.ORDER],
  ['/workflows', ROUTES.WORKFLOW],
  ['/service-providers', ROUTES.PARTNER],
  ['/partners', ROUTES.PARTNER],
]

function resolveTarget(path) {
  const match = PREFIX.find(([p]) => path === p || path.startsWith(p + '/'))
  return match ? match[1] : null
}

const app = express()
app.use(express.json())
app.get('/health', (_req, res) => res.json({ ok: true, service: 'gateway' }))

// Proxy genérico.
app.use(async (req, res) => {
  const target = resolveTarget(req.path)
  if (!target) return res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: req.path } })
  try {
    const r = await fetch(target + req.originalUrl, {
      method: req.method,
      headers: { 'content-type': 'application/json', authorization: req.headers.authorization || '' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
    })
    const text = await r.text()
    res.status(r.status)
    res.set('content-type', r.headers.get('content-type') || 'application/json')
    res.send(text)
  } catch (err) {
    res.status(502).json({ error: { code: 'UPSTREAM_UNAVAILABLE', message: err.message } })
  }
})

app.listen(PORT, () => console.log(`gateway on :${PORT} → ${JSON.stringify(ROUTES)}`))
