import type { AppContext } from '../../../context'
import { notifyStaff } from '../../../lib/notify'
import type { PartnerAdapter } from '../types'

/**
 * Adapter MANUAL: parceiro sem nenhum canal automatizado. A plataforma avisa a equipe de operações
 * (notificação no backoffice) que há uma solicitação a tratar; a atualização de status é feita
 * à mão em `PATCH /shipments/:id/tasks/:key` (papel de operações).
 */
export function createManualAdapter(ctx: AppContext): PartnerAdapter {
  return {
    id: 'manual',
    capabilities: new Set(['dispatch']),
    async dispatch(adapterCtx, req) {
      await notifyStaff(ctx, ['OPERATIONS'], {
        kind: 'integration',
        titleKey: 'notif.partner.update',
        link: req.shipmentId ? `/admin/shipments/${req.shipmentId}` : '/admin/jobs',
      })
      await adapterCtx.log({ operation: req.operation, direction: 'OUTBOUND', ok: true, correlationId: req.idempotencyKey, response: { channel: 'backoffice' } })
      return { accepted: true, externalRef: undefined }
    },
  }
}
