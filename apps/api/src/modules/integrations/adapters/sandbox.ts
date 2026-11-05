import { createHash } from 'node:crypto'
import type { AppContext } from '../../../context'
import { parseCanonicalWebhook } from '../webhook'
import type { DispatchRequest, NormalizedPartnerEvent, PartnerAdapter, QuoteRequest } from '../types'

/**
 * SANDBOX — parceiro SIMULADO para desenvolvimento, testes e demonstração. NÃO é uma integração real:
 * todo evento que ele emite é rotulado "[SANDBOX]" na timeline. Nunca é carregado em produção
 * (ver `AdapterRegistry`).
 *
 * config: { autoComplete?: boolean = true }  → conclui a tarefa disparada logo após aceitar.
 */
const TINY_PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n').toString('base64')

/** Efeitos simulados por tarefa (rastreamento e documentos), usados também por `simulateStage`. */
export const SANDBOX_TASK_EFFECTS: Record<string, { tracking?: NormalizedPartnerEvent['tracking']; document?: { type: string; fileName: string } }> = {
  INSURANCE_ISSUED: { document: { type: 'INSURANCE_POLICY', fileName: 'apolice-sandbox.pdf' } },
  FX_CONTRACT_OPENED: {},
  CUSTOMS_PROCESS_OPENED: {},
  MARITIME_BOOKING_CONFIRMED: { tracking: { status: 'BOOKING_CONFIRMED', vesselName: 'SANDBOX MV AMAZONIA', voyage: '001E', etd: '+10d', eta: '+32d' } },
  EXPORT_DECLARATION_REGISTERED: { document: { type: 'DU_E', fileName: 'due-sandbox.pdf' } },
  PHYTOSANITARY_CERTIFICATE: { document: { type: 'PHYTOSANITARY_CERTIFICATE', fileName: 'fitossanitario-sandbox.pdf' } },
  AFLATOXIN_LAB_REPORT: { document: { type: 'LAB_REPORT_AFLATOXIN', fileName: 'laudo-aflatoxina-sandbox.pdf' } },
  CARGO_LOADED: { tracking: { status: 'LOADED', containerNumbers: ['SBXU1234567'] } },
  BL_ISSUED: { tracking: { status: 'SAILING', blNumber: 'SBX-BL-0001' }, document: { type: 'BILL_OF_LADING', fileName: 'bl-sandbox.pdf' } },
  FX_CONTRACT_SIGNED: { document: { type: 'FX_CONTRACT', fileName: 'contrato-cambio-sandbox.pdf' } },
}

const inDays = (spec: string | undefined, now: Date) => {
  const m = spec?.match(/^\+(\d+)d$/)
  return m ? new Date(now.getTime() + Number(m[1]) * 86400_000).toISOString().slice(0, 10) : spec
}

/** Eventos que o parceiro simulado emitiria ao concluir uma tarefa. */
export function sandboxEventsForTask(taskKey: string, externalRef: string, now: Date, status: 'IN_PROGRESS' | 'DONE' = 'DONE'): NormalizedPartnerEvent[] {
  const fx = SANDBOX_TASK_EFFECTS[taskKey] ?? {}
  const occurredAt = now.toISOString()
  const events: NormalizedPartnerEvent[] = []
  if (status === 'IN_PROGRESS') {
    return [{ type: 'REQUEST_ACCEPTED', taskKey, externalRef, message: '[SANDBOX] Solicitação aceita', occurredAt }]
  }
  if (fx.tracking) {
    events.push({ type: 'TRACKING_UPDATE', taskKey, externalRef, message: `[SANDBOX] Rastreio: ${fx.tracking.status}`, occurredAt, tracking: { ...fx.tracking, etd: inDays(fx.tracking.etd, now), eta: inDays(fx.tracking.eta, now) } })
  }
  if (fx.document) {
    events.push({ type: 'DOCUMENT_AVAILABLE', taskKey, externalRef, message: '[SANDBOX] Documento disponível', occurredAt, document: { ...fx.document, contentBase64: TINY_PDF, mimeType: 'application/pdf' } })
  }
  events.push({ type: 'TASK_STATUS', taskKey, externalRef, partnerStatus: 'COMPLETED', canonicalStatus: 'DONE', message: '[SANDBOX] Etapa concluída pelo parceiro simulado', occurredAt })
  return events
}

export function createSandboxAdapter(ctx: AppContext): PartnerAdapter {
  const refFor = (r: DispatchRequest) => `SBX-${createHash('sha256').update(r.idempotencyKey).digest('hex').slice(0, 8).toUpperCase()}`
  return {
    id: 'sandbox',
    capabilities: new Set(['quote', 'dispatch', 'status', 'webhook', 'health', 'cancel']),
    async quote(_c, req: QuoteRequest) {
      // determinístico: base por serviço × contêineres
      const base: Record<string, number> = { FREIGHT_MARITIME: 3100, INSURANCE: 0.4, FX: 0.9, FREIGHT_LAND: 900, CUSTOMS_BROKER: 700 }
      const unit = base[req.service] ?? 100
      const amount = req.service === 'INSURANCE' || req.service === 'FX' ? Math.round(req.valueUsd * (unit / 100) * 100) / 100 : unit * Math.max(req.containers, 1)
      return { amount, currency: 'USD', transitDays: req.service === 'FREIGHT_MARITIME' ? 21 : undefined, raw: { sandbox: true } }
    },
    async dispatch(adapterCtx, req) {
      const externalRef = refFor(req)
      await adapterCtx.log({ operation: req.operation, direction: 'OUTBOUND', ok: true, correlationId: req.idempotencyKey, request: { sandbox: true, taskKey: req.taskKey }, response: { externalRef } })
      const events: NormalizedPartnerEvent[] = req.taskKey ? sandboxEventsForTask(req.taskKey, externalRef, ctx.now(), 'IN_PROGRESS') : []
      if (req.taskKey && adapterCtx.integration.config.autoComplete !== false) events.push(...sandboxEventsForTask(req.taskKey, externalRef, ctx.now(), 'DONE'))
      return { accepted: true, externalRef, events }
    },
    async fetchStatus(_c, externalRef) {
      return [{ type: 'TASK_STATUS', externalRef, partnerStatus: 'IN_PROGRESS', canonicalStatus: 'IN_PROGRESS', message: '[SANDBOX] Em andamento', occurredAt: ctx.now().toISOString() }]
    },
    async cancel() {},
    async healthCheck() {
      return { ok: true, detail: 'sandbox' }
    },
    async parseWebhook(adapterCtx, _h, raw) {
      return parseCanonicalWebhook(adapterCtx, raw)
    },
  }
}
