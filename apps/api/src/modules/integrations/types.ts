import type {
  Currency,
  IntegrationEnvironment,
  IntegrationMode,
  IntegrationOperation,
  PartnerEventType,
  PartnerType,
  PricingService,
  TaskStatus,
} from '@amazon-trade/shared'

/**
 * CONTRATO DE ADAPTER DE PARCEIRO
 * Toda integração (API, e-mail, WhatsApp, manual...) implementa este contrato; só o que o
 * parceiro suporta é implementado (capacidades opcionais). O resto da plataforma nunca fala
 * com o parceiro diretamente — sempre via adapter + outbox (ver docs/arquitetura-integracoes.md).
 */

export type Capability = 'quote' | 'dispatch' | 'status' | 'webhook' | 'documents' | 'cancel' | 'health'

export interface PartnerRef {
  id: string
  type: PartnerType
  key: string
  name: string
  contactEmail: string | null
  contactName: string | null
  contactPhone: string | null
}

export interface IntegrationRuntime {
  id: string
  mode: IntegrationMode
  environment: IntegrationEnvironment
  enabled: boolean
  /** Configuração não secreta (baseUrl, paths, statusMap, e-mail destino...). */
  config: Record<string, unknown>
  /** Segredos já descriptografados (apiKey, clientSecret, webhookSecret...). */
  secrets: Record<string, string>
  timeoutMs: number
  maxAttempts: number
  contractVersion: string | null
}

export interface AdapterContext {
  partner: PartnerRef
  integration: IntegrationRuntime
  /** Registra uma chamada no `integration_logs` (request/response mascarados). */
  log: (entry: { operation: string; direction: 'OUTBOUND' | 'INBOUND'; ok: boolean; statusCode?: number; durationMs?: number; request?: unknown; response?: unknown; error?: string; correlationId?: string }) => Promise<void>
}

// ------------------------------------------------------------ cotação
export interface QuoteRequest {
  service: PricingService
  originPort: string
  destinationPort: string
  originState?: string
  quantityKg: number
  containers: number
  containerType: string
  /** Valor da mercadoria (USD) para seguro/câmbio. */
  valueUsd: number
  currency: Currency
}
export interface QuoteResponse {
  amount: number
  currency: Currency
  validUntil?: string
  transitDays?: number
  raw?: unknown
}

// ------------------------------------------------------------ despacho de pedidos aos parceiros
export interface DispatchRequest {
  operation: IntegrationOperation
  idempotencyKey: string
  shipmentId: string | null
  taskKey: string | null
  /** Dados já minimizados para este parceiro (ver `data_shares`). */
  payload: Record<string, unknown>
  /** Links assinados para documentos que o parceiro deve baixar. */
  documentLinks: { type: string; fileName: string; url: string }[]
  /** Link do portal-lite (parceiros sem API confirmarem status). */
  actionUrl?: string
}
export interface DispatchResult {
  /** Aceito pelo parceiro (ou entregue, no caso de e-mail/WhatsApp). */
  accepted: boolean
  externalRef?: string
  /** Eventos já conhecidos na resposta (ex.: parceiro respondeu "em andamento"). */
  events?: NormalizedPartnerEvent[]
  raw?: unknown
}

// ------------------------------------------------------------ eventos canônicos
export interface NormalizedPartnerEvent {
  type: PartnerEventType
  /** Referência no parceiro (booking, processo, apólice...). */
  externalRef?: string
  /** Nossa referência (número do embarque / id) quando o parceiro devolve. */
  shipmentRef?: string
  taskKey?: string
  /** Status do parceiro, como veio. */
  partnerStatus?: string
  /** Status canônico resultante (já mapeado). */
  canonicalStatus?: TaskStatus
  message: string
  occurredAt: string
  data?: Record<string, unknown>
  document?: { type: string; fileName: string; url?: string; contentBase64?: string; mimeType?: string }
  tracking?: { vesselName?: string; voyage?: string; containerNumbers?: string[]; blNumber?: string; etd?: string; eta?: string; lastPosition?: { lat: number; lng: number; at: string }; status?: string }
}

export interface WebhookParseResult {
  /** Id único do evento no parceiro (anti-replay). */
  eventId: string
  events: NormalizedPartnerEvent[]
}

export interface PartnerAdapter {
  /** Identificador do adapter (ex.: "sandbox", "http-despachante", "notify"). */
  readonly id: string
  readonly capabilities: ReadonlySet<Capability>
  quote?(ctx: AdapterContext, req: QuoteRequest): Promise<QuoteResponse>
  dispatch?(ctx: AdapterContext, req: DispatchRequest): Promise<DispatchResult>
  /** Polling de status (fallback quando não há webhook). */
  fetchStatus?(ctx: AdapterContext, externalRef: string): Promise<NormalizedPartnerEvent[]>
  cancel?(ctx: AdapterContext, externalRef: string): Promise<void>
  /**
   * Verificação de assinatura própria do parceiro. Se ausente, a plataforma aplica o esquema padrão
   * (`x-at-timestamp` + `x-at-signature: sha256=HMAC(webhookSecret, "<ts>.<corpo>")`, tolerância de 5 min).
   */
  verifyWebhook?(ctx: AdapterContext, headers: Record<string, string | string[] | undefined>, rawBody: Buffer): boolean
  /** Normaliza o corpo (já autenticado) recebido em `POST /webhooks/:partnerKey`. */
  parseWebhook?(ctx: AdapterContext, headers: Record<string, string | string[] | undefined>, rawBody: Buffer): Promise<WebhookParseResult>
  healthCheck?(ctx: AdapterContext): Promise<{ ok: boolean; detail?: string }>
}

export class AdapterError extends Error {
  constructor(message: string, public readonly retryable = true, public readonly statusCode?: number) {
    super(message)
    this.name = 'AdapterError'
  }
}
export class CapabilityUnavailableError extends AdapterError {
  constructor(what: string) {
    super(`capability_unavailable: ${what}`, false)
  }
}
