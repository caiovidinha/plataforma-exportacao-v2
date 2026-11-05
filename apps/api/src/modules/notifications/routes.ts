import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { NotificationDto } from '@amazon-trade/shared'
import { notifications } from '../../db/schema'
import { requireAuth } from '../../plugins/auth'

const toDto = (n: typeof notifications.$inferSelect): NotificationDto => ({
  id: n.id,
  kind: n.kind,
  title: n.title,
  body: n.body,
  link: n.link,
  readAt: n.readAt?.toISOString() ?? null,
  createdAt: n.createdAt.toISOString(),
})

export const notificationRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx

  app.get('/notifications', { preHandler: requireAuth, schema: { tags: ['notifications'] } }, async (req) => {
    const userId = req.auth!.user.id
    const rows = await ctx.db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50)
    const [{ count }] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    return { unread: count, items: rows.map(toDto) }
  })

  app.post('/notifications/:id/read', { preHandler: requireAuth, schema: { params: z.object({ id: z.uuid() }), tags: ['notifications'] } }, async (req) => {
    await ctx.db.update(notifications).set({ readAt: ctx.now() }).where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.auth!.user.id)))
    return { ok: true }
  })

  app.post('/notifications/read-all', { preHandler: requireAuth, schema: { tags: ['notifications'] } }, async (req) => {
    await ctx.db.update(notifications).set({ readAt: ctx.now() }).where(and(eq(notifications.userId, req.auth!.user.id), isNull(notifications.readAt)))
    return { ok: true }
  })
}
