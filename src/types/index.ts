// ============================================================
// Tipos globais da Plataforma de Exportação v2 (marketplace)
// ============================================================

// ---- Utilitários -------------------------------------------
export type Role = 'EXPORTADOR' | 'IMPORTADOR' | 'ADMIN'
export type Incoterm = 'FOB' | 'CIF'
export type TransportMode = 'MARITIMO' | 'AEREO'

// ---- Parceiros fixos do backend ------------------------------
// Contratados diretamente pela plataforma - nunca se cadastram, nunca
// aparecem como conta. São exibidos só como "quem está atuando" em
// cada etapa do workflow.
export type PartnerType =
  | 'JURIDICO'
  | 'SEGURADORA'
  | 'CORRETORA_CAMBIO'
  | 'CIA_NAVEGACAO'
  | 'DESPACHANTE'
  | 'LOGISTICA'
  | 'CERTIFICADORA'
  | 'LABORATORIO'

export interface Partner {
  type: PartnerType
  name: string
  description: string
  icon: string
}

// ---- Multi-user entity membership --------------------------
/** Roles a user can have within a single entity/company account */
export type EntityMemberRole = 'ADMIN' | 'OPERATOR' | 'VIEWER'

export interface EntityMember {
  id: string
  name: string
  email: string
  /** Role of this person within the entity account */
  entity_role: EntityMemberRole
  /** When they joined / were invited */
  joined_at: string
  /** Whether they have confirmed their invitation */
  active: boolean
}

// ---- Usuário / Perfil --------------------------------------
export interface UserProfile {
  id: string
  name: string
  email: string
  role: Role
  /** Exportador ou importador - os únicos 2 tipos de conta */
  entity_type?: 'EXPORTADOR' | 'IMPORTADOR'
  /** UUID of the entity/company account this user belongs to */
  entity_id?: string
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

// ---- Contraparte (exportador/importador) exibida em listagens ----
export interface PartyRef {
  id: string
  company_name: string
  country: string
  rating: number
  mapa_registered: boolean
}

// ---- Anúncio (vitrine) --------------------------------------
// Preço fixo, sem estado de negociação - o comprador faz um pedido,
// o exportador aceita ou recusa.
export type ListingStatus = 'ATIVA' | 'VENDIDA' | 'EXPIRADA'

export interface Listing {
  id: string
  product: Pick<Product, 'id' | 'name' | 'description' | 'images' | 'packaging'>
  exporter: PartyRef
  available_quantity_kg: number
  price_per_kg_usd: number
  incoterm: Incoterm
  origin_port: string
  destination_ports: string[]
  delivery_days: number
  harvest_year: number
  status: ListingStatus
  created_at: string
  expires_at: string
  featured?: boolean
}

// ---- Pedido ---------------------------------------------------
// Compra a preço fixo. O importador pede, o exportador confirma
// (aceita/recusa). Ao confirmar, dispara o ExportWorkflow.
export type OrderStatus = 'AGUARDANDO_CONFIRMACAO' | 'CONFIRMADO' | 'RECUSADO' | 'CANCELADO'

export interface Order {
  id: string
  listing_id: string
  product_name: string
  exporter: PartyRef
  importer: PartyRef
  quantity_kg: number
  price_per_kg_usd: number
  total_usd: number
  incoterm: Incoterm
  origin_port: string
  destination_port: string
  transport_mode: TransportMode
  status: OrderStatus
  created_at: string
  confirmed_at?: string
  /** Resumo da simulação de compra (frete/seguro/câmbio) escolhida no checkout */
  simulation_summary?: OrderSimulationSummary
}

export interface OrderSimulationSummary {
  carrier_name: string
  transit_days: number
  freight_usd: number
  insurer_name: string
  insurance_type: InsuranceType
  insurance_premium_brl: number
  exchange_rate: number
  total_usd: number
}

// ---- Contrato / Assinatura --------------------------------
export type ContractType =
  | 'EXPORTACAO'
  | 'SEGURO'
  | 'FRETE'
  | 'DESPACHANTE'
  | 'CAMBIO'

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
  order_id: string
  type: ContractType
  pdf_url: string
  status: ContractStatus
  signatories: ContractSignatory[]
  created_at: string
  signed_at?: string
}

