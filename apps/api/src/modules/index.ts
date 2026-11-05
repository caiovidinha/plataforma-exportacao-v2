import type { FastifyInstance } from 'fastify'
import { catalogRoutes } from './catalog/routes'
import { companyRoutes } from './companies/routes'
import { dashboardRoutes } from './dashboard/routes'
import { integrationAdminRoutes } from './integrations/routes'
import { partnerActionRoutes, webhookRoutes } from './integrations/public-routes'
import { notificationRoutes } from './notifications/routes'
import { orderRoutes } from './orders/routes'
import { pricingAdminRoutes } from './pricing/routes'
import { shipmentRoutes } from './shipments/routes'
import { simulationRoutes } from './simulations/routes'

/** Registro central de módulos de domínio (cada fase acrescenta o seu). */
export async function registerModules(app: FastifyInstance) {
  await app.register(companyRoutes)
  await app.register(catalogRoutes)
  await app.register(pricingAdminRoutes)
  await app.register(simulationRoutes)
  await app.register(orderRoutes)
  await app.register(shipmentRoutes)
  await app.register(notificationRoutes)
  await app.register(dashboardRoutes)
  await app.register(integrationAdminRoutes)
  await app.register(webhookRoutes)
  await app.register(partnerActionRoutes)
}
