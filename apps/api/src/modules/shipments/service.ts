import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import {
  MAIN_FLOW,
  STAGE_DEFS,
  getStageDef,
  nextMainStage,
  type EventSource,
  type PartnerType,
  type ShipmentDto,
  type ShipmentEventDto,
  type ShipmentStage,
  type ShipmentTaskDto,
  type ShipmentTrackingDto,
  type TaskStatus,
} from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import type { DbOrTx } from '../../db/client'
import { companies, counters, orders, products, shipmentEvents, shipmentTasks, shipments } from '../../db/schema'
import { audit } from '../../lib/audit'
import { conflict, forbidden, notFound, unprocessable } from '../../lib/errors'
import { notifyCompany, notifyStaff } from '../../lib/notify'
import type { AuthContext } from '../../plugins/auth'
import { enqueueJob } from '../integrations/outbox'

type ShipmentRow = typeof shipments.$inferSelect
type TaskRow = typeof shipmentTasks.$inferSelect

export async function nextNumber(db: DbOrTx, name: string, prefix: string, now: Date) {
  const year = now.getUTCFullYear()
  const key = `${name}:${year}`
  const [row] = await db
    .insert(counters)
    .values({ name: key, value: 1 })
    .onConflictDoUpdate({ target: counters.name, set: { value: sql`${counters.value} + 1` } })
    .returning()
  return `${prefix}-${year}-${String(row!.value).padStart(6, '0')}`
}

export async function addEvent(
  db: DbOrTx,
  e: { shipmentId: string; type: string; source: EventSource; message: string; partnerId?: string | null; partnerType?: PartnerType | null; taskKey?: string | null; data?: Record<string, unknown>; occurredAt?: Date },
) {
  await db.insert(shipmentEvents).values({
    shipmentId: e.shipmentId,
    type: e.type,
    source: e.source,
    message: e.message,
    partnerId: e.partnerId ?? null,
    partnerType: e.partnerType ?? null,
    taskKey: e.taskKey ?? null,
    data: e.data ?? {},
    occurredAt: e.occurredAt ?? new Date(),
  })
}

// ------------------------------------------------------------------ criação
/** Cria o embarque de um pedido confirmado e inicia o estágio NEGÓCIO (dispara pedidos aos parceiros). */
export async function createShipmentForOrder(ctx: AppContext, tx: DbOrTx, order: typeof orders.$inferSelect) {
  const number = await nextNumber(tx, 'shipment', 'SH', ctx.now())
  const [shipment] = await tx.insert(shipments).values({ number, orderId: order.id, stage: 'NEGOCIO', stageEnteredAt: ctx.now() }).returning()
  const rows = MAIN_FLOW.flatMap((stage) =>
    getStageDef(stage).tasks.map((t) => ({ shipmentId: shipment!.id, stage, key: t.key, partnerType: t.partner ?? null, actor: t.actor, required: t.required })),
  )
  await tx.insert(shipmentTasks).values(rows)
  await addEvent(tx, { shipmentId: shipment!.id, type: 'SHIPMENT_CREATED', source: 'PLATFORM', message: `Embarque ${number} criado a partir do pedido ${order.number}` })
  await enterStage(ctx, tx, shipment!, 'NEGOCIO', { silent: true })
  return shipment!
}

// ------------------------------------------------------------------ máquina de estados
/** Entra num estágio: conclui tarefas automáticas, ativa as demais e enfileira pedidos aos parceiros. */
/** Efeitos colaterais (notificações/e-mails) executados só depois do commit da transação. */
export type AfterCommit = (() => Promise<void>)[]

export async function runAfter(after: AfterCommit) {
  for (const fn of after) await fn()
}

