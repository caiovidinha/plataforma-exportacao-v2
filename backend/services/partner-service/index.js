// partner-service — parceiros FIXOS da cadeia logística (contrato direto com a
// nossa empresa). Não são entidades cadastráveis pelo usuário; vêm deste seed.
// O workflow-service consome estes dados para preencher responsáveis por etapa.
const express = require('express')
const PORT = 4005

const PARTNERS = [
  { id: 'sp_001', type: 'TRANSPORTADORA', company_name: 'NorteLog Transportes Ltda.', country: 'BR', city: 'Belém', rating: 4.5, active: true },
  { id: 'sp_002', type: 'COMPANHIA_NAVEGACAO', company_name: 'Mediterranean Shipping Company (MSC)', country: 'CH', city: 'Genebra', ports_covered: ['BRBEL', 'BRSSZ', 'DEHAM', 'NLRTM'], rating: 4.8, active: true },
  { id: 'sp_003', type: 'DESPACHANTE', company_name: 'Parana Despachos Aduaneiros', country: 'BR', city: 'Belém', fixed_fee_brl: 2800, rating: 4.6, active: true },
  { id: 'sp_004', type: 'TERMINAL_ALFANDEGARIO', company_name: 'Tegma Terminal Belém', country: 'BR', city: 'Belém', ports_covered: ['BRBEL'], rating: 4.4, active: true },
  { id: 'sp_005', type: 'LABORATORIO', company_name: 'LabControl Análises Ltda.', country: 'BR', city: 'Belém', mapa_accredited: true, rating: 4.9, active: true },
  { id: 'sp_006', type: 'CORRETORA', company_name: 'BrasilFX Corretora de Câmbio', country: 'BR', city: 'São Paulo', currency_pairs: ['USD/BRL', 'EUR/BRL'], rating: 4.7, active: true },
  { id: 'sp_007', type: 'SEGURADORA', company_name: 'Bradesco Seguros S.A.', country: 'BR', city: 'São Paulo', rating: 4.6, active: true },
  { id: 'sp_008', type: 'CERTIFICADORA', company_name: 'Bureau Veritas Brasil', country: 'BR', city: 'Santos', rating: 4.8, active: true },
]

const app = express()
app.get('/health', (_req, res) => res.json({ ok: true, service: 'partner-service' }))
app.get('/partners', (req, res) => {
  const { type } = req.query
  res.json(type ? PARTNERS.filter((p) => p.type === type) : PARTNERS)
})
// alias compatível com o path esperado pelo frontend
app.get('/service-providers', (req, res) => {
  const { type } = req.query
  res.json(type ? PARTNERS.filter((p) => p.type === type) : PARTNERS)
})
app.listen(PORT, () => console.log(`partner-service on :${PORT}`))
