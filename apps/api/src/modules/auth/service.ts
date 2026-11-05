import { and, eq, gt, isNull } from 'drizzle-orm'
import type { RegisterInput, SessionUser } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { companies, companyMembers, companySections, emailTokens, refreshTokens, users } from '../../db/schema'
import { audit } from '../../lib/audit'
import { hashPassword, randomToken, sha256Hex, verifyPassword } from '../../lib/crypto'
import { AppError, conflict, forbidden, notFound, unauthorized } from '../../lib/errors'
import { msg } from '../../lib/messages'
import { signAccessToken, type AuthContext } from '../../plugins/auth'

const MAX_FAILED_LOGINS = 8
const LOCK_MINUTES = 15

export interface RequestMeta {
  ip?: string
  userAgent?: string
}

export const toSessionUser = (a: AuthContext): SessionUser => ({
  id: a.user.id,
  email: a.user.email,
  fullName: a.user.fullName,
  locale: a.user.locale,
  emailVerified: !!a.user.emailVerifiedAt,
  platformRole: a.user.platformRole,
  company: a.company && a.memberRole
    ? { id: a.company.id, type: a.company.type, legalName: a.company.legalName, onboardingStatus: a.company.onboardingStatus, memberRole: a.memberRole }
    : null,
})

async function createEmailToken(ctx: AppContext, userId: string, kind: 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'INVITE', ttlSec: number) {
  const token = randomToken(32)
  await ctx.db.insert(emailTokens).values({
    userId,
    kind,
    tokenHash: sha256Hex(token),
    expiresAt: new Date(ctx.now().getTime() + ttlSec * 1000),
  })
  return token
}

export async function sendVerificationEmail(ctx: AppContext, user: { id: string; email: string; fullName: string; locale: 'pt' | 'en' }) {
  const token = await createEmailToken(ctx, user.id, 'VERIFY_EMAIL', 48 * 3600)
  const link = `${ctx.config.WEB_ORIGIN}/${user.locale}/verify-email?token=${token}`
  await ctx.mailer.send({
    to: user.email,
    subject: msg(user.locale, 'email.verify.subject'),
    text: msg(user.locale, 'email.verify.body', { name: user.fullName, link }),
  })
}

// ------------------------------------------------------------------ registro
export async function register(ctx: AppContext, input: RegisterInput, meta: RequestMeta) {
  const existing = await ctx.db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1)
  if (existing.length) throw conflict('email_in_use', 'E-mail já cadastrado')

  const passwordHash = await hashPassword(input.password)
  const created = await ctx.db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: input.email, passwordHash, fullName: input.fullName, phone: input.phone, locale: input.locale })
      .returning()
    const [company] = await tx
      .insert(companies)
      .values({ type: input.companyType, legalName: input.companyName, country: input.country })
      .returning()
    await tx.insert(companyMembers).values({ companyId: company!.id, userId: user!.id, role: 'OWNER' })
    // pré-preenche a seção "empresa" com o que já sabemos
    await tx.insert(companySections).values({
      companyId: company!.id,
      sectionKey: 'company',
      data: input.companyType === 'IMPORTER' ? { legalName: input.companyName, country: input.country } : { legalName: input.companyName },
      updatedBy: user!.id,
    })
    await audit(tx, { actorUserId: user!.id, companyId: company!.id, action: 'auth.register', entityType: 'user', entityId: user!.id, ip: meta.ip })
    return { user: user!, company: company! }
  })

  await sendVerificationEmail(ctx, created.user)
  return created
}

// ------------------------------------------------------------------ sessões
async function issueSession(ctx: AppContext, userId: string, familyId: string | null, meta: RequestMeta) {
  const refresh = randomToken(48)
  const [row] = await ctx.db
    .insert(refreshTokens)
    .values({
      userId,
      familyId: familyId ?? crypto.randomUUID(),
      tokenHash: sha256Hex(refresh),
      expiresAt: new Date(ctx.now().getTime() + ctx.config.REFRESH_TOKEN_TTL_SEC * 1000),
      userAgent: meta.userAgent?.slice(0, 300),
      ip: meta.ip,
    })
    .returning()
  const access = await signAccessToken(ctx, userId)
  return { access, refresh, refreshId: row!.id, familyId: row!.familyId }
}

