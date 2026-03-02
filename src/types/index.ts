// ============================================================
// Tipos globais da Plataforma de Exportação v2
// ============================================================

// ---- Utilitários -------------------------------------------
export type Role = 'EXPORTADOR' | 'IMPORTADOR' | 'ADMIN'
export type Incoterm = 'FOB' | 'CIF'
export type TransportMode = 'MARITIMO' | 'AEREO'

// ---- Usuário / Perfil --------------------------------------
export interface UserProfile {
  id: string
  name: string
  email: string
  role: Role
  company_name: string
  cnpj: string
  country: string
  mapa_registered: boolean
  mapa_registration_code?: string
  created_at: string
  updated_at: string
}

// ---- Produto / Ficha Técnica --------------------------------
export interface AflatoxinTolerance {
  country_code: string
  country_name: string
  tolerance_ppb: number
}

export interface ProductOrganoleptic {
  appearance: string
  color: string
  aroma: string
  format: string
  texture: string
  analysis_method: string
}

export interface ProductPhysicochemical {
  aflatoxin_tolerance_by_country: AflatoxinTolerance[]
  max_defective_units_pct: number
  max_broken_units_pct: number
  max_rancid_units_pct: number
  analysis_method: string
}

export interface NutritionalInfo {
  serving_size_g: number
  calories_kcal: number
  total_fat_g: number
  saturated_fat_g: number
  sodium_mg: number
  total_carbs_g: number
  dietary_fiber_g: number
  proteins_g: number
  selenium_mcg?: number
}

export interface LegalDocument {
  type: 'FITOSSANITARIO' | 'ORIGEM' | 'HIGIENICO_SANITARIO' | 'MERCADO' | 'OUTROS'
  name: string
  required: boolean
  issuing_authority: string
  notes?: string
}

export interface LegalRequirement {
  country_code: string
  country_name: string
  documents: LegalDocument[]
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  packaging: string
  expiration_date?: string
  transport_modes: TransportMode[]
  organoleptical: ProductOrganoleptic
  physicochemical: ProductPhysicochemical
  nutritional: NutritionalInfo
  legal_requirements: LegalRequirement[]
  images: string[]
  certifications: string[]
  created_by: string
  created_at: string
  updated_at: string
}

// ---- Oferta / Match ----------------------------------------
export type OfferStatus = 'ATIVA' | 'NEGOCIANDO' | 'VENDIDA' | 'EXPIRADA'
export type SaleModality = 'SPOT' | 'CONTRATO_LONGO_PRAZO'

export interface OfferParty {
  id: string
  company_name: string
  country: string
  rating: number
  mapa_registered: boolean
}

export interface Offer {
  id: string
  product: Pick<Product, 'id' | 'name' | 'description' | 'images' | 'packaging'>
  exporter: OfferParty
  available_quantity_kg: number
  price_per_kg_usd: number
  incoterm: Incoterm
  origin_port: string
  destination_ports: string[]
  delivery_days: number
  harvest_year: number
  sale_modality: SaleModality
  status: OfferStatus
  created_at: string
  expires_at: string
}

export type MatchStatus = 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CONTRATADO'

export interface Match {
  id: string
  offer: Offer
  importer: OfferParty
  status: MatchStatus
  created_at: string
}

