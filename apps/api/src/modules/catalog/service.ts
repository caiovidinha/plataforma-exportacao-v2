import { and, count, desc, eq, gt, ilike, or, sql } from 'drizzle-orm'
import type { MultipartFile } from '@fastify/multipart'
import type { PageResult, ProductDto, ProductInput } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { companies, files, orders, products } from '../../db/schema'
import { audit } from '../../lib/audit'
import { conflict, forbidden, notFound } from '../../lib/errors'
import type { AuthContext } from '../../plugins/auth'
import { readValidatedUpload, storeFile } from '../files/service'

type ProductRow = typeof products.$inferSelect

export function toProductDto(ctx: AppContext, p: ProductRow, company: { id: string; legalName: string; tradeName: string | null; country: string }): ProductDto {
  return {
    id: p.id,
    companyId: p.companyId,
    exporter: { id: company.id, name: company.tradeName || company.legalName, country: company.country },
    name: p.name,
    category: p.category,
    description: p.description,
    ncm: p.ncm,
    packaging: p.packaging,
    originPort: p.originPort,
    originState: p.originState,
    harvestYear: p.harvestYear,
    basePriceUsdPerKg: p.basePriceUsdPerKg,
    minOrderKg: p.minOrderKg,
    availableKg: p.availableKg,
    leadTimeDays: p.leadTimeDays,
    incoterms: p.incoterms,
    destinationCountries: p.destinationCountries,
    technicalSheet: p.technicalSheet,
    images: p.imageFileIds.map((id) => ({ id, url: `${ctx.config.PUBLIC_API_URL}/media/${id}` })),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

async function loadWithCompany(ctx: AppContext, id: string) {
  const [row] = await ctx.db.select({ p: products, c: companies }).from(products).innerJoin(companies, eq(companies.id, products.companyId)).where(eq(products.id, id)).limit(1)
  if (!row) throw notFound('product_not_found')
  return row
}

export async function createProduct(ctx: AppContext, auth: AuthContext, input: ProductInput) {
  const { imageFileIds, ...rest } = input
  const [row] = await ctx.db
    .insert(products)
    .values({ ...rest, companyId: auth.company!.id, imageFileIds: [] })
    .returning()
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'product.created', entityType: 'product', entityId: row!.id })
  void imageFileIds
  return getProductForOwner(ctx, auth, row!.id)
}

export async function getProductForOwner(ctx: AppContext, auth: AuthContext, id: string) {
  const { p, c } = await loadWithCompany(ctx, id)
  if (p.companyId !== auth.company!.id) throw notFound('product_not_found')
  return toProductDto(ctx, p, c)
}

export async function updateProduct(ctx: AppContext, auth: AuthContext, id: string, input: Omit<ProductInput, 'status'> & { status?: ProductInput['status'] }) {
  const { p } = await loadWithCompany(ctx, id)
  if (p.companyId !== auth.company!.id) throw notFound('product_not_found')
  const { imageFileIds: _images, status: _status, ...rest } = input
  void _images
  void _status
  await ctx.db.update(products).set({ ...rest, updatedAt: ctx.now() }).where(eq(products.id, id))
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: auth.company!.id, action: 'product.updated', entityType: 'product', entityId: id })
  return getProductForOwner(ctx, auth, id)
}

export async function setProductStatus(ctx: AppContext, auth: AuthContext, id: string, status: ProductRow['status']) {
  const { p } = await loadWithCompany(ctx, id)
  if (p.companyId !== auth.company!.id) throw notFound('product_not_found')
  if (status === 'PUBLISHED') {
    if (auth.company!.onboardingStatus !== 'APPROVED') throw forbidden('company_not_approved')
    if (p.availableKg <= 0) throw conflict('no_stock', 'Informe a quantidade disponível')
  }
  await ctx.db.update(products).set({ status, updatedAt: ctx.now() }).where(eq(products.id, id))
  await audit(ctx.db, { actorUserId: auth.user.id, companyId: auth.company!.id, action: `product.${status.toLowerCase()}`, entityType: 'product', entityId: id })
  return getProductForOwner(ctx, auth, id)
}

