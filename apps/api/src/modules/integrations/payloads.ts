import { and, eq, isNull } from 'drizzle-orm'
import { REQUIREMENT_REGISTRY, getDocumentType, portByCode, type CompanyType, type IntegrationOperation, type PartnerType, type SectionData } from '@amazon-trade/shared'
import type { AppContext } from '../../context'
import { companies, dataShares, documents, files, orders, products, shipments } from '../../db/schema'
import { notFound } from '../../lib/errors'
import { loadSections } from '../companies/service'
import { createSignedFileUrl } from '../files/service'

export interface BuiltPayload {
  payload: Record<string, unknown>
  /** Campos compartilhados ("exporter.bankAccounts.swift"...) — vai para `data_shares`. */
  fields: string[]
  documents: { id: string; type: string; fileName: string; url: string }[]
}

function pickParty(type: CompanyType, partner: PartnerType, sections: Record<string, SectionData>, fields: string[], prefix: string) {
  const out: Record<string, unknown> = {}
  const wanted = REQUIREMENT_REGISTRY.filter((r) => r.kind === 'field' && r.companyType === type && r.partners.includes(partner))
  for (const req of wanted) {
    const data = sections[req.section!]
    if (!data) continue
    if (req.repeatable) {
      const items = ('items' in data ? data.items : []) as Record<string, unknown>[]
      const arr = ((out[req.section!] as Record<string, unknown>[] | undefined) ?? items.map(() => ({})))
      items.forEach((it, i) => {
        if (it[req.key] !== undefined) arr[i] = { ...arr[i], [req.key]: it[req.key] }
      })
      out[req.section!] = arr
    } else {
      const v = (data as Record<string, unknown>)[req.key]
      if (v !== undefined) out[req.section!] = { ...(out[req.section!] as object | undefined), [req.key]: v }
    }
    fields.push(`${prefix}.${req.section}.${req.key}`)
  }
  return out
}

/**
 * Monta o payload enviado a um parceiro com MINIMIZAÇÃO DE DADOS: só os campos do registro de
 * requisitos marcados para aquele tipo de parceiro + dados da operação. Registra em `data_shares`.
 */
export async function buildDispatchPayload(
  ctx: AppContext,
  input: { partnerId: string; partnerType: PartnerType; operation: IntegrationOperation; shipmentId: string },
): Promise<BuiltPayload> {
  const [row] = await ctx.db
    .select({ s: shipments, o: orders, p: products })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .innerJoin(products, eq(products.id, orders.productId))
    .where(eq(shipments.id, input.shipmentId))
    .limit(1)
  if (!row) throw notFound('shipment_not_found')
  const { s, o, p } = row
  const [exporter] = await ctx.db.select().from(companies).where(eq(companies.id, o.exporterCompanyId))
  const [importer] = await ctx.db.select().from(companies).where(eq(companies.id, o.importerCompanyId))

  const fields: string[] = []
  const [expSections, impSections] = await Promise.all([loadSections(ctx, exporter!.id), loadSections(ctx, importer!.id)])

  // documentos aprovados que este parceiro precisa
  const docRows = await ctx.db
    .select({ d: documents, f: files })
    .from(documents)
    .innerJoin(files, eq(files.id, documents.fileId))
    .where(and(isNull(documents.supersededAt), eq(documents.status, 'APPROVED')))
  const sharedDocs: BuiltPayload['documents'] = []
  for (const r of docRows) {
    const owner = r.d.companyId === exporter!.id ? exporter! : r.d.companyId === importer!.id ? importer! : null
    if (!owner) continue
    const def = getDocumentType(owner.type, r.d.typeKey)
    if (!def?.partners?.includes(input.partnerType)) continue
    sharedDocs.push({ id: r.d.id, type: r.d.typeKey, fileName: r.f.originalName, url: await createSignedFileUrl(ctx, r.f.id, 24 * 3600, input.partnerId) })
    fields.push(`document.${r.d.typeKey}`)
  }

  const origin = portByCode(o.originPort)
  const dest = portByCode(o.destinationPort)
  const payload: Record<string, unknown> = {
    operation: input.operation,
    shipment: {
      number: s.number,
      orderNumber: o.number,
      incoterm: o.incoterm,
      quantityKg: o.quantityKg,
      invoiceValueUsd: o.invoiceValueUsd,
      containers: o.result.containers,
      containerType: o.result.containerType,
      originPort: { code: o.originPort, name: origin?.name },
      destinationPort: { code: o.destinationPort, name: dest?.name },
      requestedShipDate: o.requestedShipDate,
      product: { name: p.name, ncm: p.ncm, packaging: p.packaging, harvestYear: p.harvestYear },
    },
    exporter: { name: exporter!.legalName, country: exporter!.country, ...pickParty('EXPORTER', input.partnerType, expSections, fields, 'exporter') },
    importer: { name: importer!.legalName, country: importer!.country, ...pickParty('IMPORTER', input.partnerType, impSections, fields, 'importer') },
  }

  await ctx.db.insert(dataShares).values({
    partnerId: input.partnerId,
    companyId: exporter!.id,
    shipmentId: s.id,
    operation: input.operation,
    purpose: `Execução da operação ${input.operation} do embarque ${s.number}`,
    fields: [...new Set(fields)],
    documents: sharedDocs.map((d) => d.type),
  })
  return { payload, fields: [...new Set(fields)], documents: sharedDocs }
}