export async function enterStage(ctx: AppContext, db: DbOrTx, shipment: ShipmentRow, stage: ShipmentStage, opts: { silent?: boolean; after?: AfterCommit } = {}) {
  const def = getStageDef(stage)
  const now = ctx.now()
  const tasks = await db.select().from(shipmentTasks).where(and(eq(shipmentTasks.shipmentId, shipment.id), eq(shipmentTasks.stage, stage)))
  for (const task of tasks) {
    const taskDef = def.tasks.find((t) => t.key === task.key)
    if (!taskDef || task.status === 'DONE') continue
    if (taskDef.auto) {
      await db.update(shipmentTasks).set({ status: 'DONE', startedAt: now, completedAt: now }).where(eq(shipmentTasks.id, task.id))
      await addEvent(db, { shipmentId: shipment.id, type: 'TASK_DONE', source: 'PLATFORM', taskKey: task.key, message: taskDef.title.pt })
      continue
    }
    if (task.status === 'PENDING') {
      await db.update(shipmentTasks).set({ status: 'IN_PROGRESS', startedAt: now }).where(eq(shipmentTasks.id, task.id))
    }
    if (taskDef.operation && taskDef.partner) {
      const res = await enqueueJob(ctx, db, { partnerType: taskDef.partner, operation: taskDef.operation, shipmentId: shipment.id, taskKey: task.key, payload: { stage } })
      if (!res.queued) {
        await db.update(shipmentTasks).set({ status: 'BLOCKED', note: `Nenhum parceiro ativo cadastrado para ${taskDef.partner}` }).where(eq(shipmentTasks.id, task.id))
        await addEvent(db, { shipmentId: shipment.id, type: 'NO_PARTNER', source: 'SYSTEM', taskKey: task.key, partnerType: taskDef.partner, message: `Sem parceiro ativo para ${taskDef.partner}; tarefa bloqueada` })
      } else {
        await addEvent(db, { shipmentId: shipment.id, type: 'PARTNER_REQUESTED', source: 'PLATFORM', taskKey: task.key, partnerType: taskDef.partner, partnerId: res.partnerId, message: `Solicitação enviada à fila de integração (${taskDef.operation})` })
      }
    }
  }
  await db.update(shipments).set({ stage, stageEnteredAt: now }).where(eq(shipments.id, shipment.id))
  await addEvent(db, { shipmentId: shipment.id, type: 'STAGE_ENTERED', source: 'PLATFORM', message: `Etapa: ${def.title.pt}`, data: { stage } })
  if (!opts.silent) {
    if (opts.after) opts.after.push(() => notifyStageChange(ctx, shipment, stage))
    else await notifyStageChange(ctx, shipment, stage)
  }
}

async function notifyStageChange(ctx: AppContext, shipment: ShipmentRow, stage: ShipmentStage) {
  const [row] = await ctx.db.select({ o: orders }).from(orders).where(eq(orders.id, shipment.orderId)).limit(1)
  if (!row) return
  const vars = { number: shipment.number, stage: getStageDef(stage).title.pt }
  for (const companyId of [row.o.exporterCompanyId, row.o.importerCompanyId]) {
    await notifyCompany(ctx, companyId, { kind: 'shipment', titleKey: 'notif.shipment.stage', bodyKey: 'notif.shipment.stage.body', vars, link: `/shipments/${shipment.id}` })
  }
}

/** Avança enquanto todas as tarefas obrigatórias do estágio atual estiverem concluídas. */
export async function advanceIfComplete(ctx: AppContext, db: DbOrTx, shipmentId: string, after?: AfterCommit) {
  for (let guard = 0; guard < 8; guard++) {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1)
    if (!shipment || shipment.status === 'COMPLETED' || shipment.status === 'CANCELLED') return shipment
    const tasks = await db.select().from(shipmentTasks).where(and(eq(shipmentTasks.shipmentId, shipmentId), eq(shipmentTasks.stage, shipment.stage)))
    const open = tasks.filter((t) => t.required && t.status !== 'DONE' && t.status !== 'SKIPPED')
    if (open.length) return shipment

    if (shipment.stage === 'NAO_PAGAMENTO' || shipment.stage === 'MERCADORIA_RECUSADA') {
      await db.update(shipments).set({ status: 'CANCELLED', completedAt: ctx.now() }).where(eq(shipments.id, shipmentId))
      await addEvent(db, { shipmentId, type: 'SHIPMENT_CLOSED', source: 'PLATFORM', message: 'Ocorrência tratada; embarque encerrado' })
      return shipment
    }
    const next = nextMainStage(shipment.stage)
    if (!next) {
      await db.update(shipments).set({ status: 'COMPLETED', completedAt: ctx.now() }).where(eq(shipments.id, shipmentId))
      await addEvent(db, { shipmentId, type: 'SHIPMENT_COMPLETED', source: 'PLATFORM', message: 'Embarque concluído' })
      if (after) after.push(() => notifyStageChange(ctx, shipment, 'PAGAMENTO'))
      else await notifyStageChange(ctx, shipment, 'PAGAMENTO')
      return shipment
    }
    await enterStage(ctx, db, shipment, next, { after })
  }
}