export async function login(ctx: AppContext, email: string, password: string, meta: RequestMeta) {
  const [user] = await ctx.db.select().from(users).where(eq(users.email, email)).limit(1)
  // resposta uniforme para não revelar se o e-mail existe
  if (!user) {
    await hashPassword(password) // equaliza o tempo de resposta
    throw unauthorized('invalid_credentials')
  }
  if (user.disabledAt) throw forbidden('account_disabled')
  if (user.lockedUntil && user.lockedUntil > ctx.now()) throw new AppError(423, 'account_locked', 'Conta bloqueada temporariamente por tentativas inválidas')

  const ok = await verifyPassword(user.passwordHash, password)
  if (!ok) {
    const failed = user.failedLogins + 1
    await ctx.db
      .update(users)
      .set({
        failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(ctx.now().getTime() + LOCK_MINUTES * 60_000) : user.lockedUntil,
      })
      .where(eq(users.id, user.id))
    await audit(ctx.db, { actorUserId: user.id, action: 'auth.login_failed', ip: meta.ip })
    throw unauthorized('invalid_credentials')
  }
  await ctx.db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: ctx.now() }).where(eq(users.id, user.id))
  const session = await issueSession(ctx, user.id, null, meta)
  await audit(ctx.db, { actorUserId: user.id, action: 'auth.login', ip: meta.ip })
  return { userId: user.id, ...session }
}

/** Rotação de refresh token com detecção de reuso (token já usado ⇒ revoga a família inteira). */
export async function refreshSession(ctx: AppContext, token: string, meta: RequestMeta) {
  const [row] = await ctx.db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, sha256Hex(token))).limit(1)
  if (!row) throw unauthorized('invalid_refresh_token')
  if (row.revokedAt) {
    await ctx.db.update(refreshTokens).set({ revokedAt: ctx.now() }).where(and(eq(refreshTokens.familyId, row.familyId), isNull(refreshTokens.revokedAt)))
    await audit(ctx.db, { actorUserId: row.userId, action: 'auth.refresh_reuse_detected', ip: meta.ip })
    throw unauthorized('refresh_token_reused')
  }
  if (row.expiresAt < ctx.now()) throw unauthorized('refresh_token_expired')
  const [user] = await ctx.db.select({ disabledAt: users.disabledAt }).from(users).where(eq(users.id, row.userId)).limit(1)
  if (!user || user.disabledAt) throw unauthorized('account_disabled')

  const next = await issueSession(ctx, row.userId, row.familyId, meta)
  await ctx.db.update(refreshTokens).set({ revokedAt: ctx.now(), replacedById: next.refreshId }).where(eq(refreshTokens.id, row.id))
  return { userId: row.userId, ...next }
}

export async function logout(ctx: AppContext, refreshToken: string | undefined) {
  if (!refreshToken) return
  const [row] = await ctx.db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, sha256Hex(refreshToken))).limit(1)
  if (!row) return
  await ctx.db.update(refreshTokens).set({ revokedAt: ctx.now() }).where(and(eq(refreshTokens.familyId, row.familyId), isNull(refreshTokens.revokedAt)))
}

// ------------------------------------------------------------------ e-mail / senha
export async function verifyEmail(ctx: AppContext, token: string) {
  const [row] = await ctx.db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, sha256Hex(token)), eq(emailTokens.kind, 'VERIFY_EMAIL'), isNull(emailTokens.usedAt), gt(emailTokens.expiresAt, ctx.now())))
    .limit(1)
  if (!row) throw unauthorized('invalid_or_expired_token')
  await ctx.db.transaction(async (tx) => {
    await tx.update(emailTokens).set({ usedAt: ctx.now() }).where(eq(emailTokens.id, row.id))
    await tx.update(users).set({ emailVerifiedAt: ctx.now() }).where(eq(users.id, row.userId))
  })
}

