import type { FastifyInstance } from 'fastify'
import { catalogRoutes } from './catalog/routes'
import { companyRoutes } from './companies/routes'
import { pricingAdminRoutes } from './pricing/routes'
import { simulationRoutes } from './simulations/routes'

/** Registro central de módulos de domínio (cada fase acrescenta o seu). */
export async function registerModules(app: FastifyInstance) {
  await app.register(companyRoutes)
  await app.register(catalogRoutes)
  await app.register(pricingAdminRoutes)
  await app.register(simulationRoutes)
}