export interface TaskUpdateMeta {
  source: EventSource
  userId?: string
  partnerId?: string
  partnerType?: PartnerType
  note?: string
  externalRef?: string
  message?: string
  occurredAt?: Date
}

export async function updateTask(ctx: AppContext, shipmentId: string, taskKey: string, status: TaskStatus, meta: TaskUpdateMeta) {
  const [shipment] = await ctx.db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1)
  if (!shipment) throw notFound('shipment_not_found')
  if (shipment.status === 'COMPLETED' || shipment.status === 'CANCELLED') throw conflict('shipment_closed', 'Embarque encerrado')
  const candidates = await ctx.db.select().from(shipmentTasks).where(and(eq(shipmentTasks.shipmentId, shipmentId), eq(shipmentTasks.key, taskKey)))
  // prefere a tarefa do estágio atual; aceita de outros estágios (informação antecipada/atrasada de parceiros)
  const task = candidates.find((t) => t.stage === shipment.stage) ?? candidates[0]
  if (!task) throw notFound('task_not_found')
  if (meta.partnerType && task.partnerType !== meta.partnerType) throw unprocessable('task_not_owned_by_partner', 'Este parceiro não é responsável pela tarefa')

  const now = meta.occurredAt ?? ctx.now()
  const after: AfterCommit = []
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(shipmentTasks)
      .set({
        status,
        startedAt: task.startedAt ?? now,
        completedAt: status === 'DONE' ? now : null,
        note: meta.note ?? task.note,
        externalRef: meta.externalRef ?? task.externalRef,
      })
      .where(eq(shipmentTasks.id, task.id))
    const def = STAGE_DEFS.find((s) => s.stage === task.stage)?.tasks.find((t) => t.key === task.key)
    await addEvent(tx, {
      shipmentId,
      type: status === 'DONE' ? 'TASK_DONE' : status === 'BLOCKED' ? 'TASK_BLOCKED' : 'TASK_UPDATED',
      source: meta.source,
      partnerId: meta.partnerId,
      partnerType: meta.partnerType ?? task.partnerType,
      taskKey: task.key,
      message: meta.message ?? `${def?.title.pt ?? task.key}: ${status}`,
      data: meta.note ? { note: meta.note } : {},
      occurredAt: now,
    })
    if (meta.userId) await audit(tx, { actorUserId: meta.userId, action: 'shipment.task_updated', entityType: 'shipment', entityId: shipmentId, meta: { taskKey, status } })
    await advanceIfComplete(ctx, tx as unknown as DbOrTx, shipmentId, after)
  })
  await runAfter(after)

  if (status === 'BLOCKED') {
    await notifyStaff(ctx, ['OPERATIONS'], { kind: 'shipment', titleKey: 'notif.partner.update', link: `/admin/shipments/${shipmentId}` })
  }
  return getShipmentDto(ctx, shipmentId)
}

export async function mergeTracking(ctx: AppContext, shipmentId: string, patch: ShipmentTrackingDto) {
  const [s] = await ctx.db.select({ t: shipments.tracking }).from(shipments).where(eq(shipments.id, shipmentId)).limit(1)
  if (!s) return
  await ctx.db.update(shipments).set({ tracking: { ...s.t, ...patch } }).where(eq(shipments.id, shipmentId))
}

