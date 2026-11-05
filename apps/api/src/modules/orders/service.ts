import { createHash } from 'node:crypto'
import { and, desc, eq, lt } from 'drizzle-orm'
import type { OrderDto } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { companies, contracts, orders, products, shipments, simulations } from '../../db/schema'
import { audit } from '../../lib/audit'
import { conflict, forbidden, notFound, unprocessable } from '../../lib/errors'
import { notifyCompany } from '../../lib/notify'
import type { AuthContext } from '../../plugins/auth'
import { createShipmentForOrder, nextNumber } from '../shipments/service'

type OrderRow = typeof orders.$inferSelect

const ORDER_TTL_DAYS = 7

const toDto = (o: OrderRow, ctxData: { productName: string; exporterName: string; importerName: string; shipmentId: string | null }): OrderDto => ({
  id: o.id,
  number: o.number,
  status: o.status,
  productId: o.productId,
  productName: ctxData.productName,
  exporter: { id: o.exporterCompanyId, name: ctxData.exporterName },
  importer: { id: o.importerCompanyId, name: ctxData.importerName },
  quantityKg: o.quantityKg,
  incoterm: o.incoterm,
  originPort: o.originPort,
  destinationPort: o.destinationPort,
  currency: o.currency,
  totalLandedUsd: o.totalLandedUsd,
  invoiceValueUsd: o.invoiceValueUsd,
  importerNotes: o.importerNotes,
  requestedShipDate: o.requestedShipDate,
  decisionReason: o.decisionReason,
  shipmentId: ctxData.shipmentId,
  createdAt: o.createdAt.toISOString(),
  confirmedAt: o.confirmedAt?.toISOString() ?? null,
  result: o.result,
})

const nameOf = (c: typeof companies.$inferSelect) => c.tradeName || c.legalName

/** Marca como EXPIRED pedidos aguardando confirmação além do prazo (avaliação preguiçosa + worker). */
export async function expireStaleOrders(ctx: AppContext) {
  const res = await ctx.db
    .update(orders)
    .set({ status: 'EXPIRED' })
    .where(and(eq(orders.status, 'AWAITING_CONFIRMATION'), lt(orders.expiresAt, ctx.now())))
    .returning({ id: orders.id })
  return res.length
}

async function hydrate(ctx: AppContext, rows: OrderRow[]): Promise<OrderDto[]> {
  const out: OrderDto[] = []
  for (const o of rows) {
    const [p] = await ctx.db.select({ name: products.name }).from(products).where(eq(products.id, o.productId))
    const [e] = await ctx.db.select().from(companies).where(eq(companies.id, o.exporterCompanyId))
    const [i] = await ctx.db.select().from(companies).where(eq(companies.id, o.importerCompanyId))
    const [s] = await ctx.db.select({ id: shipments.id }).from(shipments).where(eq(shipments.orderId, o.id))
    out.push(toDto(o, { productName: p?.name ?? '', exporterName: nameOf(e!), importerName: nameOf(i!), shipmentId: s?.id ?? null }))
  }
  return out
}

export async function createOrder(ctx: AppContext, auth: AuthContext, input: { simulationId: string; importerNotes?: string; requestedShipDate?: string }, ip?: string) {
  const [row] = await ctx.db
    .select({ s: simulations, p: products })
    .from(simulations)
    .innerJoin(products, eq(products.id, simulations.productId))
    .where(and(eq(simulations.id, input.simulationId), eq(simulations.importerCompanyId, auth.company!.id)))
    .limit(1)
  if (!row) throw notFound('simulation_not_found')
  if (row.s.expiresAt.getTime() < ctx.now().getTime()) throw unprocessable('simulation_expired', 'Simulação expirada; refaça a simulação')
  if (row.p.status !== 'PUBLISHED') throw unprocessable('product_unavailable', 'Produto indisponível')
  const [exporter] = await ctx.db.select().from(companies).where(eq(companies.id, row.p.companyId))
  if (!exporter || exporter.onboardingStatus !== 'APPROVED') throw unprocessable('exporter_unavailable', 'Exportador indisponível')
  const [existing] = await ctx.db.select({ id: orders.id }).from(orders).where(eq(orders.simulationId, row.s.id)).limit(1)
  if (existing) throw conflict('order_already_exists', 'Já existe pedido para esta simulação')

  const result = row.s.result
  const now = ctx.now()

  const created = await ctx.db.transaction(async (tx) => {
    const number = await nextNumber(tx, 'order', 'AT', now)
    const [order] = await tx
      .insert(orders)
      .values({
        number,
        simulationId: row.s.id,
        productId: row.p.id,
        exporterCompanyId: row.p.companyId,
        importerCompanyId: auth.company!.id,
        quantityKg: result.quantityKg,
        incoterm: result.incoterm,
        originPort: result.originPort,
        destinationPort: result.destinationPort,
        currency: result.currency,
        invoiceValueUsd: result.invoiceValueUsd,
        totalLandedUsd: result.totalLandedUsd,
        result,
        importerNotes: input.importerNotes ?? null,
        requestedShipDate: input.requestedShipDate ?? null,
        expiresAt: new Date(now.getTime() + ORDER_TTL_DAYS * 86400_000),
        createdBy: auth.user.id,
      })
      .returning()
    // contrato-lite: termos congelados + hash + aceite do importador (trilha de auditoria)
    const terms = {
      orderNumber: number,
      product: { id: row.p.id, name: row.p.name, ncm: row.p.ncm },
      quantityKg: result.quantityKg,
      incoterm: result.incoterm,
      originPort: result.originPort,
      destinationPort: result.destinationPort,
      currency: result.currency,
      invoiceValueUsd: result.invoiceValueUsd,
      totalLandedUsd: result.totalLandedUsd,
      lines: result.lines,
      disclaimer: result.disclaimer,
      frozenAt: now.toISOString(),
    }
    const termsHash = createHash('sha256').update(JSON.stringify(terms)).digest('hex')
    await tx.insert(contracts).values({ orderId: order!.id, terms, termsHash, importerAcceptedAt: now, importerAcceptedBy: auth.user.id, importerAcceptedIp: ip ?? null })
    await audit(tx, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'order.created', entityType: 'order', entityId: order!.id, meta: { number, termsHash }, ip })
    return order!
  })

  await notifyCompany(ctx, row.p.companyId, {
    kind: 'order',
    titleKey: 'notif.order.created',
    bodyKey: 'notif.order.created.body',
    vars: { number: created.number, product: row.p.name, importer: auth.company!.legalName },
    link: `/orders/${created.id}`,
    email: true,
  })
  return (await hydrate(ctx, [created]))[0]!
}

