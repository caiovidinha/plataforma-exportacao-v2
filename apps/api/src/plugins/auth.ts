import { eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { jwtVerify, SignJWT } from 'jose'
import type { CompanyType, MemberRole, OnboardingStatus, PlatformRole } from '@amazon-trade/shared'
import type { AppContext } from '../context'
import { companies, companyMembers, users } from '../db/schema'
import { forbidden, unauthorized } from '../lib/errors'

export interface AuthContext {
  user: {
    id: string
    email: string
    fullName: string
    locale: 'pt' | 'en' | 'es'
    platformRole: PlatformRole
    emailVerifiedAt: Date | null
  }
  company: { id: string; type: CompanyType; legalName: string; onboardingStatus: OnboardingStatus; country: string } | null
  memberRole: MemberRole | null
  via: 'cookie' | 'bearer'
}

declare module 'fastify' {
  interface FastifyInstance {
    ctx: AppContext
  }
  interface FastifyRequest {
    auth: AuthContext | null
  }
}

export const ACCESS_COOKIE = 'at_access'
export const REFRESH_COOKIE = 'at_refresh'
const ISSUER = 'amazon-trade'
export const CSRF_HEADER = 'x-requested-with'
export const CSRF_VALUE = 'amazon-trade'

const key = (secret: string) => new TextEncoder().encode(secret)

export function signAccessToken(ctx: AppContext, userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ctx.config.ACCESS_TOKEN_TTL_SEC}s`)
    .sign(key(ctx.config.JWT_SECRET))
}

async function verifyAccessToken(ctx: AppContext, token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(ctx.config.JWT_SECRET), { issuer: ISSUER })
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function setAuthCookies(ctx: AppContext, reply: FastifyReply, access: string, refresh: string) {
  const base = { httpOnly: true, sameSite: 'lax' as const, secure: ctx.config.COOKIE_SECURE, path: '/' }
  reply.setCookie(ACCESS_COOKIE, access, { ...base, maxAge: ctx.config.ACCESS_TOKEN_TTL_SEC })
  reply.setCookie(REFRESH_COOKIE, refresh, { ...base, maxAge: ctx.config.REFRESH_TOKEN_TTL_SEC })
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie(ACCESS_COOKIE, { path: '/' })
  reply.clearCookie(REFRESH_COOKIE, { path: '/' })
}

async function loadAuth(ctx: AppContext, userId: string, via: 'cookie' | 'bearer'): Promise<AuthContext | null> {
  const rows = await ctx.db
    .select({
      user: users,
      company: companies,
      memberRole: companyMembers.role,
    })
    .from(users)
    .leftJoin(companyMembers, eq(companyMembers.userId, users.id))
    .leftJoin(companies, eq(companies.id, companyMembers.companyId))
    .where(eq(users.id, userId))
    .limit(1)
  const row = rows[0]
  if (!row || row.user.disabledAt) return null
  return {
    via,
    user: {
      id: row.user.id,
      email: row.user.email,
      fullName: row.user.fullName,
      locale: row.user.locale,
      platformRole: row.user.platformRole,
      emailVerifiedAt: row.user.emailVerifiedAt,
    },
    company: row.company
      ? {
          id: row.company.id,
          type: row.company.type,
          legalName: row.company.legalName,
          onboardingStatus: row.company.onboardingStatus,
          country: row.company.country,
        }
      : null,
    memberRole: row.memberRole ?? null,
  }
}

/** Resolve a sessão (cookie httpOnly ou Bearer) em `request.auth`. Guards decidem o que exigir. */
export const authPlugin = fp(async (app) => {
  app.decorateRequest('auth', null)
  app.addHook('onRequest', async (req) => {
    const header = req.headers.authorization
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
    const token = bearer ?? req.cookies?.[ACCESS_COOKIE]
    if (!token) return
    const userId = await verifyAccessToken(app.ctx, token)
    if (!userId) return
    const auth = await loadAuth(app.ctx, userId, bearer ? 'bearer' : 'cookie')
    if (!auth) return
    // Defesa CSRF para sessões por cookie: exige header customizado em métodos que alteram estado.
    const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    if (auth.via === 'cookie' && unsafe && req.headers[CSRF_HEADER] !== CSRF_VALUE) {
      throw forbidden('csrf_check_failed', 'Missing CSRF header')
    }
    req.auth = auth
  })
})

// ------------------------------------------------------------------ guards
export const requireAuth = async (req: FastifyRequest) => {
  if (!req.auth) throw unauthorized('not_authenticated')
}

export const requireVerifiedEmail = async (req: FastifyRequest) => {
  await requireAuth(req)
  if (!req.auth!.user.emailVerifiedAt) throw forbidden('email_not_verified')
}

export const requireCompany = (type?: CompanyType) => async (req: FastifyRequest) => {
  await requireAuth(req)
  const c = req.auth!.company
  if (!c) throw forbidden('no_company')
  if (type && c.type !== type) throw forbidden('wrong_company_type')
}

/** Empresa aprovada na análise de compliance. */
export const requireApprovedCompany = (type?: CompanyType) => async (req: FastifyRequest) => {
  await requireCompany(type)(req)
  if (req.auth!.company!.onboardingStatus !== 'APPROVED') throw forbidden('company_not_approved')
}

const ROLE_RANK: Record<MemberRole, number> = { VIEWER: 1, OPERATOR: 2, ADMIN: 3, OWNER: 4 }
export const requireMemberRole = (min: MemberRole) => async (req: FastifyRequest) => {
  await requireAuth(req)
  const role = req.auth!.memberRole
  if (!role || ROLE_RANK[role] < ROLE_RANK[min]) throw forbidden('insufficient_role')
}

export const requirePlatformRole = (...roles: PlatformRole[]) => async (req: FastifyRequest) => {
  await requireAuth(req)
  const r = req.auth!.user.platformRole
  if (!roles.includes(r) && r !== 'PLATFORM_ADMIN') throw forbidden('insufficient_platform_role')
}

export const clientIp = (req: FastifyRequest) => req.ip
