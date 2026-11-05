import { createHash } from 'node:crypto'
import type { AppContext } from '../../../context'
import { hmacSha256Hex } from '../../../lib/crypto'
import { mapPartnerStatus, parseCanonicalWebhook } from '../webhook'
import {
  AdapterError,
  type AdapterContext,
  type Capability,
  type DispatchRequest,
  type DispatchResult,
  type NormalizedPartnerEvent,
  type PartnerAdapter,
  type QuoteRequest,
  type QuoteResponse,
} from '../types'

type EndpointKey = 'dispatch' | 'status' | 'cancel' | 'health' | 'quote'
export interface EndpointCfg {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Caminho relativo ao baseUrl; aceita `{externalRef}`. */
  path: string
}

/**
 * CONFIG (não secreta) de uma integração HTTP — editável no backoffice:
 *  baseUrl, endpoints{dispatch,status,cancel,health,quote}, headers, statusMap{statusDoParceiro→TaskStatus},
 *  auth{type:'none'|'apiKey'|'bearer'|'basic'|'oauth2'|'hmac', header?, tokenUrl?, scope?}, documentHosts[]
 * SEGREDOS: apiKey | bearerToken | username+password | clientId+clientSecret | hmacSecret | webhookSecret
 */
interface AuthCfg {
  type?: 'none' | 'apiKey' | 'bearer' | 'basic' | 'oauth2' | 'hmac'
  header?: string
  tokenUrl?: string
  scope?: string
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>()
const MAX_LOG_BYTES = 8_000

const truncate = (v: unknown) => {
  const s = JSON.stringify(v)
  return s && s.length > MAX_LOG_BYTES ? { truncated: true, preview: s.slice(0, MAX_LOG_BYTES) } : v
}

export class HttpPartnerAdapter implements PartnerAdapter {
  readonly capabilities: ReadonlySet<Capability> = new Set<Capability>(['dispatch', 'status', 'webhook', 'cancel', 'health', 'quote'])

  constructor(
    readonly id: string,
    protected readonly app: AppContext,
    private readonly defaultEndpoints: Partial<Record<EndpointKey, EndpointCfg>> = {},
  ) {}

  // ---------------------------------------------------------------- ganchos para subclasses
  /** Corpo enviado em `dispatch`. Padrão = contrato canônico da Amazon Trade. */
  protected buildDispatchBody(req: DispatchRequest, ctx: AdapterContext): Record<string, unknown> {
    return {
      operation: req.operation,
      idempotencyKey: req.idempotencyKey,
      reference: (req.payload.shipment as { number?: string } | undefined)?.number,
      callbackUrl: `${this.app.config.PUBLIC_API_URL}/webhooks/${ctx.partner.key}`,
      ...req.payload,
      documents: req.documentLinks,
      actionUrl: req.actionUrl,
    }
  }

  protected parseDispatchResponse(json: Record<string, unknown>, ctx: AdapterContext): DispatchResult {
    const events = Array.isArray(json.events) ? (json.events as Record<string, unknown>[]).map((e) => this.toEvent(e, ctx)) : undefined
    return {
      accepted: json.accepted === false || json.status === 'REJECTED' ? false : true,
      externalRef: (json.externalRef ?? json.id ?? json.reference) as string | undefined,
      events,
      raw: json,
    }
  }

  protected parseStatusResponse(json: Record<string, unknown>, ctx: AdapterContext, externalRef: string): NormalizedPartnerEvent[] {
    if (Array.isArray(json.events)) return (json.events as Record<string, unknown>[]).map((e) => this.toEvent(e, ctx, externalRef))
    const status = (json.status ?? json.partnerStatus) as string | undefined
    if (!status) return []
    return [this.toEvent({ type: 'TASK_STATUS', partnerStatus: status, message: `Status no parceiro: ${status}` }, ctx, externalRef)]
  }

