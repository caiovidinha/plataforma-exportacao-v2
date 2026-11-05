import { and, desc, eq } from 'drizzle-orm'
import type { IntegrationMode, PartnerType } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { integrationLogs, partnerIntegrations, partners } from '../../db/schema'
import { decryptJson, redact } from '../../lib/crypto'
import type { AdapterContext, IntegrationRuntime, PartnerAdapter, PartnerRef } from './types'

export interface ResolvedIntegration {
  adapter: PartnerAdapter
  adapterCtx: AdapterContext
  partner: PartnerRef
  integration: IntegrationRuntime
}

/** Adapter padrão por (tipo de parceiro, modo) quando a integração não define `config.adapter`. */
export function defaultAdapterId(type: PartnerType, mode: IntegrationMode): string {
  if (mode === 'API' || mode === 'WEBHOOK_ONLY' || mode === 'SFTP') {
    if (type === 'DESPACHANTE') return 'http-despachante'
    if (type === 'TRANSPORTE_MARITIMO') return 'http-maritime'
    return 'http-generic'
  }
  if (mode === 'EMAIL' || mode === 'WHATSAPP') return 'notify'
  return 'manual'
}

export class AdapterRegistry {
  private adapters = new Map<string, PartnerAdapter>()

  register(adapter: PartnerAdapter) {
    this.adapters.set(adapter.id, adapter)
    return this
  }

  get(id: string) {
    return this.adapters.get(id)
  }

  list() {
    return [...this.adapters.values()].map((a) => ({ id: a.id, capabilities: [...a.capabilities] }))
  }

  private async buildRuntime(ctx: AppContext, partnerId: string, opts: { integrationId?: string } = {}): Promise<ResolvedIntegration | null> {
    const [partnerRow] = await ctx.db.select().from(partners).where(eq(partners.id, partnerId)).limit(1)
    if (!partnerRow) return null
    if (!opts.integrationId && !partnerRow.active) return null
    const rows = opts.integrationId
      ? await ctx.db.select().from(partnerIntegrations).where(and(eq(partnerIntegrations.id, opts.integrationId), eq(partnerIntegrations.partnerId, partnerId)))
      : await ctx.db
          .select()
          .from(partnerIntegrations)
          .where(and(eq(partnerIntegrations.partnerId, partnerId), eq(partnerIntegrations.enabled, true)))
          .orderBy(desc(partnerIntegrations.environment)) // PRODUCTION antes de SANDBOX
    const eligible = opts.integrationId ? rows : rows.filter((r) => ctx.config.NODE_ENV !== 'production' || r.environment === 'PRODUCTION')
    const row = eligible[0]
    if (!row) return null

    const adapterId = (row.config.adapter as string | undefined) ?? defaultAdapterId(partnerRow.type, row.mode)
    // o parceiro simulado nunca atende operações reais
    if (adapterId === 'sandbox' && ctx.config.NODE_ENV === 'production') return null
    const adapter = this.adapters.get(adapterId)
    if (!adapter) return null

    const integration: IntegrationRuntime = {
      id: row.id,
      mode: row.mode,
      environment: row.environment,
      enabled: row.enabled,
      config: row.config,
      secrets: row.secretsEnc ? decryptJson(ctx.config.SECRETS_MASTER_KEY, row.secretsEnc) : {},
      timeoutMs: row.timeoutMs,
      maxAttempts: row.maxAttempts,
      contractVersion: row.contractVersion,
    }
    const partner: PartnerRef = {
      id: partnerRow.id,
      type: partnerRow.type,
      key: partnerRow.key,
      name: partnerRow.name,
      contactEmail: partnerRow.contactEmail,
      contactName: partnerRow.contactName,
      contactPhone: partnerRow.contactPhone,
    }
    const adapterCtx: AdapterContext = {
      partner,
      integration,
      log: async (e) => {
        await ctx.db.insert(integrationLogs).values({
          partnerId: partner.id,
          direction: e.direction,
          operation: e.operation,
          ok: e.ok,
          statusCode: e.statusCode ?? null,
          durationMs: e.durationMs ?? null,
          correlationId: e.correlationId ?? null,
          request: e.request === undefined ? null : redact(e.request),
          response: e.response === undefined ? null : redact(e.response),
          error: e.error ?? null,
        })
      },
    }
    return { adapter, adapterCtx, partner, integration }
  }

  /** Uma integração específica (mesmo desabilitada) — usado em "testar conexão" no backoffice. */
  resolveById(ctx: AppContext, partnerId: string, integrationId: string) {
    return this.buildRuntime(ctx, partnerId, { integrationId })
  }

  /** Integração ativa de um parceiro específico. */
  resolveForPartner(ctx: AppContext, partnerId: string) {
    return this.buildRuntime(ctx, partnerId)
  }

  /** Primeiro parceiro ativo (com integração habilitada) de um tipo. */
  async resolveByType(ctx: AppContext, type: PartnerType): Promise<ResolvedIntegration | null> {
    const list = await ctx.db.select({ id: partners.id }).from(partners).where(and(eq(partners.type, type), eq(partners.active, true))).orderBy(partners.createdAt)
    for (const p of list) {
      const r = await this.buildRuntime(ctx, p.id)
      if (r) return r
    }
    return null
  }
}
