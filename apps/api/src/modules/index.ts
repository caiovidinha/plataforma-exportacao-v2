import type { FastifyInstance } from 'fastify'
import { companyRoutes } from './companies/routes'

/** Registro central de módulos de domínio (cada fase acrescenta o seu). */
export async function registerModules(app: FastifyInstance) {
  await app.register(companyRoutes)
}
