import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { DOCUMENT_UPLOAD_RULES } from '@amazon-trade/shared'
import type { AppContext } from './context'
import { AppError } from './lib/errors'
import { authPlugin } from './plugins/auth'
import { authRoutes } from './modules/auth/routes'
import { healthRoutes } from './modules/health/routes'

export interface BuildAppOptions {
  rateLimit?: boolean
  logger?: boolean
  /** Registra rotas adicionais (módulos) — usado para compor a API por fases. */
  extraRoutes?: (app: FastifyInstance) => Promise<void>
}

export async function buildApp(ctx: AppContext, opts: BuildAppOptions = {}) {
  const dev = ctx.config.NODE_ENV === 'development'
  const app = Fastify({
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
    logger: opts.logger === false
      ? false
      : {
          level: ctx.config.LOG_LEVEL,
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          transport: dev ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } : undefined,
        },
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.decorate('ctx', ctx)

  await app.register(helmet, { contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } })
  await app.register(cors, {
    origin: ctx.config.WEB_ORIGIN.split(','),
    credentials: true,
    allowedHeaders: ['content-type', 'authorization', 'x-requested-with'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
  await app.register(cookie)
  if (opts.rateLimit !== false) await app.register(rateLimit, { global: true, max: 600, timeWindow: '1 minute' })
  await app.register(multipart, { limits: { fileSize: DOCUMENT_UPLOAD_RULES.maxBytes, files: 1, fields: 10 } })

  await app.register(swagger, {
    openapi: {
      info: { title: 'Amazon Trade API', version: '3.0.0', description: 'API da plataforma Amazon Trade (exportadores, importadores e parceiros).' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' }, cookieAuth: { type: 'apiKey', in: 'cookie', name: 'at_access' } } },
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  await app.register(authPlugin)

  app.setErrorHandler((error, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: {
          code: 'validation_error',
          message: 'Dados inválidos',
          details: error.validation.map((v) => ({ path: v.instancePath.replace(/^\//, '').replace(/\//g, '.'), message: v.message, params: v.params })),
        },
      })
    }
    if (isResponseSerializationError(error)) {
      req.log.error({ err: error }, 'response serialization failed')
      return reply.code(500).send({ error: { code: 'serialization_error', message: 'Erro interno' } })
    }
    if (error instanceof AppError) {
      return reply.code(error.status).send({ error: { code: error.code, message: error.message, details: error.details } })
    }
    const e = error as { statusCode?: number; code?: string; message?: string }
    if (e.statusCode && e.statusCode < 500) {
      return reply.code(e.statusCode).send({ error: { code: e.code?.toLowerCase() ?? 'request_error', message: e.message } })
    }
    req.log.error({ err: error }, 'unhandled error')
    return reply.code(500).send({ error: { code: 'internal_error', message: 'Erro interno' } })
  })

  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: { code: 'not_found', message: 'Rota não encontrada' } }))

  await app.register(healthRoutes)
  await app.register(authRoutes)
  if (opts.extraRoutes) await opts.extraRoutes(app)

  return app
}
