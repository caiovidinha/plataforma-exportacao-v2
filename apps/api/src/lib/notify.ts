import { and, eq, inArray } from 'drizzle-orm'
import type { PlatformRole } from '@amazon-trade/shared'
import type { AppContext } from '../context'
import { companyMembers, notifications, users } from '../db/schema'
import { msg, type MessageKey } from './messages'

export interface NotifyOptions {
  kind: string
  titleKey: MessageKey
  bodyKey?: MessageKey
  vars?: Record<string, string | number>
  link?: string
  /** Também envia e-mail (usuários com e-mail verificado). */
  email?: boolean
}

async function deliver(ctx: AppContext, recipients: { id: string; email: string; locale: 'pt' | 'en'; emailVerifiedAt: Date | null }[], o: NotifyOptions) {
  for (const u of recipients) {
    const title = msg(u.locale, o.titleKey, o.vars)
    const body = o.bodyKey ? msg(u.locale, o.bodyKey, o.vars) : ''
    await ctx.db.insert(notifications).values({ userId: u.id, kind: o.kind, title, body, link: o.link ?? null })
    if (o.email && u.emailVerifiedAt) {
      const link = o.link ? `${ctx.config.WEB_ORIGIN}${o.link}` : ctx.config.WEB_ORIGIN
      await ctx.mailer.send({ to: u.email, subject: `${title} — Amazon Trade`, text: `${title}\n\n${body}\n\n${link}` })
    }
  }
}

/** Notifica todos os membros ativos de uma empresa. */
export async function notifyCompany(ctx: AppContext, companyId: string, o: NotifyOptions) {
  const recipients = await ctx.db
    .select({ id: users.id, email: users.email, locale: users.locale, emailVerifiedAt: users.emailVerifiedAt })
    .from(companyMembers)
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .where(eq(companyMembers.companyId, companyId))
  await deliver(ctx, recipients, o)
}

/** Notifica equipe da plataforma por papel (compliance, operações, admin). */
export async function notifyStaff(ctx: AppContext, roles: PlatformRole[], o: NotifyOptions) {
  const recipients = await ctx.db
    .select({ id: users.id, email: users.email, locale: users.locale, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(and(inArray(users.platformRole, roles)))
  await deliver(ctx, recipients, o)
}
