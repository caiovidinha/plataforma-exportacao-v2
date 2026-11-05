import type { AppContext } from '../../../context'
import { AdapterError, type DispatchRequest, type PartnerAdapter } from '../types'

const OPERATION_LABEL: Record<string, string> = {
  REQUEST_INSURANCE: 'Cotação/emissão de seguro',
  REQUEST_FX_CONTRACT: 'Abertura de operação de câmbio',
  REQUEST_LAND_TRANSPORT: 'Solicitação de transporte terrestre',
  CREATE_CUSTOMS_PROCESS: 'Abertura de processo de despacho',
  CREATE_BOOKING: 'Solicitação de booking marítimo',
  SEND_DOCUMENT: 'Envio de documentos',
  QUOTE: 'Cotação',
}

/** "chave: valor" indentado, legível por humanos (e-mail/WhatsApp). */
export function renderPayloadText(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    return value
      .map((v, i) => (typeof v === 'object' && v !== null ? `${pad}- #${i + 1}\n${renderPayloadText(v, indent + 1)}` : `${pad}- ${String(v)}`))
      .join('\n')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => (typeof v === 'object' ? `${pad}${k}:\n${renderPayloadText(v, indent + 1)}` : `${pad}${k}: ${String(v)}`))
      .join('\n')
  }
  return `${pad}${String(value)}`
}

export function renderRequestMessage(req: DispatchRequest, partnerName: string) {
  const shipment = (req.payload.shipment ?? {}) as { number?: string }
  const label = OPERATION_LABEL[req.operation] ?? req.operation
  const lines = [
    `Olá, ${partnerName}.`,
    '',
    `Amazon Trade — nova solicitação: ${label}`,
    `Embarque: ${shipment.number ?? '-'}`,
    `Referência: ${req.idempotencyKey}`,
    '',
    '=== DADOS DA OPERAÇÃO ===',
    renderPayloadText(req.payload),
  ]
  if (req.documentLinks.length) {
    lines.push('', '=== DOCUMENTOS (links válidos por 24 h) ===', ...req.documentLinks.map((d) => `- ${d.type}: ${d.fileName}\n  ${d.url}`))
  }
  if (req.actionUrl) {
    lines.push('', '=== RESPONDER / ATUALIZAR STATUS ===', 'Use o link abaixo para confirmar o aceite, atualizar o status ou enviar documentos (sem cadastro):', req.actionUrl)
  }
  return { subject: `[Amazon Trade] ${label} — ${shipment.number ?? req.idempotencyKey}`, text: lines.join('\n') }
}

/**
 * Adapter NOTIFY: e-mail (padrão) ou WhatsApp (via gateway HTTP configurável) com a solicitação completa +
 * documentos por link assinado + link do portal-lite para o parceiro responder.
 *
 * config: { recipientEmail?, whatsappTo?, whatsappGatewayUrl? }  secrets: { gatewayToken? }
 */
export function createNotifyAdapter(ctx: AppContext): PartnerAdapter {
  return {
    id: 'notify',
    capabilities: new Set(['dispatch']),
    async dispatch(adapterCtx, req) {
      const { partner, integration } = adapterCtx
      const msg = renderRequestMessage(req, partner.name)
      const started = Date.now()
      if (integration.mode === 'WHATSAPP') {
        const url = integration.config.whatsappGatewayUrl as string | undefined
        const to = integration.config.whatsappTo as string | undefined
        if (!url || !to) throw new AdapterError('whatsapp_not_configured: informe whatsappGatewayUrl e whatsappTo', false)
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(integration.secrets.gatewayToken ? { authorization: `Bearer ${integration.secrets.gatewayToken}` } : {}) },
          body: JSON.stringify({ to, text: msg.text }),
          signal: AbortSignal.timeout(integration.timeoutMs),
        }).catch((e: Error) => {
          throw new AdapterError(`whatsapp_gateway_unreachable: ${e.message}`)
        })
        await adapterCtx.log({ operation: req.operation, direction: 'OUTBOUND', ok: res.ok, statusCode: res.status, durationMs: Date.now() - started, correlationId: req.idempotencyKey, request: { channel: 'whatsapp', to } })
        if (!res.ok) throw new AdapterError(`whatsapp_gateway_${res.status}`, res.status === 429 || res.status >= 500, res.status)
        return { accepted: true }
      }
      const to = (integration.config.recipientEmail as string | undefined) ?? partner.contactEmail
      if (!to) throw new AdapterError('recipient_email_missing', false)
      try {
        await ctx.mailer.send({ to, subject: msg.subject, text: msg.text })
      } catch (e) {
        throw new AdapterError(`mail_send_failed: ${(e as Error).message}`)
      }
      await adapterCtx.log({ operation: req.operation, direction: 'OUTBOUND', ok: true, durationMs: Date.now() - started, correlationId: req.idempotencyKey, request: { channel: 'email', to } })
      return { accepted: true }
    },
  }
}
