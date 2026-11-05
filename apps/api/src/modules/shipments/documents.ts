import type { MultipartFile } from '@fastify/multipart'
import { desc, eq } from 'drizzle-orm'
import type { EventSource, PartnerType, ShipmentDocumentDto, ShipmentDocumentType } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { files, shipmentDocuments } from '../../db/schema'
import { notFound } from '../../lib/errors'
import { readValidatedUpload, storeFile } from '../files/service'
import { addEvent, getShipmentRow } from './service'

export async function listShipmentDocuments(ctx: AppContext, shipmentId: string): Promise<ShipmentDocumentDto[]> {
  const rows = await ctx.db
    .select({ d: shipmentDocuments, f: files })
    .from(shipmentDocuments)
    .innerJoin(files, eq(files.id, shipmentDocuments.fileId))
    .where(eq(shipmentDocuments.shipmentId, shipmentId))
    .orderBy(desc(shipmentDocuments.createdAt))
  return rows.map(({ d, f }) => ({
    id: d.id,
    type: d.type,
    fileName: f.originalName,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    source: d.source,
    partnerType: d.partnerType,
    note: d.note,
    createdAt: d.createdAt.toISOString(),
  }))
}

export async function addShipmentDocument(
  ctx: AppContext,
  shipmentId: string,
  input: {
    type: ShipmentDocumentType
    note?: string
    source: EventSource
    userId?: string
    partnerId?: string
    partnerType?: PartnerType
    file: { buffer: Buffer; mimeType: string; originalName: string }
  },
) {
  const { s, o } = await getShipmentRow(ctx, shipmentId)
  const stored = await storeFile(ctx, ctx.db, { ownerCompanyId: o.exporterCompanyId, kind: 'SHIPMENT_DOC', createdBy: input.userId, ...input.file })
  const [doc] = await ctx.db
    .insert(shipmentDocuments)
    .values({ shipmentId: s.id, type: input.type, fileId: stored.id, source: input.source, partnerId: input.partnerId, partnerType: input.partnerType, note: input.note })
    .returning()
  await addEvent(ctx.db, {
    shipmentId: s.id,
    type: 'DOCUMENT_ADDED',
    source: input.source,
    partnerId: input.partnerId,
    partnerType: input.partnerType,
    message: `Documento adicionado: ${input.type}`,
    data: { documentId: doc!.id, type: input.type },
  })
  return doc!
}

export async function uploadShipmentDocumentFromPart(
  ctx: AppContext,
  shipmentId: string,
  part: MultipartFile,
  fields: { type: ShipmentDocumentType; note?: string },
  actor: { source: EventSource; userId?: string; partnerId?: string; partnerType?: PartnerType },
) {
  const file = await readValidatedUpload(part)
  return addShipmentDocument(ctx, shipmentId, { ...fields, ...actor, file })
}

export async function getShipmentDocumentFile(ctx: AppContext, shipmentId: string, documentId: string) {
  const [row] = await ctx.db
    .select({ d: shipmentDocuments, f: files })
    .from(shipmentDocuments)
    .innerJoin(files, eq(files.id, shipmentDocuments.fileId))
    .where(eq(shipmentDocuments.id, documentId))
    .limit(1)
  if (!row || row.d.shipmentId !== shipmentId) throw notFound('document_not_found')
  return { file: row.f, buffer: await ctx.storage.get(row.f.storageKey) }
}