  protected toEvent(e: Record<string, unknown>, ctx: AdapterContext, externalRef?: string): NormalizedPartnerEvent {
    const partnerStatus = e.partnerStatus as string | undefined
    return {
      type: (e.type as NormalizedPartnerEvent['type']) ?? 'TASK_STATUS',
      externalRef: (e.externalRef as string | undefined) ?? externalRef,
      taskKey: e.taskKey as string | undefined,
      shipmentRef: e.shipmentRef as string | undefined,
      partnerStatus,
      canonicalStatus: (e.status as NormalizedPartnerEvent['canonicalStatus']) ?? mapPartnerStatus(ctx.integration.config, partnerStatus),
      message: String(e.message ?? partnerStatus ?? ''),
      occurredAt: (e.occurredAt as string | undefined) ?? new Date().toISOString(),
      data: e.data as Record<string, unknown> | undefined,
      tracking: e.tracking as NormalizedPartnerEvent['tracking'],
      document: e.document as NormalizedPartnerEvent['document'],
    }
  }

  // ---------------------------------------------------------------- infraestrutura HTTP
  private endpoint(ctx: AdapterContext, key: EndpointKey): Required<EndpointCfg> {
    const cfg = ((ctx.integration.config.endpoints ?? {}) as Partial<Record<EndpointKey, EndpointCfg>>)[key] ?? this.defaultEndpoints[key]
    if (!cfg?.path) throw new AdapterError(`endpoint_not_configured:${key}`, false)
    return { method: cfg.method ?? (key === 'status' || key === 'health' ? 'GET' : 'POST'), path: cfg.path }
  }

  private baseUrl(ctx: AdapterContext) {
    const raw = ctx.integration.config.baseUrl
    if (typeof raw !== 'string' || !raw) throw new AdapterError('base_url_not_configured', false)
    const url = new URL(raw)
    if (this.app.config.NODE_ENV === 'production' && url.protocol !== 'https:') throw new AdapterError('https_required_in_production', false)
    return raw.replace(/\/+$/, '')
  }