export async function requestPasswordReset(ctx: AppContext, email: string) {
  const [user] = await ctx.db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user || user.disabledAt) return // sem vazar existência
  const token = await createEmailToken(ctx, user.id, 'RESET_PASSWORD', 3600)
  const link = `${ctx.config.WEB_ORIGIN}/${user.locale}/reset-password?token=${token}`
  await ctx.mailer.send({
    to: user.email,
    subject: msg(user.locale, 'email.reset.subject'),
    text: msg(user.locale, 'email.reset.body', { name: user.fullName, link }),
  })
}

export async function resetPassword(ctx: AppContext, token: string, password: string) {
  const [row] = await ctx.db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, sha256Hex(token)), isNull(emailTokens.usedAt), gt(emailTokens.expiresAt, ctx.now())))
    .limit(1)
  if (!row || (row.kind !== 'RESET_PASSWORD' && row.kind !== 'INVITE')) throw unauthorized('invalid_or_expired_token')
  const passwordHash = await hashPassword(password)
  await ctx.db.transaction(async (tx) => {
    await tx.update(emailTokens).set({ usedAt: ctx.now() }).where(eq(emailTokens.id, row.id))
    await tx
      .update(users)
      .set({ passwordHash, failedLogins: 0, lockedUntil: null, emailVerifiedAt: ctx.now() })
      .where(eq(users.id, row.userId))
    await tx.update(refreshTokens).set({ revokedAt: ctx.now() }).where(and(eq(refreshTokens.userId, row.userId), isNull(refreshTokens.revokedAt)))
  })
}

export async function changePassword(ctx: AppContext, userId: string, current: string, next: string) {
  const [user] = await ctx.db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user || !(await verifyPassword(user.passwordHash, current))) throw unauthorized('invalid_credentials')
  const passwordHash = await hashPassword(next)
  await ctx.db.update(users).set({ passwordHash }).where(eq(users.id, userId))
  await ctx.db.update(refreshTokens).set({ revokedAt: ctx.now() }).where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
}

// ------------------------------------------------------------------ equipe
export async function listMembers(ctx: AppContext, companyId: string) {
  return ctx.db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: companyMembers.role,
      emailVerified: users.emailVerifiedAt,
      createdAt: companyMembers.createdAt,
    })
    .from(companyMembers)
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .where(eq(companyMembers.companyId, companyId))
}

export async function inviteMember(
  ctx: AppContext,
  auth: AuthContext,
  input: { email: string; fullName: string; role: 'ADMIN' | 'OPERATOR' | 'VIEWER' },
) {
  if (!auth.company) throw forbidden('no_company')
  const existing = await ctx.db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1)
  if (existing.length) throw conflict('email_in_use', 'E-mail já cadastrado')
  const user = await ctx.db.transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({ email: input.email, fullName: input.fullName, passwordHash: await hashPassword(randomToken(24)), locale: auth.user.locale })
      .returning()
    await tx.insert(companyMembers).values({ companyId: auth.company!.id, userId: u!.id, role: input.role })
    await audit(tx, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'team.invite', entityType: 'user', entityId: u!.id })
    return u!
  })
  const token = await createEmailToken(ctx, user.id, 'INVITE', 7 * 24 * 3600)
  const link = `${ctx.config.WEB_ORIGIN}/${user.locale}/reset-password?token=${token}`
  await ctx.mailer.send({
    to: user.email,
    subject: msg(user.locale, 'email.invite.subject'),
    text: msg(user.locale, 'email.invite.body', { name: user.fullName, inviter: auth.user.fullName, company: auth.company.legalName, link }),
  })
  return user
}

export async function removeMember(ctx: AppContext, auth: AuthContext, userId: string) {
  if (!auth.company) throw forbidden('no_company')
  const [m] = await ctx.db
    .select()
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, auth.company.id), eq(companyMembers.userId, userId)))
    .limit(1)
  if (!m) throw notFound('member_not_found')
  if (m.role === 'OWNER') throw forbidden('cannot_remove_owner')
  await ctx.db.update(users).set({ disabledAt: ctx.now() }).where(eq(users.id, userId))
  await ctx.db.delete(companyMembers).where(eq(companyMembers.id, m.id))
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: auth.company.id, action: 'team.remove', entityType: 'user', entityId: userId })
}
