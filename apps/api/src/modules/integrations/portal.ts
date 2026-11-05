import { and, eq, isNull } from 'drizzle-orm'
import { getStageDef } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { orders, partnerActionTokens, partners, products, shipmentTasks, shipments } from '../../db/schema'
import { randomToken, sha256Hex } from '../../lib/crypto'
import { notFound, unauthorized } from '../../lib/errors'

const DEFAULT_TTL_DAYS = 14

/**
 * "Portal-lite": link tokenizado para parceiros SEM API (seguro, câmbio, terrestre...) confirmarem
 * aceite, atualizarem status e enviarem documentos sem criar conta. O token (256 bits) só existe em claro
 * no e-mail/WhatsApp enviado; no banco fica apenas o hash.
 */
export async function issueActionToken(
  ctx: AppContext,
  input: { partnerId: string; shipmentId: string; taskKey: string | null; jobId?: string | null; ttlDays?: number },
) {
  if (input.jobId) {
    // cada tentativa gera um novo link; os anteriores do mesmo job são revogados
    await ctx.db.update(partnerActionTokens).set({ revokedAt: ctx.now() }).where(and(eq(partnerActionTokens.jobId, input.jobId), isNull(partnerActionTokens.revokedAt)))
  }
  const token = randomToken(32)
  const expiresAt = new Date(ctx.now().getTime() + (input.ttlDays ?? DEFAULT_TTL_DAYS) * 86400_000)
  await ctx.db.insert(partnerActionTokens).values({
    tokenHash: sha256Hex(token),
    partnerId: input.partnerId,
    shipmentId: input.shipmentId,
    jobId: input.jobId ?? null,
    taskKey: input.taskKey,
    expiresAt,
  })
  return { token, url: `${ctx.config.WEB_ORIGIN.split(',')[0]!.trim()}/partner/${token}`, expiresAt }
}

/** Resolve e valida o token (existência, revogação, expiração) e atualiza o último uso. */
export async function resolveActionToken(ctx: AppContext, token: string) {
  const [row] = await ctx.db.select().from(partnerActionTokens).where(eq(partnerActionTokens.tokenHash, sha256Hex(token))).limit(1)
  if (!row || row.revokedAt || row.expiresAt.getTime() < ctx.now().getTime() || !row.shipmentId) throw unauthorized('invalid_or_expired_link', 'Link inválido ou expirado')
  await ctx.db.update(partnerActionTokens).set({ lastUsedAt: ctx.now() }).where(eq(partnerActionTokens.id, row.id))
  const [partner] = await ctx.db.select().from(partners).where(eq(partners.id, row.partnerId)).limit(1)
  if (!partner || !partner.active) throw unauthorized('invalid_or_expired_link')
  return { token: row, partner, shipmentId: row.shipmentId }
}

/** Visão mínima do que o parceiro precisa para agir (sem dados cadastrais). */
export async function describeActionTarget(ctx: AppContext, token: string) {
  const { token: row, partner, shipmentId } = await resolveActionToken(ctx, token)
  const [r] = await ctx.db
    .select({ s: shipments, o: orders, p: products })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .innerJoin(products, eq(products.id, orders.productId))
    .where(eq(shipments.id, shipmentId))
    .limit(1)
  if (!r) throw notFound('shipment_not_found')
  const tasks = await ctx.db.select().from(shipmentTasks).where(and(eq(shipmentTasks.shipmentId, shipmentId), eq(shipmentTasks.partnerType, partner.type)))
  const open = tasks.filter((t) => t.stage === r.s.stage || t.key === row.taskKey)
  return {
    partner: { name: partner.name, type: partner.type },
    shipment: {
      number: r.s.number,
      stage: r.s.stage,
      stageTitle: getStageDef(r.s.stage).title.pt,
      status: r.s.status,
      product: r.p.name,
      quantityKg: r.o.quantityKg,
      incoterm: r.o.incoterm,
      originPort: r.o.originPort,
      destinationPort: r.o.destinationPort,
    },
    tasks: open.map((t) => ({
      key: t.key,
      title: getStageDef(t.stage).tasks.find((x) => x.key === t.key)?.title.pt ?? t.key,
      status: t.status,
      focus: t.key === row.taskKey,
    })),
    expiresAt: row.expiresAt.toISOString(),
  }
}