// ---- Negociação --------------------------------------------
export interface NegotiationMessage {
  id: string
  negotiation_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

export interface NegotiationDeal {
  product_id: string
  product_name: string
  quantity_kg: number
  price_per_kg_usd: number
  total_usd: number
  payment_conditions: string
  delivery_days: number
  delivery_deadline: string
  transport_mode: TransportMode
  incoterm: Incoterm
  origin_port: string
  destination_port: string
}

export type NegotiationStatus = 'ABERTA' | 'ACORDO_PENDENTE' | 'ACORDO_FECHADO' | 'CANCELADA'

export interface Negotiation {
  id: string
  match_id: string
  exporter: OfferParty
  importer: OfferParty
  deal: NegotiationDeal
  status: NegotiationStatus
  messages: NegotiationMessage[]
  created_at: string
  agreed_at?: string
}

// ---- Contrato / Assinatura --------------------------------
export type ContractType =
  | 'PRINCIPAL'
  | 'CAMBIO'
  | 'DESPACHANTE'
  | 'TERMINAL'
  | 'TRANSPORTADORA'
  | 'LABORATORIO'
  | 'SEGURO'

export type ContractStatus = 'PENDENTE_ASSINATURA' | 'ASSINADO' | 'CANCELADO'

export interface ContractSignatory {
  user_id: string
  name: string
  role: string
  signed: boolean
  signed_at?: string
  govbr_transaction_id?: string
}

export interface Contract {
  id: string
  negotiation_id: string
  type: ContractType
  pdf_url: string
  status: ContractStatus
  signatories: ContractSignatory[]
  created_at: string
  signed_at?: string
}

// ---- Workflow Logístico ------------------------------------
export type WorkflowStepStatus =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'ATRASADO'
  | 'BLOQUEADO'

export type WorkflowStepCode =
  | 'ASSINATURA_CONTRATOS'
  | 'EMISSAO_NF_ARMAZENAGEM'
  | 'ENTRADA_REDEX'
  | 'TERMINAL_PESAGEM_ESTUFAGEM'
  | 'FISCALIZACAO_MAPA'
  | 'CERTIFICADO_FITOSSANITARIO'
  | 'ENTRADA_SISCOMEX_DUE'
  | 'EMBARQUE_NAVIO_BL'
  | 'CHEGADA_PORTO_DESTINO'

export type DocumentType =
  | 'NF'
  | 'INVOICE'
  | 'PACKING_LIST'
  | 'CERT_ORIGEM'
  | 'CERT_FITOSSANITARIO'
  | 'CERT_HIGIENICO'
  | 'BL'
  | 'DUE'
  | 'LAUDO_LAB'
  | 'SWIFT'
  | 'OUTROS'

export type DocumentStatus =
  | 'PENDENTE'
  | 'EMITIDO'
  | 'ASSINADO'
  | 'APROVADO'
  | 'REJEITADO'

export interface WorkflowDocument {
  id: string
  type: DocumentType
  name: string
  status: DocumentStatus
  url?: string
  emitted_by?: string
  emitted_at?: string
}

export interface WorkflowStep {
  id: string
  order: number
  code: WorkflowStepCode
  title: string
  description: string
  status: WorkflowStepStatus
  responsible_party: string
  planned_date: string
  actual_date?: string
  documents: WorkflowDocument[]
  notes?: string
  external_ref?: string
  blockers?: string[]
}

export type WorkflowOverallStatus = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO' | 'CANCELADO'

export interface ExportWorkflow {
  id: string
  contract_id: string
  negotiation: Pick<NegotiationDeal, 'product_name' | 'quantity_kg' | 'incoterm' | 'origin_port' | 'destination_port'>
  exporter: OfferParty
  importer: OfferParty
  steps: WorkflowStep[]
  current_step_code: WorkflowStepCode
  incoterm: Incoterm
  overall_status: WorkflowOverallStatus
  created_at: string
  estimated_completion: string
}

// ---- Liquidação -------------------------------------------
export type LiquidationFOBStatus =
  | 'AGUARDANDO_SWIFT'
  | 'SWIFT_RECEBIDO'
  | 'BL_LIBERADO'
  | 'CONCLUIDO'

export type LiquidationCIFStatus =
  | 'AGUARDANDO_CHEGADA'
  | 'NAVIO_CHEGOU'
  | 'DOCS_ENVIADOS_IMPORTADOR'
  | 'AGUARDANDO_FISCALIZACAO_MAPA_DESTINO'
  | 'ANALISE_APROVADA'
  | 'AGUARDANDO_SWIFT'
  | 'SWIFT_RECEBIDO'
  | 'CONCLUIDO'

export interface LiquidationFOB {
  workflow_id: string
  incoterm: 'FOB'
  payment_status: LiquidationFOBStatus
  swift_document_url?: string
  swift_received_at?: string
  bl_release_authorized_by?: string
  bl_release_authorized_at?: string
  exchange_broker_id: string
  exchange_rate: number
  amount_usd: number
  amount_brl: number
}

export interface LiquidationCIF {
  workflow_id: string
  incoterm: 'CIF'
  payment_status: LiquidationCIFStatus
  arrival_date?: string
  destination_mapa_inspection_date?: string
  aflatoxin_result_at_destination?: 'APROVADO' | 'REPROVADO'
  swift_document_url?: string
  swift_received_at?: string
  exchange_settlement_date?: string
}

export type Liquidation = LiquidationFOB | LiquidationCIF

// ---- Prestadores de Serviço -------------------------------
export type ServiceProviderType =
  | 'SEGURADORA'
  | 'TRANSPORTADORA'
  | 'COMPANHIA_NAVEGACAO'
  | 'DESPACHANTE'
  | 'CORRETORA'
  | 'TERMINAL_ALFANDEGARIO'
  | 'CERTIFICADORA'
  | 'LABORATORIO'

export interface ServiceProvider {
  id: string
  type: ServiceProviderType
  company_name: string
  cnpj: string
  country: string
  city: string
  ports_covered?: string[]
  coverage_area?: string
  currency_pairs?: string[]
  exchange_rate_usd?: number
  fixed_fee_brl?: number
  mapa_accredited?: boolean
  rating: number
  reviews_count: number
  active: boolean
}

export type ServiceContractStatus =
  | 'PENDENTE'
  | 'CONTRATADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'

export interface ServiceContract {
  id: string
  workflow_id: string
  provider_id: string
  provider: ServiceProvider
  type: ServiceProviderType
  status: ServiceContractStatus
  value_brl: number
  signed_at?: string
  contract_url?: string
}

// ---- Seguros ----------------------------------------------
export type InsuranceType =
  | 'SAFRA'
  | 'MERCADORIA'
  | 'PAGAMENTO_EXPORTADOR'
  | 'RECEBIMENTO_IMPORTADOR'

export type InsuranceStatus = 'COTADO' | 'CONTRATADO' | 'ATIVO' | 'SINISTRO' | 'ENCERRADO'

export interface InsurancePolicy {
  id: string
  workflow_id: string
  type: InsuranceType
  insurer_id: string
  insurer_name: string
  coverage_usd: number
  premium_brl: number
  status: InsuranceStatus
  valid_from: string
  valid_until: string
  policy_document_url?: string
}

// ---- Inteligência de Mercado ------------------------------
export interface MapaNotice {
  id: string
  title: string
  date: string
  url: string
  category: 'NORMATIVA' | 'INFORMATIVO' | 'ALERTA'
}

export interface MarketIntelligence {
  apex_study_url: string
  cna_study_url: string
  proex_url: string
  mapa_notices: MapaNotice[]
}

// ---- Entidades CRUD ----------------------------------------
export interface Exporter {
  id: string
  company_name: string
  cnpj: string
  country: string
  mapa_registered: boolean
  mapa_registration_code?: string
  contact_email: string
  contact_phone: string
  active: boolean
  created_at: string
}

export interface Importer {
  id: string
  company_name: string
  cnpj_or_tax_id: string
  country: string
  import_license?: string
  contact_email: string
  contact_phone: string
  active: boolean
  created_at: string
}

export interface CustomsBroker {
  id: string
  company_name: string
  cnpj: string
  siscomex_accreditation: string
  fixed_fee_brl: number
  city: string
  contact_email: string
  active: boolean
}

export interface ShippingCompany {
  id: string
  company_name: string
  cnpj: string
  origin_ports: string[]
  destination_ports: string[]
  contact_email: string
  active: boolean
}

export interface CustomsTerminal {
  id: string
  company_name: string
  cnpj: string
  location: string
  port_code: string
  services: string[]
  contact_email: string
  active: boolean
}

export interface Laboratory {
  id: string
  company_name: string
  cnpj: string
  location: string
  mapa_accredited: boolean
  mapa_accreditation_number?: string
  tests_performed: string[]
  contact_email: string
  active: boolean
}

// ---- SISCOMEX / Certificados ------------------------------
export interface SiscomexStatus {
  due_number: string
  status: 'REGISTRADA' | 'CONFERIDA' | 'LIBERADA' | 'EMBARCADA' | 'AVERBADA'
  last_update: string
  channel: 'VERDE' | 'AMARELO' | 'VERMELHO' | 'CINZA'
}

// ---- Resposta paginada ------------------------------------
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ---- Erros API --------------------------------------------
export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}