export async function declareException(ctx: AppContext, shipmentId: string, stage: 'NAO_PAGAMENTO' | 'MERCADORIA_RECUSADA', reason: string, userId?: string) {
  const [shipment] = await ctx.db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1)
  if (!shipment) throw notFound('shipment_not_found')
  if (shipment.status !== 'IN_PROGRESS') throw conflict('shipment_closed')
  if (shipment.stage !== 'MERCADORIA_LIBERADA' && shipment.stage !== 'PAGAMENTO') {
    throw unprocessable('exception_not_applicable', 'Ocorrências de pagamento/recusa só se aplicam a partir da liberação da mercadoria')
  }
  await ctx.db.transaction(async (tx) => {
    const def = getStageDef(stage)
    await tx.insert(shipmentTasks).values(def.tasks.map((t) => ({ shipmentId, stage, key: t.key, partnerType: t.partner ?? null, actor: t.actor, required: t.required })))
    await tx.update(shipments).set({ status: 'DISPUTE' }).where(eq(shipments.id, shipmentId))
    await addEvent(tx, { shipmentId, type: 'EXCEPTION_DECLARED', source: userId ? 'USER' : 'SYSTEM', message: `${def.title.pt}: ${reason}`, data: { stage, reason } })
    await enterStage(ctx, tx as unknown as DbOrTx, shipment, stage, { silent: true })
    if (userId) await audit(tx, { actorUserId: userId, action: 'shipment.exception', entityType: 'shipment', entityId: shipmentId, meta: { stage, reason } })
  })
  const [o] = await ctx.db.select().from(orders).where(eq(orders.id, shipment.orderId))
  for (const companyId of [o!.exporterCompanyId, o!.importerCompanyId]) {
    await notifyCompany(ctx, companyId, { kind: 'shipment', titleKey: 'notif.shipment.exception', bodyKey: 'notif.shipment.exception.body', vars: { number: shipment.number, stage: getStageDef(stage).title.pt, reason }, link: `/shipments/${shipmentId}`, email: true })
  }
  return getShipmentDto(ctx, shipmentId)
}

// ------------------------------------------------------------------ leitura
export async function getShipmentRow(ctx: AppContext, id: string) {
  const [row] = await ctx.db
    .select({ s: shipments, o: orders, p: products })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .innerJoin(products, eq(products.id, orders.productId))
    .where(eq(shipments.id, id))
    .limit(1)
  if (!row) throw notFound('shipment_not_found')
  return row
}

const taskTitle = (stage: ShipmentStage, key: string) => STAGE_DEFS.find((s) => s.stage === stage)?.tasks.find((t) => t.key === key)?.title.pt ?? key

const toTaskDto = (t: TaskRow): ShipmentTaskDto => ({
  id: t.id,
  stage: t.stage,
  key: t.key,
  title: taskTitle(t.stage, t.key),
  partnerType: t.partnerType,
  actor: t.actor,
  status: t.status,
  required: t.required,
  startedAt: t.startedAt?.toISOString() ?? null,
  completedAt: t.completedAt?.toISOString() ?? null,
  note: t.note,
})

export async function getShipmentDto(ctx: AppContext, id: string): Promise<ShipmentDto> {
  const { s, o, p } = await getShipmentRow(ctx, id)
  const [exp] = await ctx.db.select().from(companies).where(eq(companies.id, o.exporterCompanyId))
  const [imp] = await ctx.db.select().from(companies).where(eq(companies.id, o.importerCompanyId))
  const tasks = await ctx.db.select().from(shipmentTasks).where(eq(shipmentTasks.shipmentId, id))
  const order = new Map(MAIN_FLOW.map((st, i) => [st, i] as const))
  tasks.sort((a, b) => (order.get(a.stage) ?? 99) - (order.get(b.stage) ?? 99))
  return {
    id: s.id,
    number: s.number,
    orderId: o.id,
    orderNumber: o.number,
    status: s.status,
    stage: s.stage,
    productName: p.name,
    quantityKg: o.quantityKg,
    incoterm: o.incoterm,
    originPort: o.originPort,
    destinationPort: o.destinationPort,
    exporter: { id: exp!.id, name: exp!.tradeName || exp!.legalName },
    importer: { id: imp!.id, name: imp!.tradeName || imp!.legalName },
    tracking: s.tracking,
    tasks: tasks.map(toTaskDto),
    createdAt: s.createdAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
  }
}

