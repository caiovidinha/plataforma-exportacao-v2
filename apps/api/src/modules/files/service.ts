import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { jwtVerify, SignJWT } from 'jose'
import type { MultipartFile } from '@fastify/multipart'
import { DOCUMENT_UPLOAD_RULES } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import type { DbOrTx } from '../../db/client'
import { files } from '../../db/schema'
import { sha256Hex } from '../../lib/crypto'
import { badRequest, notFound } from '../../lib/errors'

type FileKind = 'COMPANY_DOC' | 'PRODUCT_IMAGE' | 'SHIPMENT_DOC'

const MAGIC: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: 'application/pdf', test: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  { mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
]

/** Valida tamanho, extensão e assinatura real do arquivo (não confia só no Content-Type). */
export async function readValidatedUpload(part: MultipartFile, opts: { imagesOnly?: boolean } = {}) {
  const buffer = await part.toBuffer()
  if ((part.file as unknown as { truncated?: boolean }).truncated) {
    throw badRequest('file_too_large', `Arquivo excede ${DOCUMENT_UPLOAD_RULES.maxBytes / 1024 / 1024} MB`)
  }
  return validateUploadBuffer(buffer, part.filename, opts)
}

/** Mesma validação para arquivos que não vêm de multipart (ex.: documentos baixados de parceiros). */
export function validateUploadBuffer(buffer: Buffer, filename: string, opts: { imagesOnly?: boolean } = {}) {
  if (buffer.length > DOCUMENT_UPLOAD_RULES.maxBytes) {
    throw badRequest('file_too_large', `Arquivo excede ${DOCUMENT_UPLOAD_RULES.maxBytes / 1024 / 1024} MB`)
  }
  if (buffer.length === 0) throw badRequest('file_empty')
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (!DOCUMENT_UPLOAD_RULES.allowedExtensions.includes(ext)) throw badRequest('file_type_not_allowed', 'Use PDF, JPG ou PNG')
  const detected = MAGIC.find((m) => m.test(buffer))
  if (!detected) throw badRequest('file_content_invalid', 'Conteúdo do arquivo não corresponde a PDF/JPG/PNG')
  if (opts.imagesOnly && detected.mime === 'application/pdf') throw badRequest('file_type_not_allowed', 'Envie uma imagem (JPG/PNG)')
  const safeName = filename.replace(/[^\w.\- ()]/g, '_').slice(0, 160)
  return { buffer, mimeType: detected.mime, originalName: safeName }
}

export async function storeFile(
  ctx: AppContext,
  db: DbOrTx,
  input: { ownerCompanyId: string | null; kind: FileKind; buffer: Buffer; mimeType: string; originalName: string; createdBy?: string },
) {
  const id = randomUUID()
  const storageKey = `${input.ownerCompanyId ?? 'platform'}/${id}`
  await ctx.storage.put(storageKey, input.buffer)
  const [row] = await db
    .insert(files)
    .values({
      id,
      ownerCompanyId: input.ownerCompanyId,
      kind: input.kind,
      storageKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      sha256: sha256Hex(input.buffer),
      createdBy: input.createdBy,
    })
    .returning()
  return row!
}

export async function getFileRow(ctx: AppContext, id: string) {
  const [row] = await ctx.db.select().from(files).where(eq(files.id, id)).limit(1)
  if (!row) throw notFound('file_not_found')
  return row
}

export async function readFileBuffer(ctx: AppContext, id: string) {
  const row = await getFileRow(ctx, id)
  return { row, buffer: await ctx.storage.get(row.storageKey) }
}

// ---- links de download assinados (para parceiros e e-mails) ----
const key = (ctx: AppContext) => new TextEncoder().encode(ctx.config.JWT_SECRET + ':file')

export async function createSignedFileToken(ctx: AppContext, fileId: string, ttlSec = 15 * 60, audience?: string) {
  const jwt = new SignJWT({ fid: fileId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${ttlSec}s`)
  if (audience) jwt.setAudience(audience)
  return jwt.sign(key(ctx))
}

export async function verifySignedFileToken(ctx: AppContext, token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, key(ctx))
    return String(payload.fid)
  } catch {
    throw notFound('invalid_or_expired_link')
  }
}

export async function createSignedFileUrl(ctx: AppContext, fileId: string, ttlSec = 15 * 60, audience?: string) {
  const token = await createSignedFileToken(ctx, fileId, ttlSec, audience)
  return `${ctx.config.PUBLIC_API_URL}/files/signed/${token}`
}
