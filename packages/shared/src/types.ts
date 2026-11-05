import type {
  CompanyType,
  Currency,
  DocumentStatus,
  EventSource,
  Incoterm,
  IntegrationEnvironment,
  IntegrationMode,
  IntegrationOperation,
  JobStatus,
  MemberRole,
  OnboardingStatus,
  OrderStatus,
  PartnerEventType,
  PartnerType,
  PlatformRole,
  PricingMode,
  PricingService,
  ProductStatus,
  ShipmentDocumentType,
  ShipmentStage,
  ShipmentStatus,
  TaskStatus,
} from './enums'
import type { SectionData } from './fields'
import type { Readiness } from './requirements'
import type { SimulationResult, TariffInput } from './pricing'
import type { TechnicalSheet } from './schemas'

/** DTOs devolvidos pela API (datas em ISO 8601). */

export interface SessionUser {
  id: string
  email: string
  fullName: string
  locale: 'pt' | 'en'
  emailVerified: boolean
  platformRole: PlatformRole
  company: { id: string; type: CompanyType; legalName: string; onboardingStatus: OnboardingStatus; memberRole: MemberRole } | null
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface CompanyDto {
  id: string
  type: CompanyType
  legalName: string
  tradeName: string | null
  taxId: string | null
  country: string
  onboardingStatus: OnboardingStatus
  submittedAt: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

export interface OnboardingStateDto {
  company: CompanyDto
  sections: Record<string, SectionData>
  documents: DocumentDto[]
  /** Completude para enviar à análise. */
  submission: Readiness
  /** Completude por parceiro (campos obrigatórios + documentos aprovados). */
  partners: Record<PartnerType, Readiness>
}

export interface DocumentDto {
  id: string
  typeKey: string
  fileName: string
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  expiresAt: string | null
  note: string | null
  reviewReason: string | null
  version: number
  uploadedAt: string
}

export interface ProductDto {
  id: string
  companyId: string
  exporter: { id: string; name: string; country: string }
  name: string
  category: string
  description: string
  ncm: string
  packaging: string
  originPort: string
  originState: string | null
  harvestYear: number
  basePriceUsdPerKg: number
  minOrderKg: number
  availableKg: number
  leadTimeDays: number
  incoterms: Incoterm[]
  destinationCountries: string[]
  technicalSheet: TechnicalSheet
  images: { id: string; url: string }[]
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface SimulationDto {
  id: string
  productId: string
  productName: string
  createdAt: string
  expiresAt: string
  result: SimulationResult
}

export interface OrderDto {
  id: string
  number: string
  status: OrderStatus
  productId: string
  productName: string
  exporter: { id: string; name: string }
  importer: { id: string; name: string }
  quantityKg: number
  incoterm: Incoterm
  originPort: string
  destinationPort: string
  currency: Currency
  totalLandedUsd: number
  invoiceValueUsd: number
  importerNotes: string | null
  requestedShipDate: string | null
  decisionReason: string | null
  shipmentId: string | null
  createdAt: string
  confirmedAt: string | null
  result: SimulationResult
}

export interface ShipmentTaskDto {
  id: string
  stage: ShipmentStage
  key: string
  title: string
  partnerType: PartnerType | null
  actor: string
  status: TaskStatus
  required: boolean
  startedAt: string | null
  completedAt: string | null
  note: string | null
}

export interface ShipmentEventDto {
  id: string
  type: string
  source: EventSource
  partnerType: PartnerType | null
  message: string
  taskKey: string | null
  data: Record<string, unknown>
  occurredAt: string
}

export interface ShipmentDocumentDto {
  id: string
  type: ShipmentDocumentType
  fileName: string
  mimeType: string
  sizeBytes: number
  source: EventSource
  partnerType: PartnerType | null
  note: string | null
  createdAt: string
}

export interface ShipmentTrackingDto {
  vesselName?: string
  voyage?: string
  containerNumbers?: string[]
  blNumber?: string
  etd?: string
  eta?: string
  lastPosition?: { lat: number; lng: number; at: string }
  status?: string
}

export interface ShipmentDto {
  id: string
  number: string
  orderId: string
  orderNumber: string
  status: ShipmentStatus
  stage: ShipmentStage
  productName: string
  quantityKg: number
  incoterm: Incoterm
  originPort: string
  destinationPort: string
  exporter: { id: string; name: string }
  importer: { id: string; name: string }
  tracking: ShipmentTrackingDto
  tasks: ShipmentTaskDto[]
  createdAt: string
  completedAt: string | null
}

export interface PartnerDto {
  id: string
  type: PartnerType
  key: string
  name: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  active: boolean
  notes: string | null
  integration: IntegrationDto | null
}

export interface IntegrationDto {
  id: string
  partnerId: string
  mode: IntegrationMode
  environment: IntegrationEnvironment
  enabled: boolean
  config: Record<string, unknown>
  /** Nomes dos segredos configurados (valores nunca saem da API). */
  secretKeys: string[]
  timeoutMs: number
  maxAttempts: number
  contractVersion: string | null
  lastHealthAt: string | null
  lastHealthOk: boolean | null
}

export interface IntegrationJobDto {
  id: string
  partnerId: string
  partnerName: string
  partnerType: PartnerType
  shipmentId: string | null
  operation: IntegrationOperation
  status: JobStatus
  attempts: number
  maxAttempts: number
  nextAttemptAt: string | null
  lastError: string | null
  createdAt: string
  finishedAt: string | null
}

export interface IntegrationLogDto {
  id: string
  partnerId: string
  direction: 'OUTBOUND' | 'INBOUND'
  operation: string
  ok: boolean
  statusCode: number | null
  durationMs: number | null
  correlationId: string | null
  request: unknown
  response: unknown
  error: string | null
  createdAt: string
}

export interface TariffDto extends TariffInput {
  id: string
  createdAt: string
}

export interface PricingConfigDto {
  service: PricingService
  mode: PricingMode
  fallbackToTable: boolean
}

export interface NotificationDto {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  readAt: string | null
  createdAt: string
}

export interface PartnerEventDto {
  type: PartnerEventType
  taskKey?: string
  canonicalStatus?: TaskStatus
  message: string
  occurredAt: string
  data?: Record<string, unknown>
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}

export interface DashboardDto {
  role: CompanyType
  counters: Record<string, number>
  recentOrders: OrderDto[]
  activeShipments: ShipmentDto[]
  expiringDocuments: DocumentDto[]
}
