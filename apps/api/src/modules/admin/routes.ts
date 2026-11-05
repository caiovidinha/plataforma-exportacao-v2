import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { COMPANY_TYPES, ONBOARDING_STATUSES, PLATFORM_ROLES } from '@amazon-trade/shared'
import { companies, companyMembers, integrationJobs, orders, shipments, users } from '../../db/schema'
import { audit } from '../../lib/audit'
import { forbidden, notFound } from '../../lib/errors'
import { requirePlatformRole } from '../../plugins/auth'

const limitQ = z.coerce.number().int().min(1).max(200).default(50)
const count = async (q: PromiseLike<{ c: number }[]>) => (await q)[0]?.c ?? 0

/** Visão geral, usuários e empresas para o backoffice. */
export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const staff = requirePlatformRole('OPERATIONS', 'COMPLIANCE')
  const superAdmin = requirePlatformRole() // somente PLATFORM_ADMIN (o guard já libera esse papel)
  const tags = ['admin']

  app.get('/admin/overview', { preHandler: staff, schema: { tags } }, async () => {
    const c = sql<number>`count(*)::int`
    return {
      companiesPendingReview: await count(ctx.db.select({ c }).from(companies).where(or(eq(companies.onboardingStatus, 'SUBMITTED'), eq(companies.onboardingStatus, 'IN_REVIEW')))),
      companiesApproved: await count(ctx.db.select({ c }).from(companies).where(eq(companies.onboardingStatus, 'APPROVED'))),
      ordersAwaiting: await count(ctx.db.select({ c }).from(orders).where(eq(orders.status, 'AWAITING_CONFIRMATION'))),
      shipmentsInProgress: await count(ctx.db.select({ c }).from(shipments).where(eq(shipments.status, 'IN_PROGRESS'))),
      shipmentsDispute: await count(ctx.db.select({ c }).from(shipments).where(eq(shipments.status, 'DISPUTE'))),
      jobsQueued: await count(ctx.db.select({ c }).from(integrationJobs).where(or(eq(integrationJobs.status, 'QUEUED'), eq(integrationJobs.status, 'FAILED')))),
      jobsDead: await count(ctx.db.select({ c }).from(integrationJobs).where(eq(integrationJobs.status, 'DEAD'))),
    }
  })

  app.get(
    '/admin/companies',
    { preHandler: staff, schema: { querystring: z.object({ q: z.string().max(80).optional(), type: z.enum(COMPANY_TYPES).optional(), status: z.enum(ONBOARDING_STATUSES).optional(), limit: limitQ }), tags } },
    async (req) => {
      const { q, type, status, limit } = req.query
      const conds = [q ? ilike(companies.legalName, `%${q.replace(/[%_]/g, '')}%`) : undefined, type ? eq(companies.type, type) : undefined, status ? eq(companies.onboardingStatus, status) : undefined].filter(Boolean) as ReturnType<typeof eq>[]
      const rows = await ctx.db.select().from(companies).where(conds.length ? and(...conds) : undefined).orderBy(desc(companies.createdAt)).limit(limit)
      return rows.map((r) => ({ id: r.id, type: r.type, legalName: r.legalName, tradeName: r.tradeName, country: r.country, onboardingStatus: r.onboardingStatus, createdAt: r.createdAt.toISOString() }))
    },
  )

  app.get(
    '/admin/users',
    { preHandler: superAdmin, schema: { querystring: z.object({ q: z.string().max(80).optional(), limit: limitQ }), tags } },
    async (req) => {
      const { q, limit } = req.query
      const cond = q ? or(ilike(users.email, `%${q.replace(/[%_]/g, '')}%`), ilike(users.fullName, `%${q.replace(/[%_]/g, '')}%`)) : undefined
      const rows = await ctx.db
        .select({ u: users, companyId: companyMembers.companyId, memberRole: companyMembers.role })
        .from(users)
        .leftJoin(companyMembers, eq(companyMembers.userId, users.id))
        .where(cond)
        .orderBy(desc(users.createdAt))
        .limit(limit)
      return rows.map(({ u, companyId, memberRole }) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        platformRole: u.platformRole,
        emailVerified: !!u.emailVerifiedAt,
        disabled: !!u.disabledAt,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        companyId,
        memberRole,
      }))
    },
  )

  app.patch(
    '/admin/users/:id',
    { preHandler: superAdmin, schema: { params: z.object({ id: z.uuid() }), body: z.object({ platformRole: z.enum(PLATFORM_ROLES).optional(), disabled: z.boolean().optional() }), tags } },
    async (req) => {
      if (req.params.id === req.auth!.user.id) throw forbidden('cannot_change_self', 'Você não pode alterar a própria conta')
      const [u] = await ctx.db.select().from(users).where(eq(users.id, req.params.id)).limit(1)
      if (!u) throw notFound('user_not_found')
      const set: Partial<typeof users.$inferInsert> = {}
      if (req.body.platformRole) set.platformRole = req.body.platformRole
      if (req.body.disabled !== undefined) set.disabledAt = req.body.disabled ? ctx.now() : null
      await ctx.db.update(users).set(set).where(eq(users.id, u.id))
      await audit(ctx.db, { actorUserId: req.auth!.user.id, action: 'admin.user_updated', entityType: 'user', entityId: u.id, meta: { ...req.body } })
      return { ok: true }
    },
  )
}
