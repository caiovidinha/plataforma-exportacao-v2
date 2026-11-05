import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { and, eq, sql } from 'drizzle-orm'
import type { DashboardDto } from '@amazon-trade/shared'
import { orders, products, shipments, simulations } from '../../db/schema'
import { requireCompany } from '../../plugins/auth'
import { listCompanyDocuments } from '../companies/service'
import { listOrders } from '../orders/service'
import { listShipments } from '../shipments/service'

const IN_30_DAYS = 30 * 86400_000

export const dashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx

  app.get('/dashboard', { preHandler: requireCompany(), schema: { tags: ['dashboard'] } }, async (req): Promise<DashboardDto> => {
    const auth = req.auth!
    const company = auth.company!
    const isExporter = company.type === 'EXPORTER'
    const orderScope = isExporter ? eq(orders.exporterCompanyId, company.id) : eq(orders.importerCompanyId, company.id)

    const count = async (q: PromiseLike<{ c: number }[]>) => (await q)[0]?.c ?? 0
    const awaiting = await count(
      ctx.db.select({ c: sql<number>`count(*)::int` }).from(orders).where(and(orderScope, eq(orders.status, 'AWAITING_CONFIRMATION'))),
    )
    const confirmed = await count(ctx.db.select({ c: sql<number>`count(*)::int` }).from(orders).where(and(orderScope, eq(orders.status, 'CONFIRMED'))))
    const inProgress = await count(
      ctx.db
        .select({ c: sql<number>`count(*)::int` })
        .from(shipments)
        .innerJoin(orders, eq(orders.id, shipments.orderId))
        .where(and(orderScope, eq(shipments.status, 'IN_PROGRESS'))),
    )
    const counters: Record<string, number> = { ordersAwaiting: awaiting, ordersConfirmed: confirmed, shipmentsInProgress: inProgress }
    if (isExporter) {
      counters.productsPublished = await count(
        ctx.db.select({ c: sql<number>`count(*)::int` }).from(products).where(and(eq(products.companyId, company.id), eq(products.status, 'PUBLISHED'))),
      )
      counters.productsTotal = await count(ctx.db.select({ c: sql<number>`count(*)::int` }).from(products).where(eq(products.companyId, company.id)))
    } else {
      counters.simulations = await count(ctx.db.select({ c: sql<number>`count(*)::int` }).from(simulations).where(eq(simulations.importerCompanyId, company.id)))
    }

    const [recentOrders, allShipments, docs] = await Promise.all([
      listOrders(ctx, auth),
      listShipments(ctx, isExporter ? { exporterCompanyId: company.id } : { importerCompanyId: company.id }),
      listCompanyDocuments(ctx, company.id),
    ])
    const limit = ctx.now().getTime() + IN_30_DAYS
    const expiringDocuments = docs.filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() < limit)
    counters.documentsExpiring = expiringDocuments.length

    return {
      role: company.type,
      counters,
      recentOrders: recentOrders.slice(0, 5),
      activeShipments: allShipments.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'DISPUTE').slice(0, 5),
      expiringDocuments,
    }
  })
}
