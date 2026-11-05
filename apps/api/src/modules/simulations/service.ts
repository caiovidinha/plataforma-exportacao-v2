import { desc, eq, and } from 'drizzle-orm'
import type { SimulationDto, SimulationInput } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { companies, products, simulations } from '../../db/schema'
import { audit } from '../../lib/audit'
import { notFound } from '../../lib/errors'
import type { AuthContext } from '../../plugins/auth'
import { simulate } from '../pricing/engine'

type SimRow = typeof simulations.$inferSelect

const toDto = (s: SimRow, productName: string): SimulationDto => ({
  id: s.id,
  productId: s.productId,
  productName,
  createdAt: s.createdAt.toISOString(),
  expiresAt: s.expiresAt.toISOString(),
  result: s.result,
})

export async function createSimulation(ctx: AppContext, auth: AuthContext, input: SimulationInput): Promise<SimulationDto> {
  const [row] = await ctx.db
    .select({ p: products, c: companies })
    .from(products)
    .innerJoin(companies, eq(companies.id, products.companyId))
    .where(eq(products.id, input.productId))
    .limit(1)
  if (!row || row.p.status !== 'PUBLISHED' || row.c.onboardingStatus !== 'APPROVED') throw notFound('product_not_found')

  const result = await simulate(ctx, input, row.p)
  const [sim] = await ctx.db
    .insert(simulations)
    .values({
      importerCompanyId: auth.company!.id,
      userId: auth.user.id,
      productId: row.p.id,
      input,
      result,
      expiresAt: new Date(result.validUntil),
    })
    .returning()
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'simulation.created', entityType: 'simulation', entityId: sim!.id, meta: { incoterm: input.incoterm } })
  return toDto(sim!, row.p.name)
}

export async function listSimulations(ctx: AppContext, auth: AuthContext) {
  const rows = await ctx.db
    .select({ s: simulations, name: products.name })
    .from(simulations)
    .innerJoin(products, eq(products.id, simulations.productId))
    .where(eq(simulations.importerCompanyId, auth.company!.id))
    .orderBy(desc(simulations.createdAt))
    .limit(50)
  return rows.map((r) => toDto(r.s, r.name))
}

export async function getSimulation(ctx: AppContext, auth: AuthContext, id: string) {
  const [row] = await ctx.db
    .select({ s: simulations, name: products.name })
    .from(simulations)
    .innerJoin(products, eq(products.id, simulations.productId))
    .where(and(eq(simulations.id, id), eq(simulations.importerCompanyId, auth.company!.id)))
    .limit(1)
  if (!row) throw notFound('simulation_not_found')
  return toDto(row.s, row.name)
}
