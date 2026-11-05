import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { documentTypesFor, sectionsFor } from '@amazon-trade/shared'
import { makeTestApp, type TestApp } from '../../test/helpers'
import { PDF, createActor, multipartBody, requiredDocs, sampleSectionData } from '../../test/fixtures'

let t: TestApp
beforeAll(async () => {
  t = await makeTestApp()
})
afterAll(async () => {
  await t.close()
})

async function upload(actor: { h: Record<string, string> }, typeKey: string, extra: Record<string, string> = {}, file = { name: 'doc.pdf', buffer: PDF }) {
  const { payload, headers } = multipartBody({ typeKey, ...extra }, file)
  return t.app.inject({ method: 'POST', url: '/documents', payload, headers: { ...actor.h, ...headers } })
}

describe('onboarding / KYC', () => {
  it('fluxo completo exportador: seções → documentos → envio → compliance aprova → gate', async () => {
    const exporter = await createActor(t, { type: 'EXPORTER' })
    const compliance = await createActor(t, { type: 'IMPORTER', platformRole: 'COMPLIANCE' })

    // estado inicial incompleto
    const initial = await t.app.inject({ method: 'GET', url: '/onboarding', headers: exporter.h })
    expect(initial.statusCode).toBe(200)
    expect(initial.json().submission.ready).toBe(false)

    // não consegue enviar incompleto
    const early = await t.app.inject({ method: 'POST', url: '/onboarding/submit', headers: exporter.h })
    expect(early.statusCode).toBe(422)
    expect(early.json().error.code).toBe('incomplete_onboarding')

    // preenche todas as seções
    for (const [i, section] of sectionsFor('EXPORTER').entries()) {
      const res = await t.app.inject({ method: 'PUT', url: `/onboarding/sections/${section.key}`, headers: exporter.h, payload: sampleSectionData(section, 'EXPORTER', 1) })
      expect(res.statusCode, `${section.key}: ${res.body}`).toBe(200)
      void i
    }
    // envia documentos obrigatórios
    for (const d of requiredDocs('EXPORTER')) {
      const res = await upload(exporter, d.key, d.requiresExpiry ? { expiresAt: '2099-01-01' } : {})
      expect(res.statusCode, `${d.key}: ${res.body}`).toBe(201)
    }
    const ready = await t.app.inject({ method: 'GET', url: '/onboarding', headers: exporter.h })
    expect(ready.json().submission.missing).toEqual([])

    const submit = await t.app.inject({ method: 'POST', url: '/onboarding/submit', headers: exporter.h })
    expect(submit.statusCode, submit.body).toBe(200)
    expect(submit.json().company.onboardingStatus).toBe('SUBMITTED')
    // trava edição em análise
    const locked = await t.app.inject({ method: 'PUT', url: '/onboarding/sections/company', headers: exporter.h, payload: { website: 'https://x.com' } })
    expect(locked.statusCode).toBe(409)

    // compliance vê na fila e não aprova com documentos pendentes
    const queue = await t.app.inject({ method: 'GET', url: '/admin/compliance/queue?status=SUBMITTED', headers: compliance.h })
    expect(queue.json().some((c: { id: string }) => c.id === exporter.companyId)).toBe(true)
    const tooSoon = await t.app.inject({ method: 'POST', url: `/admin/compliance/${exporter.companyId}/review`, headers: compliance.h, payload: { decision: 'APPROVE' } })
    expect(tooSoon.statusCode).toBe(422)
    expect(tooSoon.json().error.code).toBe('documents_pending_review')

    // aprova documentos e a empresa
    const state = (await t.app.inject({ method: 'GET', url: `/admin/compliance/${exporter.companyId}`, headers: compliance.h })).json()
    for (const d of state.documents) {
      const r = await t.app.inject({ method: 'POST', url: `/admin/documents/${d.id}/review`, headers: compliance.h, payload: { decision: 'APPROVE' } })
      expect(r.statusCode).toBe(200)
    }
    const approved = await t.app.inject({ method: 'POST', url: `/admin/compliance/${exporter.companyId}/review`, headers: compliance.h, payload: { decision: 'APPROVE' } })
    expect(approved.statusCode, approved.body).toBe(200)
    expect(approved.json().company.onboardingStatus).toBe('APPROVED')
    // todos os parceiros prontos
    const partners = approved.json().partners
    expect(partners.DESPACHANTE.ready).toBe(true)
    expect(partners.CAMBIO.ready).toBe(true)
  })

  it('valida formato dos campos e rejeita chaves desconhecidas', async () => {
    const a = await createActor(t, { type: 'EXPORTER' })
    const badCnpj = await t.app.inject({ method: 'PUT', url: '/onboarding/sections/company', headers: a.h, payload: { cnpj: '11222333000199' } })
    expect(badCnpj.statusCode).toBe(400)
    const unknown = await t.app.inject({ method: 'PUT', url: '/onboarding/sections/company', headers: a.h, payload: { naoExiste: 'x' } })
    expect(unknown.statusCode).toBe(400)
    const noSection = await t.app.inject({ method: 'PUT', url: '/onboarding/sections/zzz', headers: a.h, payload: {} })
    expect(noSection.statusCode).toBe(404)
  })

  it('CNPJ duplicado entre empresas → 409', async () => {
    const a = await createActor(t, { type: 'EXPORTER' })
    const b = await createActor(t, { type: 'EXPORTER' })
    const body = { cnpj: '04.252.011/0001-10' }
    expect((await t.app.inject({ method: 'PUT', url: '/onboarding/sections/company', headers: a.h, payload: body })).statusCode).toBe(200)
    const dup = await t.app.inject({ method: 'PUT', url: '/onboarding/sections/company', headers: b.h, payload: body })
    expect(dup.statusCode).toBe(409)
    expect(dup.json().error.code).toBe('tax_id_in_use')
  })

  it('upload: valida assinatura real, tipo, validade obrigatória, versionamento', async () => {
    const a = await createActor(t, { type: 'EXPORTER' })
    const fake = await upload(a, 'CNPJ_CARD', {}, { name: 'x.pdf', buffer: Buffer.from('not a pdf at all') })
    expect(fake.statusCode).toBe(400)
    expect(fake.json().error.code).toBe('file_content_invalid')
    const exe = await upload(a, 'CNPJ_CARD', {}, { name: 'x.exe', buffer: PDF })
    expect(exe.json().error.code).toBe('file_type_not_allowed')
    const unknownType = await upload(a, 'NOPE')
    expect(unknownType.json().error.code).toBe('unknown_document_type')
    const noExpiry = await upload(a, 'FEDERAL_TAX_CLEARANCE')
    expect(noExpiry.json().error.code).toBe('expiry_required')
    const past = await upload(a, 'FEDERAL_TAX_CLEARANCE', { expiresAt: '2001-01-01' })
    expect(past.json().error.code).toBe('document_already_expired')

    const v1 = await upload(a, 'CNPJ_CARD')
    const v2 = await upload(a, 'CNPJ_CARD')
    expect(v1.json().version).toBe(1)
    expect(v2.json().version).toBe(2)
    const list = await t.app.inject({ method: 'GET', url: '/documents', headers: a.h })
    expect(list.json().filter((d: { typeKey: string }) => d.typeKey === 'CNPJ_CARD')).toHaveLength(1)

    // download pelo dono; outra empresa não acessa
    const dl = await t.app.inject({ method: 'GET', url: `/documents/${v2.json().id}/download`, headers: a.h })
    expect(dl.statusCode).toBe(200)
    expect(dl.rawPayload.subarray(0, 5).toString()).toBe('%PDF-')
    const other = await createActor(t, { type: 'EXPORTER' })
    const denied = await t.app.inject({ method: 'GET', url: `/documents/${v2.json().id}/download`, headers: other.h })
    expect(denied.statusCode).toBe(404)
  })

  it('documentos exigidos existem para os dois tipos de empresa', () => {
    expect(documentTypesFor('EXPORTER').filter((d) => d.required).length).toBeGreaterThan(5)
    expect(documentTypesFor('IMPORTER').filter((d) => d.required).length).toBeGreaterThan(5)
  })

  it('usuário sem e-mail verificado não consegue enviar o cadastro', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'unverified@example.com', password: 'Sup3rSecret!pass', fullName: 'Sem Verificar', locale: 'pt', companyType: 'IMPORTER', companyName: 'X GmbH', country: 'DE', acceptTerms: true } })
    expect(res.statusCode).toBe(201)
    const login = await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'unverified@example.com', password: 'Sup3rSecret!pass' } })
    const token = login.json().accessToken
    const submit = await t.app.inject({ method: 'POST', url: '/onboarding/submit', headers: { authorization: `Bearer ${token}` } })
    expect(submit.statusCode).toBe(403)
    expect(submit.json().error.code).toBe('email_not_verified')
  })
})
