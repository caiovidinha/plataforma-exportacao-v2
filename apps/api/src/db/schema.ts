import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
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
  PartnerType,
  PlatformRole,
  PricingMode,
  PricingService,
  ProductStatus,
  ShipmentDocumentType,
  ShipmentStage,
  ShipmentStatus,
  TaskStatus,
  SectionData,
  SimulationResult,
  TechnicalSheet,
  ShipmentTrackingDto,
} from '@amazon-trade/shared'

const id = () => uuid('id').primaryKey().defaultRandom()
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })
const createdAt = () => ts('created_at').defaultNow().notNull()
const updatedAt = () => ts('updated_at').defaultNow().notNull()
const money = (name: string) => numeric(name, { precision: 16, scale: 2, mode: 'number' })

// ---------------------------------------------------------------- identidade
export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  locale: text('locale').$type<'pt' | 'en'>().notNull().default('pt'),
  platformRole: text('platform_role').$type<PlatformRole>().notNull().default('NONE'),
  emailVerifiedAt: ts('email_verified_at'),
  disabledAt: ts('disabled_at'),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: ts('locked_until'),
  lastLoginAt: ts('last_login_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    familyId: uuid('family_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: ts('expires_at').notNull(),
    revokedAt: ts('revoked_at'),
    replacedById: uuid('replaced_by_id'),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: createdAt(),
  },
  (t) => [index('refresh_tokens_user_idx').on(t.userId), index('refresh_tokens_family_idx').on(t.familyId)],
)

export const emailTokens = pgTable('email_tokens', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'INVITE'>().notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: ts('expires_at').notNull(),
  usedAt: ts('used_at'),
  createdAt: createdAt(),
})

// ---------------------------------------------------------------- empresas / KYC
export const companies = pgTable(
  'companies',
  {
    id: id(),
    type: text('type').$type<CompanyType>().notNull(),
    legalName: text('legal_name').notNull(),
    tradeName: text('trade_name'),
    /** CNPJ (só dígitos) ou Tax ID/VAT do importador. */
    taxId: text('tax_id'),
    country: text('country').notNull(),
    onboardingStatus: text('onboarding_status').$type<OnboardingStatus>().notNull().default('DRAFT'),
    submittedAt: ts('submitted_at'),
    reviewedAt: ts('reviewed_at'),
    reviewedBy: uuid('reviewed_by'),
    reviewNote: text('review_note'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('companies_tax_unique').on(t.type, t.country, t.taxId)],
)

export const companyMembers = pgTable(
  'company_members',
  {
    id: id(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').$type<MemberRole>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('company_members_company_idx').on(t.companyId)],
)

export const companySections = pgTable(
  'company_sections',
  {
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    sectionKey: text('section_key').notNull(),
    data: jsonb('data').$type<SectionData>().notNull(),
    updatedBy: uuid('updated_by'),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.sectionKey] })],
)

// ---------------------------------------------------------------- arquivos / documentos
export const files = pgTable('files', {
  id: id(),
  ownerCompanyId: uuid('owner_company_id').references(() => companies.id, { onDelete: 'set null' }),
  kind: text('kind').$type<'COMPANY_DOC' | 'PRODUCT_IMAGE' | 'SHIPMENT_DOC'>().notNull(),
  storageKey: text('storage_key').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  sha256: text('sha256').notNull(),
  createdBy: uuid('created_by'),
  createdAt: createdAt(),
})