export async function listShipmentEvents(ctx: AppContext, id: string): Promise<ShipmentEventDto[]> {
  const rows = await ctx.db.select().from(shipmentEvents).where(eq(shipmentEvents.shipmentId, id)).orderBy(desc(shipmentEvents.occurredAt), desc(shipmentEvents.createdAt))
  return rows.map((e) => ({ id: e.id, type: e.type, source: e.source, partnerType: e.partnerType, message: e.message, taskKey: e.taskKey, data: e.data, occurredAt: e.occurredAt.toISOString() }))
}

export async function listShipments(ctx: AppContext, scope: { exporterCompanyId?: string; importerCompanyId?: string; all?: boolean }) {
  const cond = scope.all ? undefined : scope.exporterCompanyId ? eq(orders.exporterCompanyId, scope.exporterCompanyId) : eq(orders.importerCompanyId, scope.importerCompanyId!)
  const rows = await ctx.db.select({ id: shipments.id }).from(shipments).innerJoin(orders, eq(orders.id, shipments.orderId)).where(cond).orderBy(desc(shipments.createdAt)).limit(100)
  return Promise.all(rows.map((r) => getShipmentDto(ctx, r.id)))
}

export async function canAccessShipment(ctx: AppContext, auth: { company: { id: string } | null; user: { platformRole: string } }, shipmentId: string) {
  const { o } = await getShipmentRow(ctx, shipmentId)
  const staff = ['OPERATIONS', 'PLATFORM_ADMIN', 'COMPLIANCE'].includes(auth.user.platformRole)
  return staff || auth.company?.id === o.exporterCompanyId || auth.company?.id === o.importerCompanyId
}

const isStaff = (role: string) => ['OPERATIONS', 'PLATFORM_ADMIN'].includes(role)

/**
 * Atualização manual de tarefa por um usuário:
 * - EXPORTER/IMPORTER: só tarefas cujo ator é a sua empresa (papel mínimo OPERATOR);
 * - PLATFORM e PARTNER: apenas equipe de operações (override manual quando o parceiro não tem API).
 */
export async function updateTaskAsUser(
  ctx: AppContext,
  auth: AuthContext,
  shipmentId: string,
  taskKey: string,
  status: TaskStatus,
  note?: string,
) {
  const { s, o } = await getShipmentRow(ctx, shipmentId)
  const task = (await ctx.db.select().from(shipmentTasks).where(and(eq(shipmentTasks.shipmentId, shipmentId), eq(shipmentTasks.key, taskKey)))).find((t) => t.stage === s.stage)
  if (!task) throw notFound('task_not_found', 'Tarefa não pertence à etapa atual')
  const staff = isStaff(auth.user.platformRole)
  const rank = { VIEWER: 1, OPERATOR: 2, ADMIN: 3, OWNER: 4 } as const
  const member = auth.memberRole ? rank[auth.memberRole] >= rank.OPERATOR : false
  const ownsExporter = task.actor === 'EXPORTER' && auth.company?.id === o.exporterCompanyId && member
  const ownsImporter = task.actor === 'IMPORTER' && auth.company?.id === o.importerCompanyId && member
  if (!staff && !ownsExporter && !ownsImporter) throw forbidden('task_not_allowed', 'Você não pode atualizar esta tarefa')
  return updateTask(ctx, shipmentId, taskKey, status, { source: 'USER', userId: auth.user.id, note })
}

export { asc, inArray }
