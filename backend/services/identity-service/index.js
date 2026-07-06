// identity-service — contas de exportador/importador e auth (stub Gov.br).
// Apenas estes dois papéis têm conta; os parceiros logísticos são fixos (partner-service).
const express = require('express')
const PORT = 4001

const users = [
  { id: 'usr_001', role: 'EXPORTADOR', company_name: 'Castanheira Export Ltda.', cnpj: '12.345.678/0001-90', country: 'BR', mapa_registered: false },
  { id: 'imp_002', role: 'IMPORTADOR', company_name: 'Selezione Nocci Srl', cnpj_or_tax_id: 'IT98765432101', country: 'IT' },
]

const app = express()
app.use(express.json())
app.get('/health', (_req, res) => res.json({ ok: true, service: 'identity-service' }))

// Stub: em produção, callback OAuth do Gov.br emite o JWT.
app.post('/auth/login', (req, res) => {
  const { user_id } = req.body || {}
  const user = users.find((u) => u.id === user_id) || users[0]
  res.json({ access_token: `stub.${user.id}.token`, user })
})
app.get('/users/me', (req, res) => {
  const id = (req.headers.authorization || '').split('.')[1]
  res.json(users.find((u) => u.id === id) || users[0])
})
app.listen(PORT, () => console.log(`identity-service on :${PORT}`))
