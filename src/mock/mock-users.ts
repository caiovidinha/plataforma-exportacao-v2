import { EntitySlug } from '@/lib/entity-config'
import type { EntityMember } from '@/types'

// Shape of a mock user session - one pre-built profile per entity type
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
      { label: 'openOrders',        value: 3 },
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
      { label: 'openOrders',        value: 2 },
      { label: 'purchasesClosed',   value: 7, trend: 'this year' },
      { label: 'volumePurchased',   value: '42 ton' },
    ],
    team_members: [
      { id: 'tm_imp_01', name: 'Ingrid Müller', email: 'ingrid@naturalkern.de', entity_role: 'OPERATOR', joined_at: '2025-08-10', active: true },
    ],
  },
}