export async function listOrders(ctx: AppContext, auth: AuthContext, scope: 'company' | 'all' = 'company'): Promise<OrderDto[]> {
  await expireStaleOrders(ctx)
  const cond = scope === 'all' ? undefined : auth.company!.type === 'EXPORTER' ? eq(orders.exporterCompanyId, auth.company!.id) : eq(orders.importerCompanyId, auth.company!.id)
  const rows = await ctx.db.select().from(orders).where(cond).orderBy(desc(orders.createdAt)).limit(100)
  return hydrate(ctx, rows)
}

async function loadOwned(ctx: AppContext, auth: AuthContext, id: string) {
  await expireStaleOrders(ctx)
  const [o] = await ctx.db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!o) throw notFound('order_not_found')
  const staff = ['OPERATIONS', 'PLATFORM_ADMIN', 'COMPLIANCE'].includes(auth.user.platformRole)
  if (!staff && o.exporterCompanyId !== auth.company?.id && o.importerCompanyId !== auth.company?.id) throw notFound('order_not_found')
  return o
}

export async function getOrder(ctx: AppContext, auth: AuthContext, id: string) {
  const o = await loadOwned(ctx, auth, id)
  const [c] = await ctx.db.select().from(contracts).where(eq(contracts.orderId, o.id)).limit(1)
  const dto = (await hydrate(ctx, [o]))[0]!
  return { ...dto, contract: c ? { termsHash: c.termsHash, terms: c.terms, importerAcceptedAt: c.importerAcceptedAt?.toISOString() ?? null, exporterAcceptedAt: c.exporterAcceptedAt?.toISOString() ?? null } : null }
}

/** Exportador aceita/recusa. Aceite cria o embarque e dispara o workflow com os parceiros. */
export async function decideOrder(ctx: AppContext, auth: AuthContext, id: string, decision: 'ACCEPT' | 'REJECT', reason: string | undefined, ip?: string) {
  const o = await loadOwned(ctx, auth, id)
  if (o.exporterCompanyId !== auth.company?.id) throw forbidden('not_order_exporter')
  if (o.status !== 'AWAITING_CONFIRMATION') throw conflict('order_not_pending', 'Pedido não está aguardando confirmação')
  if (decision === 'REJECT' && !reason?.trim()) throw unprocessable('reason_required', 'Informe o motivo da recusa')

  const now = ctx.now()
  const shipmentId = await ctx.db.transaction(async (tx) => {
    if (decision === 'REJECT') {
      await tx.update(orders).set({ status: 'REJECTED', decisionReason: reason, decidedBy: auth.user.id }).where(eq(orders.id, o.id))
      await audit(tx, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'order.rejected', entityType: 'order', entityId: o.id, meta: { reason }, ip })
      return null
    }
    const [updated] = await tx.update(orders).set({ status: 'CONFIRMED', confirmedAt: now, decidedBy: auth.user.id, decisionReason: reason ?? null }).where(eq(orders.id, o.id)).returning()
    await tx.update(contracts).set({ exporterAcceptedAt: now, exporterAcceptedBy: auth.user.id, exporterAcceptedIp: ip ?? null }).where(eq(contracts.orderId, o.id))
    const shipment = await createShipmentForOrder(ctx, tx, updated!)
    await audit(tx, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'order.confirmed', entityType: 'order', entityId: o.id, meta: { shipmentId: shipment.id }, ip })
    return shipment.id
  })

  const [p] = await ctx.db.select({ name: products.name }).from(products).where(eq(products.id, o.productId))
  await notifyCompany(ctx, o.importerCompanyId, {
    kind: 'order',
    titleKey: decision === 'ACCEPT' ? 'notif.order.confirmed' : 'notif.order.rejected',
    bodyKey: decision === 'ACCEPT' ? 'notif.order.confirmed.body' : 'notif.order.rejected.body',
    vars: { number: o.number, product: p?.name ?? '', reason: reason ?? '' },
    link: shipmentId ? `/shipments/${shipmentId}` : `/orders/${o.id}`,
    email: true,
  })
  return getOrder(ctx, auth, id)
}

export async function cancelOrder(ctx: AppContext, auth: AuthContext, id: string) {
  const o = await loadOwned(ctx, auth, id)
  if (o.importerCompanyId !== auth.company?.id) throw forbidden('not_order_importer')
  if (o.status !== 'AWAITING_CONFIRMATION') throw conflict('order_not_pending', 'Só é possível cancelar pedidos aguardando confirmação')
  await ctx.db.update(orders).set({ status: 'CANCELLED' }).where(eq(orders.id, o.id))
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'order.cancelled', entityType: 'order', entityId: o.id })
  return getOrder(ctx, auth, id)
}
