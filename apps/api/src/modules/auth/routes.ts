import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  inviteMemberSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@amazon-trade/shared'
import { unauthorized } from '../../lib/errors'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  requireAuth,
  requireMemberRole,
  setAuthCookies,
} from '../../plugins/auth'
import * as service from './service'

const strict = { rateLimit: { max: 10, timeWindow: '1 minute' } }

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  const ctx = app.ctx
  const meta = (req: { ip: string; headers: Record<string, unknown> }) => ({ ip: req.ip, userAgent: String(req.headers['user-agent'] ?? '') })

  app.post('/auth/register', { config: strict, schema: { body: registerInputSchema, tags: ['auth'] } }, async (req, reply) => {
    const { user } = await service.register(ctx, req.body, meta(req))
    const session = await service.login(ctx, req.body.email, req.body.password, meta(req))
    setAuthCookies(ctx, reply, session.access, session.refresh)
    reply.code(201)
    return { id: user.id, email: user.email }
  })

  app.post('/auth/login', { config: strict, schema: { body: loginInputSchema, tags: ['auth'] } }, async (req, reply) => {
    const session = await service.login(ctx, req.body.email, req.body.password, meta(req))
    setAuthCookies(ctx, reply, session.access, session.refresh)
    return { userId: session.userId, accessToken: session.access }
  })

  app.post('/auth/refresh', { config: strict, schema: { tags: ['auth'] } }, async (req, reply) => {
    const token = req.cookies?.[REFRESH_COOKIE] ?? (req.body as { refreshToken?: string } | undefined)?.refreshToken
    if (!token) throw unauthorized('no_refresh_token')
    const session = await service.refreshSession(ctx, token, meta(req))
    setAuthCookies(ctx, reply, session.access, session.refresh)
    return { ok: true, accessToken: session.access }
  })

  app.post('/auth/logout', { schema: { tags: ['auth'] } }, async (req, reply) => {
    await service.logout(ctx, req.cookies?.[REFRESH_COOKIE])
    clearAuthCookies(reply)
    return { ok: true }
  })

  app.get('/auth/me', { preHandler: requireAuth, schema: { tags: ['auth'] } }, async (req) => service.toSessionUser(req.auth!))

  app.post('/auth/verify-email', { config: strict, schema: { body: verifyEmailSchema, tags: ['auth'] } }, async (req) => {
    await service.verifyEmail(ctx, req.body.token)
    return { ok: true }
  })

  app.post('/auth/resend-verification', { config: strict, preHandler: requireAuth, schema: { tags: ['auth'] } }, async (req) => {
    if (!req.auth!.user.emailVerifiedAt) await service.sendVerificationEmail(ctx, req.auth!.user)
    return { ok: true }
  })

  app.post('/auth/forgot-password', { config: strict, schema: { body: forgotPasswordSchema, tags: ['auth'] } }, async (req) => {
    await service.requestPasswordReset(ctx, req.body.email)
    return { ok: true }
  })

  app.post('/auth/reset-password', { config: strict, schema: { body: resetPasswordSchema, tags: ['auth'] } }, async (req) => {
    await service.resetPassword(ctx, req.body.token, req.body.password)
    return { ok: true }
  })

  app.post('/auth/change-password', { preHandler: requireAuth, schema: { body: changePasswordSchema, tags: ['auth'] } }, async (req, reply) => {
    await service.changePassword(ctx, req.auth!.user.id, req.body.currentPassword, req.body.newPassword)
    clearAuthCookies(reply)
    return { ok: true }
  })

  // ---- equipe da empresa ----
  app.get('/team', { preHandler: requireAuth, schema: { tags: ['team'] } }, async (req) => {
    if (!req.auth!.company) return []
    const rows = await service.listMembers(ctx, req.auth!.company.id)
    return rows.map((r) => ({ ...r, emailVerified: !!r.emailVerified, createdAt: r.createdAt.toISOString() }))
  })

  app.post('/team/invite', { preHandler: requireMemberRole('ADMIN'), schema: { body: inviteMemberSchema, tags: ['team'] } }, async (req, reply) => {
    const u = await service.inviteMember(ctx, req.auth!, req.body)
    reply.code(201)
    return { id: u.id, email: u.email }
  })

  app.delete('/team/:id', { preHandler: requireMemberRole('ADMIN'), schema: { params: z.object({ id: z.uuid() }), tags: ['team'] } }, async (req) => {
    await service.removeMember(ctx, req.auth!, req.params.id)
    return { ok: true }
  })

  void ACCESS_COOKIE
}