  private async oauthToken(ctx: AdapterContext, auth: AuthCfg): Promise<string> {
    const cached = tokenCache.get(ctx.integration.id)
    if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token
    const { clientId, clientSecret } = ctx.integration.secrets
    if (!auth.tokenUrl || !clientId || !clientSecret) throw new AdapterError('oauth2_not_configured', false)
    const res = await fetch(auth.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, ...(auth.scope ? { scope: auth.scope } : {}) }),
      signal: AbortSignal.timeout(ctx.integration.timeoutMs),
    }).catch((e: Error) => {
      throw new AdapterError(`oauth2_unreachable: ${e.message}`)
    })
    if (!res.ok) throw new AdapterError(`oauth2_token_${res.status}`, res.status >= 500, res.status)
    const json = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!json.access_token) throw new AdapterError('oauth2_invalid_response', false)
    tokenCache.set(ctx.integration.id, { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 300) * 1000 })
    return json.access_token
  }

  private async authHeaders(ctx: AdapterContext, bodyText: string): Promise<Record<string, string>> {
    const auth = (ctx.integration.config.auth ?? {}) as AuthCfg
    const s = ctx.integration.secrets
    switch (auth.type ?? 'none') {
      case 'apiKey':
        if (!s.apiKey) throw new AdapterError('api_key_missing', false)
        return { [auth.header ?? 'x-api-key']: s.apiKey }
      case 'bearer':
        if (!s.bearerToken) throw new AdapterError('bearer_token_missing', false)
        return { authorization: `Bearer ${s.bearerToken}` }
      case 'basic':
        return { authorization: `Basic ${Buffer.from(`${s.username ?? ''}:${s.password ?? ''}`).toString('base64')}` }
      case 'oauth2':
        return { authorization: `Bearer ${await this.oauthToken(ctx, auth)}` }
      case 'hmac': {
        if (!s.hmacSecret) throw new AdapterError('hmac_secret_missing', false)
        const ts = String(Math.floor(Date.now() / 1000))
        return { 'x-timestamp': ts, 'x-signature': `sha256=${hmacSha256Hex(s.hmacSecret, `${ts}.${bodyText}`)}` }
      }
      default:
        return {}
    }
  }

  protected async call(
    ctx: AdapterContext,
    operation: string,
    key: EndpointKey,
    opts: { body?: unknown; vars?: Record<string, string>; correlationId?: string; idempotencyKey?: string } = {},
  ): Promise<{ status: number; json: Record<string, unknown> }> {
    const ep = this.endpoint(ctx, key)
    const path = ep.path.replace(/\{(\w+)\}/g, (_, k: string) => encodeURIComponent(opts.vars?.[k] ?? ''))
    const url = `${this.baseUrl(ctx)}${path.startsWith('/') ? '' : '/'}${path}`
    const bodyText = opts.body === undefined ? '' : JSON.stringify(opts.body)
    const started = Date.now()
    let status: number | undefined
    let json: Record<string, unknown> = {}
    try {
      const res = await fetch(url, {
        method: ep.method,
        headers: {
          accept: 'application/json',
          ...(bodyText ? { 'content-type': 'application/json' } : {}),
          ...(opts.idempotencyKey ? { 'idempotency-key': opts.idempotencyKey } : {}),
          ...((ctx.integration.config.headers ?? {}) as Record<string, string>),
          ...(await this.authHeaders(ctx, bodyText)),
        },
        body: bodyText || undefined,
        signal: AbortSignal.timeout(ctx.integration.timeoutMs),
        redirect: 'error',
      })
      status = res.status
      const text = await res.text()
      try {
        json = text ? (JSON.parse(text) as Record<string, unknown>) : {}
      } catch {
        json = { raw: text.slice(0, 500) }
      }
      if (res.ok) return { status, json }
      if (status === 401) tokenCache.delete(ctx.integration.id)
      const retryable = status === 408 || status === 425 || status === 429 || status >= 500 || (status === 401 && ctx.integration.config.auth && (ctx.integration.config.auth as AuthCfg).type === 'oauth2')
      throw new AdapterError(`http_${status}`, Boolean(retryable), status)
    } catch (e) {
      const err = e instanceof AdapterError ? e : new AdapterError(`network_error: ${(e as Error).message}`)
      await ctx.log({ operation, direction: 'OUTBOUND', ok: false, statusCode: status, durationMs: Date.now() - started, correlationId: opts.correlationId, request: { method: ep.method, url, body: truncate(opts.body) }, response: truncate(json), error: err.message })
      throw err
    } finally {
      // sucesso é registrado pelo chamador (precisa do corpo interpretado)
    }
  }

  private async logOk(ctx: AdapterContext, operation: string, started: number, status: number, correlationId: string | undefined, req: unknown, res: unknown) {
    await ctx.log({ operation, direction: 'OUTBOUND', ok: true, statusCode: status, durationMs: Date.now() - started, correlationId, request: truncate(req), response: truncate(res) })
  }

  // ---------------------------------------------------------------- capacidades
  async dispatch(ctx: AdapterContext, req: DispatchRequest): Promise<DispatchResult> {
    const body = this.buildDispatchBody(req, ctx)
    const started = Date.now()
    const { status, json } = await this.call(ctx, req.operation, 'dispatch', { body, correlationId: req.idempotencyKey, idempotencyKey: req.idempotencyKey })
    await this.logOk(ctx, req.operation, started, status, req.idempotencyKey, { body }, json)
    return this.parseDispatchResponse(json, ctx)
  }

  async fetchStatus(ctx: AdapterContext, externalRef: string): Promise<NormalizedPartnerEvent[]> {
    const started = Date.now()
    const { status, json } = await this.call(ctx, 'SYNC_STATUS', 'status', { vars: { externalRef } })
    await this.logOk(ctx, 'SYNC_STATUS', started, status, externalRef, { externalRef }, json)
    return this.parseStatusResponse(json, ctx, externalRef)
  }

  async cancel(ctx: AdapterContext, externalRef: string): Promise<void> {
    const started = Date.now()
    const { status, json } = await this.call(ctx, 'CANCEL', 'cancel', { vars: { externalRef } })
    await this.logOk(ctx, 'CANCEL', started, status, externalRef, { externalRef }, json)
  }

  async quote(ctx: AdapterContext, req: QuoteRequest): Promise<QuoteResponse> {
    const started = Date.now()
    const { status, json } = await this.call(ctx, 'QUOTE', 'quote', { body: req })
    await this.logOk(ctx, 'QUOTE', started, status, undefined, req, json)
    const amount = Number(json.amount ?? json.total)
    if (!Number.isFinite(amount)) throw new AdapterError('quote_invalid_response', false)
    return { amount, currency: (json.currency as QuoteResponse['currency']) ?? 'USD', validUntil: json.validUntil as string | undefined, transitDays: json.transitDays as number | undefined, raw: json }
  }

  async healthCheck(ctx: AdapterContext) {
    try {
      const { status } = await this.call(ctx, 'HEALTH', 'health')
      return { ok: true, detail: `HTTP ${status}` }
    } catch (e) {
      return { ok: false, detail: (e as Error).message }
    }
  }

  async parseWebhook(ctx: AdapterContext, _headers: Record<string, string | string[] | undefined>, rawBody: Buffer) {
    return parseCanonicalWebhook(ctx, rawBody)
  }
}

