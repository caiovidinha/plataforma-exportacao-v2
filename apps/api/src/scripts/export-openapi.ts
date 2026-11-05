import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildApp } from '../app'
import { createContext } from '../bootstrap'
import { registerModules } from '../modules'

/** Gera `docs/openapi.json` a partir das rotas (zod → OpenAPI). Usa banco em memória; não toca em dados reais. */
const ctx = await createContext({ DB_DRIVER: 'pglite', PGLITE_DATA_DIR: 'memory://', INTEGRATION_WORKER_ENABLED: false, MAIL_DRIVER: 'memory' })
const app = await buildApp(ctx, { rateLimit: false, logger: false, extraRoutes: registerModules })
await app.ready()
const out = path.resolve(import.meta.dirname, '../../../../docs/openapi.json')
mkdirSync(path.dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(app.swagger(), null, 2) + '\n')
console.log(`[openapi] escrito em ${out}`)
await app.close()
await ctx.close()
