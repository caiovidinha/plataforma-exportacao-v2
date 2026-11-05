import { buildApp } from './app'
import { createContext } from './bootstrap'
import { registerModules } from './modules'
import { startWorker } from './modules/integrations/worker'

const ctx = await createContext()
const app = await buildApp(ctx, { extraRoutes: registerModules })

const worker = ctx.config.INTEGRATION_WORKER_ENABLED ? startWorker(ctx, app.log) : null

const shutdown = async (signal: string) => {
  app.log.info(`${signal} recebido, encerrando...`)
  worker?.stop()
  await app.close()
  await ctx.close()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

await app.listen({ port: ctx.config.API_PORT, host: ctx.config.API_HOST })
app.log.info(`Amazon Trade API em http://localhost:${ctx.config.API_PORT} (docs em /docs, db=${ctx.config.DB_DRIVER})`)