export const documents = pgTable(
  'documents',
  {
    id: id(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    typeKey: text('type_key').notNull(),
    fileId: uuid('file_id').notNull().references(() => files.id),
    status: text('status').$type<DocumentStatus>().notNull().default('PENDING'),
    expiresAt: date('expires_at', { mode: 'string' }),
    note: text('note'),
    reviewReason: text('review_reason'),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: ts('reviewed_at'),
    version: integer('version').notNull().default(1),
    /** Substituído por uma versão mais nova do mesmo documento. */
    supersededAt: ts('superseded_at'),
    uploadedBy: uuid('uploaded_by'),
    createdAt: createdAt(),
  },
  (t) => [index('documents_company_idx').on(t.companyId, t.typeKey)],
)

// ---------------------------------------------------------------- catálogo
export const products = pgTable(
  'products',
  {
    id: id(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    description: text('description').notNull().default(''),
    ncm: text('ncm').notNull(),
    packaging: text('packaging').notNull(),
    originPort: text('origin_port').notNull(),
    originState: text('origin_state'),
    harvestYear: integer('harvest_year').notNull(),
    basePriceUsdPerKg: doublePrecision('base_price_usd_per_kg').notNull(),
    minOrderKg: doublePrecision('min_order_kg').notNull(),
    availableKg: doublePrecision('available_kg').notNull(),
    leadTimeDays: integer('lead_time_days').notNull(),
    incoterms: jsonb('incoterms').$type<Incoterm[]>().notNull(),
    destinationCountries: jsonb('destination_countries').$type<string[]>().notNull().default([]),
    technicalSheet: jsonb('technical_sheet').$type<TechnicalSheet>().notNull().default({}),
    imageFileIds: jsonb('image_file_ids').$type<string[]>().notNull().default([]),
    status: text('status').$type<ProductStatus>().notNull().default('DRAFT'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('products_company_idx').on(t.companyId), index('products_status_idx').on(t.status)],
)

// ---------------------------------------------------------------- precificação
export const tariffs = pgTable(
  'tariffs',
  {
    id: id(),
    service: text('service').$type<PricingService>().notNull(),
    match: jsonb('match').$type<Record<string, unknown>>().notNull(),
    pricing: jsonb('pricing').$type<Record<string, unknown>>().notNull(),
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }),
    label: text('label'),
    isSample: boolean('is_sample').notNull().default(false),
    createdBy: uuid('created_by'),
    createdAt: createdAt(),
  },
  (t) => [index('tariffs_service_idx').on(t.service)],
)

export const pricingConfig = pgTable('pricing_config', {
  service: text('service').$type<PricingService>().primaryKey(),
  mode: text('mode').$type<PricingMode>().notNull(),
  fallbackToTable: boolean('fallback_to_table').notNull().default(true),
  updatedBy: uuid('updated_by'),
  updatedAt: updatedAt(),
})

export const simulations = pgTable(
  'simulations',
  {
    id: id(),
    importerCompanyId: uuid('importer_company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id),
    productId: uuid('product_id').notNull().references(() => products.id),
    input: jsonb('input').$type<Record<string, unknown>>().notNull(),
    result: jsonb('result').$type<SimulationResult>().notNull(),
    expiresAt: ts('expires_at').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('simulations_importer_idx').on(t.importerCompanyId)],
)

// ---------------------------------------------------------------- pedidos / embarques
export const counters = pgTable('counters', {
  name: text('name').primaryKey(),
  value: integer('value').notNull().default(0),
})

export const orders = pgTable(
  'orders',
  {
    id: id(),
    number: text('number').notNull().unique(),
    simulationId: uuid('simulation_id').notNull().references(() => simulations.id),
    productId: uuid('product_id').notNull().references(() => products.id),
    exporterCompanyId: uuid('exporter_company_id').notNull().references(() => companies.id),
    importerCompanyId: uuid('importer_company_id').notNull().references(() => companies.id),
    status: text('status').$type<OrderStatus>().notNull().default('AWAITING_CONFIRMATION'),
    quantityKg: doublePrecision('quantity_kg').notNull(),
    incoterm: text('incoterm').$type<Incoterm>().notNull(),
    originPort: text('origin_port').notNull(),
    destinationPort: text('destination_port').notNull(),
    currency: text('currency').$type<Currency>().notNull(),
    invoiceValueUsd: money('invoice_value_usd').notNull(),
    totalLandedUsd: money('total_landed_usd').notNull(),
    result: jsonb('result').$type<SimulationResult>().notNull(),
    importerNotes: text('importer_notes'),
    requestedShipDate: date('requested_ship_date', { mode: 'string' }),
    decisionReason: text('decision_reason'),
    decidedBy: uuid('decided_by'),
    confirmedAt: ts('confirmed_at'),
    expiresAt: ts('expires_at'),
    createdBy: uuid('created_by').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('orders_exporter_idx').on(t.exporterCompanyId), index('orders_importer_idx').on(t.importerCompanyId)],
)

export const contracts = pgTable('contracts', {
  id: id(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  terms: jsonb('terms').$type<Record<string, unknown>>().notNull(),
  termsHash: text('terms_hash').notNull(),
  importerAcceptedAt: ts('importer_accepted_at'),
  importerAcceptedBy: uuid('importer_accepted_by'),
  importerAcceptedIp: text('importer_accepted_ip'),
  exporterAcceptedAt: ts('exporter_accepted_at'),
  exporterAcceptedBy: uuid('exporter_accepted_by'),
  exporterAcceptedIp: text('exporter_accepted_ip'),
  createdAt: createdAt(),
})

export const shipments = pgTable('shipments', {
  id: id(),
  number: text('number').notNull().unique(),
  orderId: uuid('order_id').notNull().unique().references(() => orders.id),
  status: text('status').$type<ShipmentStatus>().notNull().default('IN_PROGRESS'),
  stage: text('stage').$type<ShipmentStage>().notNull().default('NEGOCIO'),
  stageEnteredAt: ts('stage_entered_at').defaultNow().notNull(),
  tracking: jsonb('tracking').$type<ShipmentTrackingDto>().notNull().default({}),
  createdAt: createdAt(),
  completedAt: ts('completed_at'),
})

export const shipmentTasks = pgTable(
  'shipment_tasks',
  {
    id: id(),
    shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    stage: text('stage').$type<ShipmentStage>().notNull(),
    key: text('key').notNull(),
    partnerType: text('partner_type').$type<PartnerType>(),
    actor: text('actor').notNull(),
    status: text('status').$type<TaskStatus>().notNull().default('PENDING'),
    required: boolean('required').notNull().default(true),
    startedAt: ts('started_at'),
    completedAt: ts('completed_at'),
    note: text('note'),
    externalRef: text('external_ref'),
  },
  (t) => [uniqueIndex('shipment_tasks_unique').on(t.shipmentId, t.stage, t.key)],
)

export const shipmentEvents = pgTable(
  'shipment_events',
  {
    id: id(),
    shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    source: text('source').$type<EventSource>().notNull(),
    partnerId: uuid('partner_id'),
    partnerType: text('partner_type').$type<PartnerType>(),
    taskKey: text('task_key'),
    message: text('message').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: ts('occurred_at').defaultNow().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('shipment_events_shipment_idx').on(t.shipmentId, t.occurredAt)],
)

export const shipmentDocuments = pgTable('shipment_documents', {
  id: id(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  type: text('type').$type<ShipmentDocumentType>().notNull(),
  fileId: uuid('file_id').notNull().references(() => files.id),
  source: text('source').$type<EventSource>().notNull(),
  partnerId: uuid('partner_id'),
  partnerType: text('partner_type').$type<PartnerType>(),
  note: text('note'),
  createdAt: createdAt(),
})

// ---------------------------------------------------------------- parceiros / integrações
export const partners = pgTable('partners', {
  id: id(),
  type: text('type').$type<PartnerType>().notNull(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const partnerIntegrations = pgTable(
  'partner_integrations',
  {
    id: id(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),
    mode: text('mode').$type<IntegrationMode>().notNull(),
    environment: text('environment').$type<IntegrationEnvironment>().notNull().default('SANDBOX'),
    enabled: boolean('enabled').notNull().default(false),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    /** JSON criptografado (AES-256-GCM) com segredos: apiKey, clientSecret, webhookSecret... */
    secretsEnc: text('secrets_enc'),
    timeoutMs: integer('timeout_ms').notNull().default(15000),
    maxAttempts: integer('max_attempts').notNull().default(6),
    contractVersion: text('contract_version'),
    lastHealthAt: ts('last_health_at'),
    lastHealthOk: boolean('last_health_ok'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('partner_integrations_env_unique').on(t.partnerId, t.environment)],
)

export const integrationJobs = pgTable(
  'integration_jobs',
  {
    id: id(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    integrationId: uuid('integration_id').references(() => partnerIntegrations.id),
    shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }),
    taskKey: text('task_key'),
    operation: text('operation').$type<IntegrationOperation>().notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    status: text('status').$type<JobStatus>().notNull().default('QUEUED'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(6),
    nextAttemptAt: ts('next_attempt_at').defaultNow(),
    lockedAt: ts('locked_at'),
    lastError: text('last_error'),
    result: jsonb('result').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
    finishedAt: ts('finished_at'),
  },
  (t) => [index('integration_jobs_status_idx').on(t.status, t.nextAttemptAt)],
)

export const integrationLogs = pgTable(
  'integration_logs',
  {
    id: id(),
    partnerId: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id'),
    direction: text('direction').$type<'OUTBOUND' | 'INBOUND'>().notNull(),
    operation: text('operation').notNull(),
    ok: boolean('ok').notNull(),
    statusCode: integer('status_code'),
    durationMs: integer('duration_ms'),
    correlationId: text('correlation_id'),
    request: jsonb('request'),
    response: jsonb('response'),
    error: text('error'),
    createdAt: createdAt(),
  },
  (t) => [index('integration_logs_partner_idx').on(t.partnerId, t.createdAt)],
)

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: id(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),
    eventId: text('event_id').notNull(),
    bodyHash: text('body_hash').notNull(),
    status: text('status').$type<'PROCESSED' | 'IGNORED' | 'FAILED'>().notNull(),
    error: text('error'),
    receivedAt: ts('received_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('webhook_deliveries_unique').on(t.partnerId, t.eventId)],
)

/** Links tokenizados para parceiros sem API confirmarem/atualizarem status ("portal-lite"). */
export const partnerActionTokens = pgTable('partner_action_tokens', {
  id: id(),
  tokenHash: text('token_hash').notNull().unique(),
  partnerId: uuid('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id'),
  taskKey: text('task_key'),
  expiresAt: ts('expires_at').notNull(),
  lastUsedAt: ts('last_used_at'),
  revokedAt: ts('revoked_at'),
  createdAt: createdAt(),
})

/** Registro do que foi compartilhado com cada parceiro (LGPD/minimização). */
export const dataShares = pgTable(
  'data_shares',
  {
    id: id(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    companyId: uuid('company_id').references(() => companies.id),
    shipmentId: uuid('shipment_id'),
    operation: text('operation').notNull(),
    purpose: text('purpose').notNull(),
    fields: jsonb('fields').$type<string[]>().notNull(),
    documents: jsonb('documents').$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index('data_shares_partner_idx').on(t.partnerId, t.createdAt)],
)

// ---------------------------------------------------------------- transversal
export const notifications = pgTable(
  'notifications',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    link: text('link'),
    readAt: ts('read_at'),
    createdAt: createdAt(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
)

export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    actorUserId: uuid('actor_user_id'),
    companyId: uuid('company_id'),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
    ip: text('ip'),
    createdAt: createdAt(),
  },
  (t) => [index('audit_log_company_idx').on(t.companyId, t.createdAt)],
)
