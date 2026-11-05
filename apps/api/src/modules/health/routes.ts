import { sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/health', { schema: { tags: ['health'] } }, async () => {
    await app.ctx.db.execute(sql`select 1`)
    return { status: 'ok', time: app.ctx.now().toISOString() }
  })
}
