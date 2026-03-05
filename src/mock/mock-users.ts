import { EntitySlug } from '@/lib/entity-config'
import type { EntityMember } from '@/types'

// Shape of a mock user session — one pre-built profile per entity type
export interface MockUser {
  id: string
  name: string
  email: string
  company_name: string
  cnpj: string
  country: string
  mapa_registered: boolean
  entity_type: EntitySlug
  // Entity-specific extras shown in the UI
  city?: string
  role_label: string
  // Stats visible in entity-specific dashboards
  stats: {
    label: string
    value: string | number
    trend?: string
    icon?: string
    unit?: string
  }[]
  // Service contract mock data (for provider entities)
  service_contracts?: MockServiceContract[]
  // Other users who belong to the same entity/company account
  team_members?: EntityMember[]
}

export interface MockServiceContract {
  id: string
  workflow_id: string
  exporter: string
  importer: string
  description: string
  value_brl: number
  status: 'PENDENTE' | 'CONTRATADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'
  requested_at: string
  deadline: string
  // Convenience aliases used by UI pages
  service_type?: string
  requester_name?: string
  product_name?: string
}

export const MOCK_USERS: Record<EntitySlug, MockUser> = {
  exportador: {
    id: 'usr_exp_001',
    name: 'Carlos Mendonça',
    email: 'carlos@castanheiraexport.com.br',
    company_name: 'Castanheira Export Ltda.',
    cnpj: '12.345.678/0001-90',
    country: 'BR',
    city: 'Manaus, AM',
    mapa_registered: false,
    entity_type: 'exportador',
    role_label: 'Exporter',
    stats: [
      { label: 'activeWorkflows',   value: 2, trend: '+1 this month' },
      { label: 'listedOffers',      value: 4 },
      { label: 'openNegotiations',  value: 3 },
      { label: 'projectedRevenue',  value: 'USD 280k' },
    ],
    team_members: [
      { id: 'tm_exp_01', name: 'Mariana Souza',     email: 'mariana@castanheiraexport.com.br', entity_role: 'OPERATOR', joined_at: '2025-09-01', active: true },
      { id: 'tm_exp_02', name: 'Felipe Ramos',      email: 'felipe@castanheiraexport.com.br',  entity_role: 'VIEWER',   joined_at: '2025-10-15', active: true },
      { id: 'tm_exp_03', name: 'Priya Anand',       email: 'priya@castanheiraexport.com.br',   entity_role: 'VIEWER',   joined_at: '2026-01-20', active: false },
    ],
  },
  importador: {
    id: 'usr_imp_001',
    name: 'Klaus Weber',
    email: 'k.weber@naturalkern.de',
    company_name: 'NaturalKern GmbH',
    cnpj: 'DE 123 456 789',
    country: 'DE',
    city: 'Hamburg, Germany',
    mapa_registered: true,
    entity_type: 'importador',
    role_label: 'Importer',
    stats: [
      { label: 'activeInterests',   value: 3 },
      { label: 'openNegotiations',  value: 2 },
      { label: 'purchasesClosed',   value: 7, trend: 'this year' },
      { label: 'volumePurchased',   value: '42 ton' },
    ],
    team_members: [
      { id: 'tm_imp_01', name: 'Ingrid Müller', email: 'ingrid@naturalkern.de', entity_role: 'OPERATOR', joined_at: '2025-08-10', active: true },
    ],
  },
  transportadora: {
    id: 'usr_transp_001',
    name: 'Ana Figueiredo',
    email: 'ana@nortranslogistica.com.br',
    company_name: 'NorTrans Logística Ltda.',
    cnpj: '22.111.333/0001-44',
    country: 'BR',
    city: 'Belém, PA',
    mapa_registered: true,
    entity_type: 'transportadora',
    role_label: 'Transportadora',
    stats: [
      { label: 'activeContracts',      value: 3 },
      { label: 'completedDeliveries',  value: 18 },
      { label: 'monthlyRevenue',       value: 'R$ 34k' },
      { label: 'avgRating',            value: '4.7 ★' },
    ],
    service_contracts: [
      { id: 'sc_t1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Transporte rodoviário Manaus → Santos (12 ton)', value_brl: 8400, status: 'EM_ANDAMENTO', requested_at: '2025-11-01', deadline: '2025-11-18' },
      { id: 'sc_t2', workflow_id: 'wf_002', exporter: 'Cooperativa Amazônica', importer: 'BioNuts BV', description: 'Transporte rodoviário Porto Velho → Santos (8 ton)', value_brl: 6200, status: 'PENDENTE', requested_at: '2025-11-10', deadline: '2025-11-25' },
      { id: 'sc_t3', workflow_id: 'wf_003', exporter: 'ExportBrasil SA', importer: 'GreenCargo Ltd.', description: 'Transporte fluvial Belém → Itajaí (20 ton)', value_brl: 11500, status: 'CONCLUIDO', requested_at: '2025-10-05', deadline: '2025-10-22' },
    ],
  },
  'companhia-navegacao': {
    id: 'usr_nav_001',
    name: 'Roberto Maia',
    email: 'r.maia@atlanticlines.com.br',
    company_name: 'Atlantic Lines S.A.',
    cnpj: '33.222.444/0001-55',
    country: 'BR',
    city: 'Santos, SP',
    mapa_registered: true,
    entity_type: 'companhia-navegacao',
    role_label: 'Companhia de Navegação',
    stats: [
      { label: 'blsIssuedMonth',    value: 12 },
      { label: 'activeContracts',   value: 5 },
      { label: 'containersInRoute', value: 8 },
      { label: 'avgRating',         value: '4.8 ★' },
    ],
    service_contracts: [
      { id: 'sc_n1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Frete Santos → Rotterdam (1 × 20\' Dry)', value_brl: 12800, status: 'EM_ANDAMENTO', requested_at: '2025-11-05', deadline: '2025-12-10' },
      { id: 'sc_n2', workflow_id: 'wf_002', exporter: 'Cooperativa Amazônica', importer: 'BioNuts BV', description: 'Frete Santos → Hamburg (1 × 40\' Dry)', value_brl: 9400, status: 'CONTRATADO', requested_at: '2025-11-12', deadline: '2025-12-20' },
    ],
  },
  despachante: {
    id: 'usr_desp_001',
    name: 'Fernanda Oliveira',
    email: 'fernanda@aduanasantos.com.br',
    company_name: 'Alfândega Santos Despachos',
    cnpj: '44.333.555/0001-66',
    country: 'BR',
    city: 'Santos, SP',
    mapa_registered: true,
    entity_type: 'despachante',
    role_label: 'Despachante Aduaneiro',
    stats: [
      { label: 'activeProcesses',  value: 7 },
      { label: 'duesIssuedMonth',  value: 4 },
      { label: 'successRate',      value: '99.1%' },
      { label: 'monthlyRevenue',   value: 'R$ 21k' },
    ],
    service_contracts: [
      { id: 'sc_d1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Despacho aduaneiro Santos — REDEX + SISCOMEX', value_brl: 3200, status: 'EM_ANDAMENTO', requested_at: '2025-11-08', deadline: '2025-11-28' },
      { id: 'sc_d2', workflow_id: 'wf_002', exporter: 'Cooperativa Amazônica', importer: 'BioNuts BV', description: 'Despacho aduaneiro Santos — REDEX + SISCOMEX', value_brl: 3200, status: 'PENDENTE', requested_at: '2025-11-14', deadline: '2025-12-05' },
      { id: 'sc_d3', workflow_id: 'wf_004', exporter: 'NutriCast Exportações', importer: 'OrgaNut GmbH', description: 'Despacho aduaneiro Belém — REDEX', value_brl: 2800, status: 'CONCLUIDO', requested_at: '2025-10-01', deadline: '2025-10-20' },
    ],
  },
  corretora: {
    id: 'usr_corr_001',
    name: 'Marcelo Saraiva',
    email: 'marcelo@brasilcambio.com.br',
    company_name: 'Brasil Câmbio S.A.',
    cnpj: '55.444.666/0001-77',
    country: 'BR',
    city: 'São Paulo, SP',
    mapa_registered: true,
    entity_type: 'corretora',
    role_label: 'Corretora de Câmbio',
    stats: [
      { label: 'swiftsReceivedMonth', value: 9 },
      { label: 'volumeSettled',       value: 'USD 1.2M' },
      { label: 'activeContracts',     value: 4 },
      { label: 'avgSpread',           value: '0.85%' },
    ],
    service_contracts: [
      { id: 'sc_c1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Contrato de câmbio USD → BRL (USD 42.000)', value_brl: 2100, status: 'EM_ANDAMENTO', requested_at: '2025-11-02', deadline: '2025-12-15' },
      { id: 'sc_c2', workflow_id: 'wf_002', exporter: 'Cooperativa Amazônica', importer: 'BioNuts BV', description: 'Contrato de câmbio EUR → BRL (EUR 28.000)', value_brl: 1800, status: 'CONTRATADO', requested_at: '2025-11-13', deadline: '2025-12-22' },
    ],
  },
  terminal: {
    id: 'usr_term_001',
    name: 'Sônia Batista',
    email: 'sonia@nutrisantosterminal.com.br',
    company_name: 'NutriSantos Terminal Ltda.',
    cnpj: '66.555.777/0001-88',
    country: 'BR',
    city: 'Santos, SP',
    mapa_registered: true,
    entity_type: 'terminal',
    role_label: 'Terminal Alfandegário',
    stats: [
      { label: 'activeContainers',  value: 14 },
      { label: 'stuffingsMonth',    value: 6 },
      { label: 'mapaInspections',   value: 3 },
      { label: 'monthlyRevenue',    value: 'USD 7.2k' },
    ],
    service_contracts: [
      { id: 'sc_tm1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Armazenagem + estufagem 12 ton (REDEX Santos)', value_brl: 4400, status: 'EM_ANDAMENTO', requested_at: '2025-11-06', deadline: '2025-11-22' },
      { id: 'sc_tm2', workflow_id: 'wf_002', exporter: 'Cooperativa Amazônica', importer: 'BioNuts BV', description: 'Armazenagem + estufagem 8 ton (REDEX Santos)', value_brl: 3200, status: 'PENDENTE', requested_at: '2025-11-15', deadline: '2025-12-01' },
    ],
  },
  seguradora: {
    id: 'usr_seg_001',
    name: 'Patricia Duarte',
    email: 'pduarte@agricobrasil.com.br',
    company_name: 'AgriCo Seguros Brasil S.A.',
    cnpj: '77.666.888/0001-99',
    country: 'BR',
    city: 'Rio de Janeiro, RJ',
    mapa_registered: true,
    entity_type: 'seguradora',
    role_label: 'Seguradora',
    stats: [
      { label: 'activePolicies',      value: 11 },
      { label: 'openClaims',          value: 1 },
      { label: 'premiumIssuedMonth',  value: 'R$ 48k' },
      { label: 'activeContracts',     value: 5 },
    ],
    service_contracts: [
      { id: 'sc_sg1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Seguro de Carga Marítima (USD 42.000)', value_brl: 3360, status: 'CONTRATADO', requested_at: '2025-11-03', deadline: '2025-12-15' },
      { id: 'sc_sg2', workflow_id: 'wf_003', exporter: 'ExportBrasil SA', importer: 'GreenCargo Ltd.', description: 'Seguro Safra (500 ton castanha)', value_brl: 12000, status: 'EM_ANDAMENTO', requested_at: '2025-10-20', deadline: '2026-04-30' },
    ],
  },
  certificadora: {
    id: 'usr_cert_001',
    name: 'Rodrigo Lima',
    email: 'rlima@ibdcertifica.org.br',
    company_name: 'IBD Certificações Ltda.',
    cnpj: '88.777.999/0001-11',
    country: 'BR',
    city: 'Botucatu, SP',
    mapa_registered: true,
    entity_type: 'certificadora',
    role_label: 'Certificadora / Auditoria',
    stats: [
      { label: 'certsIssued',      value: 8 },
      { label: 'auditsInProgress', value: 3 },
      { label: 'activeContracts',  value: 4 },
      { label: 'avgIssuanceTime',  value: '4 dias' },
    ],
    service_contracts: [
      { id: 'sc_ce1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Certificado de Origem + Auditoria de Produto', value_brl: 2800, status: 'EM_ANDAMENTO', requested_at: '2025-11-07', deadline: '2025-11-18' },
      { id: 'sc_ce2', workflow_id: 'wf_002', exporter: 'Cooperativa Amazônica', importer: 'BioNuts BV', description: 'Certificação Orgânico IBD + Auditoria', value_brl: 4200, status: 'PENDENTE', requested_at: '2025-11-16', deadline: '2025-12-02' },
    ],
  },
  laboratorio: {
    id: 'usr_lab_001',
    name: 'Dr. Henrique Costa',
    email: 'hcosta@labanaliseamapa.com.br',
    company_name: 'LabAnálise MAPA RO',
    cnpj: '99.888.000/0001-22',
    country: 'BR',
    city: 'Porto Velho, RO',
    mapa_registered: true,
    entity_type: 'laboratorio',
    role_label: 'Laboratório Credenciado MAPA',
    stats: [
      { label: 'reportsIssuedMonth',  value: 23 },
      { label: 'analysesInProgress',  value: 5 },
      { label: 'avgTimeHours',        value: 36 },
      { label: 'activeContracts',     value: 3 },
    ],
    service_contracts: [
      { id: 'sc_lb1', workflow_id: 'wf_001', exporter: 'Castanheira Export Ltda.', importer: 'NaturalKern GmbH', description: 'Análise de Aflatoxina Total (B1+B2+G1+G2)', value_brl: 420, status: 'EM_ANDAMENTO', requested_at: '2025-11-09', deadline: '2025-11-13' },
      { id: 'sc_lb2', workflow_id: 'wf_002', exporter: 'Cooperativa Amazônica', importer: 'BioNuts BV', description: 'Análise de Aflatoxina + Umidade + Granulometria', value_brl: 680, status: 'PENDENTE', requested_at: '2025-11-17', deadline: '2025-11-22' },
      { id: 'sc_lb3', workflow_id: 'wf_004', exporter: 'NutriCast Exportações', importer: 'OrgaNut GmbH', description: 'Análise Aflatoxina + Metais Pesados + Pesticidas', value_brl: 1100, status: 'CONCLUIDO', requested_at: '2025-10-10', deadline: '2025-10-14' },
    ],
  },
}
