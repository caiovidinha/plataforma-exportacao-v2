// Enums de domínio compartilhados entre API e web.
// Usamos `as const` + union para ter valores em runtime e tipos.

const e = <T extends readonly string[]>(v: T) => v

export const COMPANY_TYPES = e(['EXPORTER', 'IMPORTER'] as const)
export type CompanyType = (typeof COMPANY_TYPES)[number]

/** Papel do usuário dentro da empresa. */
export const MEMBER_ROLES = e(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'] as const)
export type MemberRole = (typeof MEMBER_ROLES)[number]

/** Papel global do usuário na plataforma (usuários de empresa têm `NONE`). */
export const PLATFORM_ROLES = e(['NONE', 'COMPLIANCE', 'OPERATIONS', 'PLATFORM_ADMIN'] as const)
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const ONBOARDING_STATUSES = e([
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
] as const)
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number]

export const DOCUMENT_STATUSES = e(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] as const)
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

/** Parceiros. Os 5 primeiros estão no diagrama; os demais são fase 2. */
export const PARTNER_TYPES = e([
  'DESPACHANTE',
  'TRANSPORTE_MARITIMO',
  'TRANSPORTE_TERRESTRE',
  'CAMBIO',
  'SEGURO',
  'LABORATORIO',
  'CERTIFICADORA',
  'TERMINAL',
] as const)
export type PartnerType = (typeof PARTNER_TYPES)[number]
export const CORE_PARTNER_TYPES: PartnerType[] = [
  'DESPACHANTE',
  'TRANSPORTE_MARITIMO',
  'TRANSPORTE_TERRESTRE',
  'CAMBIO',
  'SEGURO',
]

export const INTEGRATION_MODES = e(['API', 'WEBHOOK_ONLY', 'EMAIL', 'WHATSAPP', 'MANUAL', 'SFTP'] as const)
export type IntegrationMode = (typeof INTEGRATION_MODES)[number]

export const INTEGRATION_ENVIRONMENTS = e(['SANDBOX', 'PRODUCTION'] as const)
export type IntegrationEnvironment = (typeof INTEGRATION_ENVIRONMENTS)[number]

/** Operações que a plataforma pede aos parceiros. */
export const INTEGRATION_OPERATIONS = e([
  'QUOTE',
  'CREATE_BOOKING',
  'CREATE_CUSTOMS_PROCESS',
  'REQUEST_LAND_TRANSPORT',
  'REQUEST_FX_CONTRACT',
  'REQUEST_INSURANCE',
  'SYNC_STATUS',
  'SEND_DOCUMENT',
  'CANCEL',
] as const)
export type IntegrationOperation = (typeof INTEGRATION_OPERATIONS)[number]

export const JOB_STATUSES = e(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD', 'CANCELLED'] as const)
export type JobStatus = (typeof JOB_STATUSES)[number]

export const PRICING_SERVICES = e([
  'FREIGHT_MARITIME',
  'FREIGHT_LAND',
  'INSURANCE',
  'FX',
  'CUSTOMS_BROKER',
  'ORIGIN_HANDLING',
  'IMPORT_CHARGES',
  'PLATFORM_FEE',
] as const)
export type PricingService = (typeof PRICING_SERVICES)[number]

/** Origem do preço: tabela interna ou API do parceiro. */
export const PRICING_MODES = e(['TABLE', 'PARTNER_API'] as const)
export type PricingMode = (typeof PRICING_MODES)[number]
export type PriceSource = 'TABLE' | 'PARTNER' | 'SYSTEM'

export const INCOTERMS = e(['FOB', 'CFR', 'CIF'] as const)
export type Incoterm = (typeof INCOTERMS)[number]

export const CURRENCIES = e(['USD', 'EUR', 'BRL'] as const)
export type Currency = (typeof CURRENCIES)[number]

export const PRODUCT_STATUSES = e(['DRAFT', 'PUBLISHED', 'PAUSED'] as const)
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const ORDER_STATUSES = e([
  'AWAITING_CONFIRMATION',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
] as const)
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const SHIPMENT_STAGES = e([
  'NEGOCIO',
  'MERCADORIA_PRONTA',
  'MERCADORIA_PORTO',
  'MERCADORIA_LIBERADA',
  'PAGAMENTO',
  'NAO_PAGAMENTO',
  'MERCADORIA_RECUSADA',
] as const)
export type ShipmentStage = (typeof SHIPMENT_STAGES)[number]

export const SHIPMENT_STATUSES = e(['IN_PROGRESS', 'COMPLETED', 'DISPUTE', 'CANCELLED'] as const)
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export const TASK_STATUSES = e(['PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'SKIPPED'] as const)
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const EVENT_SOURCES = e(['PLATFORM', 'USER', 'PARTNER', 'SYSTEM'] as const)
export type EventSource = (typeof EVENT_SOURCES)[number]

/** Tipos de evento canônicos que qualquer parceiro é normalizado para. */
export const PARTNER_EVENT_TYPES = e([
  'REQUEST_ACCEPTED',
  'REQUEST_REJECTED',
  'TASK_STATUS',
  'TRACKING_UPDATE',
  'DOCUMENT_AVAILABLE',
  'QUOTE_RECEIVED',
  'ISSUE_REPORTED',
] as const)
export type PartnerEventType = (typeof PARTNER_EVENT_TYPES)[number]

export const SHIPMENT_DOCUMENT_TYPES = e([
  'COMMERCIAL_INVOICE',
  'PACKING_LIST',
  'NF_E',
  'CERTIFICATE_OF_ORIGIN',
  'PHYTOSANITARY_CERTIFICATE',
  'SANITARY_CERTIFICATE',
  'LAB_REPORT_AFLATOXIN',
  'DU_E',
  'BILL_OF_LADING',
  'INSURANCE_POLICY',
  'FX_CONTRACT',
  'SWIFT_PROOF',
  'CONTRACT',
  'OTHER',
] as const)
export type ShipmentDocumentType = (typeof SHIPMENT_DOCUMENT_TYPES)[number]
