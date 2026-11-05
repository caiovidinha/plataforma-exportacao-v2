import { auditLog } from '../db/schema'
import type { DbOrTx } from '../db/client'

export interface AuditEntry {
  actorUserId?: string | null
  companyId?: string | null
  action: string
  entityType?: string
  entityId?: string
  meta?: Record<string, unknown>
  ip?: string | null
}

export async function audit(db: DbOrTx, e: AuditEntry) {
  await db.insert(auditLog).values({
    actorUserId: e.actorUserId ?? null,
    companyId: e.companyId ?? null,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    meta: e.meta ?? {},
    ip: e.ip ?? null,
  })
}
