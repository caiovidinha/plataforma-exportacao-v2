import type { AppContext } from '../../../context'
import { DespachanteHttpAdapter, HttpPartnerAdapter, MaritimeHttpAdapter } from './http'
import { createManualAdapter } from './manual'
import { createNotifyAdapter } from './notify'
import { createSandboxAdapter } from './sandbox'

/** Registra os adapters que acompanham a plataforma. Novos parceiros = novo adapter aqui (ou só configuração, se falarem o contrato canônico). */
export function registerDefaultAdapters(ctx: AppContext) {
  ctx.adapters
    .register(createManualAdapter(ctx))
    .register(createNotifyAdapter(ctx))
    .register(createSandboxAdapter(ctx))
    .register(new HttpPartnerAdapter('http-generic', ctx, { dispatch: { method: 'POST', path: '/requests' }, status: { method: 'GET', path: '/requests/{externalRef}' }, health: { method: 'GET', path: '/health' } }))
    .register(new DespachanteHttpAdapter(ctx))
    .register(new MaritimeHttpAdapter(ctx))
}