export async function deleteProduct(ctx: AppContext, auth: AuthContext, id: string) {
  const { p } = await loadWithCompany(ctx, id)
  if (p.companyId !== auth.company!.id) throw notFound('product_not_found')
  const [{ n } = { n: 0 }] = await ctx.db.select({ n: count() }).from(orders).where(eq(orders.productId, id))
  if (n > 0) throw conflict('product_has_orders', 'Produto com pedidos não pode ser excluído; pause-o')
  await ctx.db.delete(products).where(eq(products.id, id))
}

export async function listOwnProducts(ctx: AppContext, auth: AuthContext) {
  const rows = await ctx.db.select({ p: products, c: companies }).from(products).innerJoin(companies, eq(companies.id, products.companyId)).where(eq(products.companyId, auth.company!.id)).orderBy(desc(products.updatedAt))
  return rows.map((r) => toProductDto(ctx, r.p, r.c))
}

export async function browseCatalog(
  ctx: AppContext,
  q: { q?: string; originPort?: string; incoterm?: string; page: number; pageSize: number },
): Promise<PageResult<ProductDto>> {
  const conds = [eq(products.status, 'PUBLISHED'), gt(products.availableKg, 0), eq(companies.onboardingStatus, 'APPROVED')]
  if (q.originPort) conds.push(eq(products.originPort, q.originPort))
  if (q.incoterm) conds.push(sql`${products.incoterms} @> ${JSON.stringify([q.incoterm])}::jsonb`)
  if (q.q) conds.push(or(ilike(products.name, `%${q.q}%`), ilike(products.description, `%${q.q}%`), ilike(companies.legalName, `%${q.q}%`), ilike(companies.tradeName, `%${q.q}%`))!)
  const where = and(...conds)
  const [{ total } = { total: 0 }] = await ctx.db.select({ total: count() }).from(products).innerJoin(companies, eq(companies.id, products.companyId)).where(where)
  const rows = await ctx.db
    .select({ p: products, c: companies })
    .from(products)
    .innerJoin(companies, eq(companies.id, products.companyId))
    .where(where)
    .orderBy(desc(products.updatedAt))
    .limit(q.pageSize)
    .offset((q.page - 1) * q.pageSize)
  return { items: rows.map((r) => toProductDto(ctx, r.p, r.c)), total: Number(total), page: q.page, pageSize: q.pageSize }
}

/** Detalhe para qualquer usuário autenticado: só vê produto publicado (ou o próprio). */
export async function getProductForViewer(ctx: AppContext, auth: AuthContext, id: string) {
  const { p, c } = await loadWithCompany(ctx, id)
  const own = auth.company?.id === p.companyId
  if (!own && (p.status !== 'PUBLISHED' || c.onboardingStatus !== 'APPROVED')) throw notFound('product_not_found')
  return toProductDto(ctx, p, c)
}

export async function addProductImage(ctx: AppContext, auth: AuthContext, id: string, part: MultipartFile) {
  const { p } = await loadWithCompany(ctx, id)
  if (p.companyId !== auth.company!.id) throw notFound('product_not_found')
  if (p.imageFileIds.length >= 8) throw conflict('too_many_images', 'Máximo de 8 imagens')
  const upload = await readValidatedUpload(part, { imagesOnly: true })
  const file = await storeFile(ctx, ctx.db, { ownerCompanyId: p.companyId, kind: 'PRODUCT_IMAGE', createdBy: auth.user.id, ...upload })
  await ctx.db.update(products).set({ imageFileIds: [...p.imageFileIds, file.id], updatedAt: ctx.now() }).where(eq(products.id, id))
  return getProductForOwner(ctx, auth, id)
}

export async function removeProductImage(ctx: AppContext, auth: AuthContext, id: string, fileId: string) {
  const { p } = await loadWithCompany(ctx, id)
  if (p.companyId !== auth.company!.id) throw notFound('product_not_found')
  await ctx.db.update(products).set({ imageFileIds: p.imageFileIds.filter((f) => f !== fileId), updatedAt: ctx.now() }).where(eq(products.id, id))
  return getProductForOwner(ctx, auth, id)
}

export async function readPublicImage(ctx: AppContext, fileId: string) {
  const [f] = await ctx.db.select().from(files).where(and(eq(files.id, fileId), eq(files.kind, 'PRODUCT_IMAGE'))).limit(1)
  if (!f) throw notFound('image_not_found')
  return { file: f, buffer: await ctx.storage.get(f.storageKey) }
}