/** Referência estável derivada da chave de idempotência (útil para parceiros que exigem um id nosso curto). */
export const shortRef = (idempotencyKey: string) => createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 12).toUpperCase()

// ====================================================================== adapters por tipo de parceiro
type ShipmentPayload = {
  number?: string
  incoterm?: string
  quantityKg?: number
  invoiceValueUsd?: number
  containers?: number
  containerType?: string
  originPort?: { code?: string; name?: string }
  destinationPort?: { code?: string; name?: string }
  requestedShipDate?: string
  product?: { name?: string; ncm?: string; packaging?: string }
}

/**
 * DESPACHANTE ADUANEIRO — esqueleto. PROVISÓRIO: caminhos e formato do corpo dependem da documentação
 * do parceiro (ver docs/parceiros/guia-integracao-parceiros.md, seção "Despachante"). Hoje usa o contrato
 * canônico com um envelope de processo de exportação; ajuste `endpoints`, `statusMap` e este mapeamento.
 */
export class DespachanteHttpAdapter extends HttpPartnerAdapter {
  constructor(app: AppContext) {
    super('http-despachante', app, {
      dispatch: { method: 'POST', path: '/v1/export-processes' },
      status: { method: 'GET', path: '/v1/export-processes/{externalRef}' },
      cancel: { method: 'DELETE', path: '/v1/export-processes/{externalRef}' },
      health: { method: 'GET', path: '/health' },
    })
  }
  protected override buildDispatchBody(req: DispatchRequest, ctx: AdapterContext) {
    const s = (req.payload.shipment ?? {}) as ShipmentPayload
    return {
      ...super.buildDispatchBody(req, ctx),
      processType: 'EXPORT_CLEARANCE',
      cargo: { ncm: s.product?.ncm, description: s.product?.name, packaging: s.product?.packaging, grossWeightKg: s.quantityKg, invoiceValueUsd: s.invoiceValueUsd },
      route: { exitPort: s.originPort, destinationPort: s.destinationPort, incoterm: s.incoterm },
    }
  }
}

/**
 * TRANSPORTADORA MARÍTIMA — esqueleto. PROVISÓRIO (idem acima): mapeamento de booking/BL/tracking depende
 * da API do armador/NVOCC. Campos de tracking esperados nos eventos: vesselName, voyage, containerNumbers,
 * blNumber, etd, eta, lastPosition.
 */
export class MaritimeHttpAdapter extends HttpPartnerAdapter {
  constructor(app: AppContext) {
    super('http-maritime', app, {
      dispatch: { method: 'POST', path: '/v1/bookings' },
      status: { method: 'GET', path: '/v1/bookings/{externalRef}' },
      cancel: { method: 'DELETE', path: '/v1/bookings/{externalRef}' },
      quote: { method: 'POST', path: '/v1/quotes' },
      health: { method: 'GET', path: '/health' },
    })
  }
  protected override buildDispatchBody(req: DispatchRequest, ctx: AdapterContext) {
    const s = (req.payload.shipment ?? {}) as ShipmentPayload
    return {
      ...super.buildDispatchBody(req, ctx),
      service: 'BOOKING',
      origin: s.originPort,
      destination: s.destinationPort,
      equipment: { type: s.containerType, quantity: s.containers },
      cargo: { description: s.product?.name, ncm: s.product?.ncm, weightKg: s.quantityKg },
      requestedShipDate: s.requestedShipDate,
      incoterm: s.incoterm,
    }
  }
}
