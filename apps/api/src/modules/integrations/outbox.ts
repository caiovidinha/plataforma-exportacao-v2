import { and, asc, eq, inArray, lte, or, isNull, sql } from 'drizzle-orm'
import type { IntegrationOperation, PartnerType } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import type { DbOrTx } from '../../db/client'
import { integrationJobs, partners } from '../../db/schema'

/**
 * OUTBOX de integrações: toda chamada a parceiro vira um job persistido (idempotente),
 * processado por worker com retry/backoff. Nada chama parceiro direto no ciclo da requisição.
 */
export interface EnqueueInput {
  partnerType: PartnerType
  operation: IntegrationOperation
  shipmentId: string | null
  taskKey: string | null
  payload: Record<string, unknown>
  /** Chave de idempotência; por padrão `${shipmentId}:${operation}:${taskKey}`. */
  idempotencyKey?: string
}

/** Escolhe o parceiro ativo do tipo (preferindo quem tem integração habilitada). */
export async function pickPartner(ctx: AppContext, db: DbOrTx, type: PartnerType) {
  const list = await db.select().from(partners).where(and(eq(partners.type, type), eq(partners.active, true))).orderBy(asc(partners.createdAt))
  return list[0] ?? null
}

export async function enqueueJob(ctx: AppContext, db: DbOrTx, input: EnqueueInput) {
  const partner = await pickPartner(ctx, db, input.partnerType)
  if (!partner) return { queued: false as const, reason: 'no_partner' as const }
  const key = input.idempotencyKey ?? `${input.shipmentId ?? 'none'}:${input.operation}:${input.taskKey ?? 'none'}`
  const rows = await db
    .insert(integrationJobs)
    .values({
      idempotencyKey: key,
      partnerId: partner.id,
      shipmentId: input.shipmentId,
      taskKey: input.taskKey,
      operation: input.operation,
      payload: input.payload,
      nextAttemptAt: ctx.now(),
    })
    .onConflictDoNothing({ target: integrationJobs.idempotencyKey })
    .returning()
  return { queued: true as const, partnerId: partner.id, jobId: rows[0]?.id ?? null, duplicate: rows.length === 0 }
}

/** Próxima tentativa com backoff exponencial + jitter (base 30s, teto 6h). */
export function nextAttemptDelayMs(attempt: number, rand = Math.random): number {
  const base = Math.min(30_000 * 2 ** (attempt - 1), 6 * 3600_000)
  return Math.round(base * (0.75 + rand() * 0.5))
}

export async function claimDueJobs(ctx: AppContext, limit = 5) {
  const now = ctx.now()
  // trava otimista: marca RUNNING só quem ainda estiver QUEUED/FAILED e vencido
  const due = await ctx.db
    .select({ id: integrationJobs.id })
    .from(integrationJobs)
    .where(and(inArray(integrationJobs.status, ['QUEUED', 'FAILED']), or(isNull(integrationJobs.nextAttemptAt), lte(integrationJobs.nextAttemptAt, now))))
    .orderBy(asc(integrationJobs.createdAt))
    .limit(limit)
  const claimed: string[] = []
  for (const d of due) {
    const res = await ctx.db
      .update(integrationJobs)
      .set({ status: 'RUNNING', lockedAt: now, attempts: sql`${integrationJobs.attempts} + 1` })
      .where(and(eq(integrationJobs.id, d.id), inArray(integrationJobs.status, ['QUEUED', 'FAILED'])))
      .returning({ id: integrationJobs.id })
    if (res.length) claimed.push(d.id)
  }
  return claimed
}