// ---- Workflow do Pedido -------------------------------------
// Etapas fixas definidas pelo fluxo da plataforma: Cadastro -> Negócio
// -> Mercadoria pronta -> Mercadoria no Porto -> Mercadoria Liberada
// -> Pagamento (ou Mercadoria Recusada, ramo alternativo).
export type WorkflowStage =
  | 'CADASTRO'
  | 'NEGOCIO'
  | 'MERCADORIA_PRONTA'
  | 'MERCADORIA_PORTO'
  | 'MERCADORIA_LIBERADA'
  | 'PAGAMENTO'
  | 'MERCADORIA_RECUSADA'

export type WorkflowStageStatus =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'ATRASADO'
  | 'BLOQUEADO'

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

export interface WorkflowStageDefinition {
  id: string
  stage: WorkflowStage
  title: string
  description: string
  /** Parceiros fixos atuando nesta etapa (exibidos como badges, não navegáveis) */
  responsible_partners: PartnerType[]
  status: WorkflowStageStatus
  planned_date: string
  actual_date?: string
  documents: WorkflowDocument[]
  notes?: string
  blockers?: string[]
}

export type WorkflowOverallStatus = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO' | 'CANCELADO'

// ---- Log de atividades dos parceiros ------------------------
// Alimenta o painel de acompanhamento (ex.: Despachante, Cia de Navegação)
// e é gerado tanto por ações do exportador quanto automaticamente.
export type PartnerActivityStatus = 'INFO' | 'ACAO_NECESSARIA' | 'CONCLUIDO'

export interface PartnerActivityEvent {
  id: string
  partner: PartnerType
  stage: WorkflowStage
  message: string
  at: string
  status: PartnerActivityStatus
}

export interface ExportWorkflow {
  id: string
  order_id: string
  order: Pick<Order, 'product_name' | 'quantity_kg' | 'incoterm' | 'origin_port' | 'destination_port'>
  exporter: PartyRef
  importer: PartyRef
  stages: WorkflowStageDefinition[]
  current_stage: WorkflowStage
  incoterm: Incoterm
  overall_status: WorkflowOverallStatus
  created_at: string
  estimated_completion: string
  activity_log?: PartnerActivityEvent[]
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

// ---- Simulação de compra (pré-checkout) --------------------
// Cotações de frete e seguro mostradas antes da confirmação do pedido,
// similar a um resumo de compra de passagens - garante que o comprador
// veja o custo total (produto + frete + seguro) antes de fechar negócio.
export interface FreightQuote {
  id: string
  carrier_name: string
  transport_mode: TransportMode
  transit_days: number
  price_usd: number
}

export interface InsuranceQuote {
  id: string
  insurer_name: string
  type: InsuranceType
  coverage_usd: number
  premium_brl: number
}

export interface OrderSimulation {
  listing_id: string
  quantity_kg: number
  product_usd: number
  /** Transportadora e seguradora são parceiros fixos da plataforma - a
   * definição de quem atende o pedido é automática, não uma escolha do
   * comprador. */
  freight: FreightQuote
  insurance: InsuranceQuote
  exchange_rate: number
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

// ---- Entidades CRUD (só exportador/importador têm conta) ----
export interface Exporter {
  id: string
  company_name: string
  cnpj: string
  country: string
  state?: string
  city?: string
  mapa_registered: boolean
  mapa_registration_code?: string
  contact_email: string
  contact_phone: string
  website?: string
  description?: string
  founded_year?: number
  employees_range?: string
  annual_export_volume_tons?: number
  main_products?: string[]
  certifications?: string[]
  main_destinations?: string[]
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
