import { describe, expect, it } from 'vitest'
import {
  buildSectionDraftSchema,
  computeReadiness,
  EXPORTER_SECTIONS,
  findMissingRequired,
  getSection,
  isValidCnpj,
  isValidCpf,
  isValidIban,
  MAIN_FLOW,
  nextMainStage,
  REQUIREMENT_REGISTRY,
  requirementsForPartner,
  sectionsFor,
} from './index'

describe('validators', () => {
  it('valida CNPJ e CPF', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false)
    expect(isValidCnpj('00000000000000')).toBe(false)
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('111.111.111-11')).toBe(false)
  })
  it('valida IBAN', () => {
    expect(isValidIban('DE89 3704 0044 0532 0130 00')).toBe(true)
    expect(isValidIban('DE89 3704 0044 0532 0130 01')).toBe(false)
  })
})

describe('sections', () => {
  it('toda chave de campo é única por seção e há seções para os dois tipos', () => {
    for (const type of ['EXPORTER', 'IMPORTER'] as const) {
      for (const s of sectionsFor(type)) {
        const keys = s.fields.map((f) => f.key)
        expect(new Set(keys).size).toBe(keys.length)
      }
    }
    expect(sectionsFor('EXPORTER').length).toBeGreaterThan(8)
    expect(sectionsFor('IMPORTER').length).toBeGreaterThan(8)
  })

  it('schema de rascunho aceita parcial, normaliza e rejeita formato inválido', () => {
    const company = getSection('EXPORTER', 'company')!
    const schema = buildSectionDraftSchema(company)
    expect(schema.parse({ legalName: 'Castanheira Ltda', cnpj: '11.222.333/0001-81' })).toMatchObject({ cnpj: '11222333000181' })
    expect(schema.parse({ legalName: '' })).toEqual({})
    expect(() => schema.parse({ cnpj: '123' })).toThrow()
    expect(() => schema.parse({ naoExiste: 1 })).toThrow()
  })

  it('seção repetível usa items e respeita mínimo', () => {
    const reps = getSection('EXPORTER', 'representatives')!
    expect(findMissingRequired(reps, { items: [] }).some((m) => m.field === '__min_items__')).toBe(true)
    const schema = buildSectionDraftSchema(reps)
    expect(schema.parse({ items: [{ fullName: 'Maria', cpf: '529.982.247-25' }] })).toMatchObject({ items: [{ cpf: '52998224725' }] })
  })

  it('showIf: campo condicional só é exigido quando ativo', () => {
    const ins = getSection('EXPORTER', 'insuranceInfo')!
    const m1 = findMissingRequired(ins, { hasCargoInsurance: 'NO', hasCreditInsurance: 'NO', claimsLast3Years: 'NONE' })
    expect(m1).toHaveLength(0)
    const m2 = findMissingRequired(ins, { hasCargoInsurance: 'YES', hasCreditInsurance: 'NO', claimsLast3Years: '1_2' })
    expect(m2.map((m) => m.field)).toEqual([])
  })
})

describe('requirements registry & readiness', () => {
  it('registro liga campos e documentos a parceiros', () => {
    expect(REQUIREMENT_REGISTRY.length).toBeGreaterThan(40)
    expect(requirementsForPartner('CAMBIO', 'EXPORTER').some((r) => r.kind === 'field' && r.key === 'swift')).toBe(true)
    expect(requirementsForPartner('DESPACHANTE', 'EXPORTER').some((r) => r.kind === 'document' && r.key === 'CUSTOMS_BROKER_POA')).toBe(true)
  })

  it('cadastro vazio não está pronto; lista o que falta', () => {
    const r = computeReadiness({ companyType: 'EXPORTER', sections: {}, documents: [] })
    expect(r.ready).toBe(false)
    expect(r.percent).toBe(0)
    expect(r.missing.some((m) => m.kind === 'document')).toBe(true)
  })

  it('documentos pendentes contam para envio, mas só aprovados contam para o parceiro', () => {
    const docs = [{ typeKey: 'CUSTOMS_BROKER_POA', status: 'PENDING' as const }]
    const forPartner = computeReadiness({ companyType: 'EXPORTER', sections: {}, documents: docs }, 'DESPACHANTE')
    expect(forPartner.missing.some((m) => m.key === 'CUSTOMS_BROKER_POA')).toBe(true)
    const approved = computeReadiness({ companyType: 'EXPORTER', sections: {}, documents: [{ typeKey: 'CUSTOMS_BROKER_POA', status: 'APPROVED' }] }, 'DESPACHANTE')
    expect(approved.missing.some((m) => m.key === 'CUSTOMS_BROKER_POA')).toBe(false)
  })
})

describe('stages', () => {
  it('fluxo principal em ordem', () => {
    expect(MAIN_FLOW).toEqual(['NEGOCIO', 'MERCADORIA_PRONTA', 'MERCADORIA_PORTO', 'MERCADORIA_LIBERADA', 'PAGAMENTO'])
    expect(nextMainStage('NEGOCIO')).toBe('MERCADORIA_PRONTA')
    expect(nextMainStage('PAGAMENTO')).toBeNull()
  })
  it('exporta as seções do exportador', () => {
    expect(EXPORTER_SECTIONS.find((s) => s.key === 'bankAccounts')).toBeTruthy()
  })
})
