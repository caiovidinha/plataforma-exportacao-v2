import { L } from './i18n'
import type { CompanyType, PartnerType } from './enums'

export interface DocumentTypeDef {
  key: string
  label: L
  description: L
  companyType: CompanyType
  /** Exigido para enviar o cadastro à análise. */
  required: boolean
  /** Aceita mais de um arquivo (ex.: um por representante). */
  multiple?: boolean
  /** Pede data de validade no upload (certidões etc.). */
  requiresExpiry?: boolean
  /** Sugestão de validade em dias, para lembrar de renovar. */
  validityDays?: number
  /** Parceiros que recebem este documento. */
  partners?: PartnerType[]
}

const DESP: PartnerType[] = ['DESPACHANTE']
const CAM: PartnerType[] = ['CAMBIO']
const SEG: PartnerType[] = ['SEGURO']
const MAR: PartnerType[] = ['TRANSPORTE_MARITIMO']

export const DOCUMENT_UPLOAD_RULES = {
  maxBytes: 15 * 1024 * 1024,
  allowedMime: ['application/pdf', 'image/jpeg', 'image/png'] as string[],
  allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'] as string[],
}

export const EXPORTER_DOCUMENTS: DocumentTypeDef[] = [
  { key: 'CNPJ_CARD', companyType: 'EXPORTER', required: true, partners: [...DESP, ...CAM, ...SEG], label: L('Cartão CNPJ', 'CNPJ card'), description: L('Comprovante de inscrição e situação cadastral (Receita Federal), emitido há menos de 90 dias.', 'Registration proof issued less than 90 days ago.'), requiresExpiry: false, validityDays: 90 },
  { key: 'ARTICLES_OF_ASSOCIATION', companyType: 'EXPORTER', required: true, partners: [...DESP, ...CAM], label: L('Contrato social e última alteração consolidada', 'Articles of association (latest consolidated)'), description: L('Contrato social com todas as alterações ou consolidação mais recente, registrado na Junta Comercial.', 'Articles with all amendments or latest consolidation, filed with the Commercial Board.') },
  { key: 'FEDERAL_TAX_CLEARANCE', companyType: 'EXPORTER', required: true, requiresExpiry: true, validityDays: 180, partners: [...DESP, ...CAM], label: L('Certidão negativa de débitos federais (CND)', 'Federal tax clearance certificate (CND)'), description: L('Certidão Conjunta Receita Federal/PGFN válida.', 'Valid joint Federal Revenue/PGFN certificate.') },
  { key: 'STATE_TAX_CLEARANCE', companyType: 'EXPORTER', required: false, requiresExpiry: true, validityDays: 90, label: L('Certidão negativa estadual', 'State tax clearance'), description: L('Certidão de regularidade fiscal estadual.', 'State tax compliance certificate.') },
  { key: 'FGTS_CERTIFICATE', companyType: 'EXPORTER', required: false, requiresExpiry: true, validityDays: 30, label: L('Certificado de regularidade do FGTS (CRF)', 'FGTS compliance certificate (CRF)'), description: L('CRF válido.', 'Valid CRF.') },
  { key: 'STATE_REGISTRATION', companyType: 'EXPORTER', required: true, partners: DESP, label: L('Comprovante de inscrição estadual', 'State registration proof'), description: L('Cartão ou consulta de situação cadastral (SINTEGRA).', 'Card or registration status check.') },
  { key: 'RADAR_PROOF', companyType: 'EXPORTER', required: true, partners: DESP, label: L('Comprovante de habilitação no RADAR/Siscomex', 'RADAR/Siscomex enablement proof'), description: L('Extrato de habilitação do Portal Único Siscomex.', 'Enablement statement from the Siscomex Single Portal.') },
  { key: 'MAPA_REGISTRATION', companyType: 'EXPORTER', required: true, requiresExpiry: true, partners: DESP, label: L('Registro / cadastro no MAPA', 'MAPA registration'), description: L('Comprovante de registro do estabelecimento/exportador no MAPA.', 'MAPA establishment/exporter registration proof.') },
  { key: 'IBAMA_CTF', companyType: 'EXPORTER', required: false, requiresExpiry: true, validityDays: 90, label: L('Certificado de regularidade IBAMA (CTF/APP)', 'IBAMA compliance certificate (CTF/APP)'), description: L('Quando aplicável ao produto/origem.', 'When applicable to the product/origin.') },
  { key: 'REPRESENTATIVE_ID', companyType: 'EXPORTER', required: true, multiple: true, partners: [...DESP, ...CAM], label: L('Documento de identificação dos representantes (RG/CNH + CPF)', 'Representatives ID (RG/CNH + CPF)'), description: L('Um arquivo por representante legal listado.', 'One file per listed legal representative.') },
  { key: 'PROOF_OF_ADDRESS', companyType: 'EXPORTER', required: true, requiresExpiry: false, validityDays: 90, partners: CAM, label: L('Comprovante de endereço da sede', 'Proof of headquarters address'), description: L('Conta de consumo ou equivalente, emitido há menos de 90 dias.', 'Utility bill or equivalent issued less than 90 days ago.') },
  { key: 'BANK_PROOF', companyType: 'EXPORTER', required: true, partners: CAM, label: L('Comprovante de dados bancários', 'Bank details proof'), description: L('Carta do banco, cartão de assinaturas ou extrato com titularidade.', 'Bank letter, signature card or statement showing ownership.') },
  { key: 'CUSTOMS_BROKER_POA', companyType: 'EXPORTER', required: true, requiresExpiry: true, partners: DESP, label: L('Procuração ao despachante aduaneiro', 'Customs broker power of attorney'), description: L('Procuração com poderes para atuar no Siscomex em nome da empresa. Modelo fornecido pela plataforma.', 'POA with powers to act in Siscomex on behalf of the company. Template provided by the platform.') },
  { key: 'FX_POA', companyType: 'EXPORTER', required: false, partners: CAM, label: L('Procuração/autorização para operações de câmbio', 'FX operations authorization'), description: L('Quando a assinatura dos contratos de câmbio for por procurador.', 'When FX contracts are signed by an attorney-in-fact.') },
  { key: 'FINANCIAL_STATEMENTS', companyType: 'EXPORTER', required: false, partners: [...CAM, ...SEG], label: L('Demonstrações financeiras (último exercício)', 'Financial statements (last fiscal year)'), description: L('Balanço e DRE assinados pelo contador.', 'Balance sheet and P&L signed by the accountant.') },
  { key: 'PRODUCT_CERTIFICATIONS', companyType: 'EXPORTER', required: false, multiple: true, requiresExpiry: true, label: L('Certificações de produto/processo', 'Product/process certifications'), description: L('Orgânico, Fair Trade, FSSC, HACCP etc.', 'Organic, Fair Trade, FSSC, HACCP etc.') },
  { key: 'INSURANCE_CURRENT_POLICY', companyType: 'EXPORTER', required: false, requiresExpiry: true, partners: SEG, label: L('Apólice de seguro vigente (se houver)', 'Current insurance policy (if any)'), description: L('Cópia da apólice de carga/crédito.', 'Copy of cargo/credit policy.') },
]

export const IMPORTER_DOCUMENTS: DocumentTypeDef[] = [
  { key: 'COMMERCIAL_REGISTRY_EXTRACT', companyType: 'IMPORTER', required: true, partners: [...CAM, ...DESP], label: L('Extrato do registro comercial (certificate of incorporation)', 'Commercial register extract (certificate of incorporation)'), description: L('Emitido há menos de 90 dias, com tradução juramentada se não estiver em inglês/português/espanhol.', 'Issued less than 90 days ago; sworn translation if not in English/Portuguese/Spanish.') },
  { key: 'TAX_ID_PROOF', companyType: 'IMPORTER', required: true, partners: [...CAM, ...DESP], label: L('Comprovante de Tax ID / VAT', 'Tax ID / VAT proof'), description: L('Certificado oficial de VAT/Tax ID.', 'Official VAT/Tax ID certificate.') },
  { key: 'ARTICLES_OF_ASSOCIATION', companyType: 'IMPORTER', required: true, partners: CAM, label: L('Estatuto / contrato social', 'Articles of association / bylaws'), description: L('Versão vigente.', 'Current version.') },
  { key: 'SIGNATORY_ID', companyType: 'IMPORTER', required: true, multiple: true, partners: CAM, label: L('Passaporte/ID dos signatários', 'Signatories passport/ID'), description: L('Um arquivo por signatário, dentro da validade.', 'One file per signatory, still valid.') },
  { key: 'UBO_DECLARATION', companyType: 'IMPORTER', required: true, partners: CAM, label: L('Declaração de beneficiários finais (UBO) assinada', 'Signed UBO declaration'), description: L('Lista de beneficiários finais assinada pelo representante legal.', 'List of ultimate beneficial owners signed by the legal representative.') },
  { key: 'PROOF_OF_ADDRESS', companyType: 'IMPORTER', required: true, partners: CAM, label: L('Comprovante de endereço', 'Proof of address'), description: L('Emitido há menos de 90 dias.', 'Issued less than 90 days ago.') },
  { key: 'BANK_REFERENCE_LETTER', companyType: 'IMPORTER', required: true, partners: CAM, label: L('Carta de referência bancária', 'Bank reference letter'), description: L('Carta do banco confirmando titularidade e relacionamento.', 'Bank letter confirming ownership and relationship.') },
  { key: 'IMPORT_LICENSE', companyType: 'IMPORTER', required: true, requiresExpiry: true, partners: DESP, label: L('Licença / registro de importação', 'Import licence / registration'), description: L('Autorização para importar o produto no país de destino.', 'Authorisation to import the product into the destination country.') },
  { key: 'FOOD_SAFETY_REGISTRATION', companyType: 'IMPORTER', required: true, requiresExpiry: true, partners: DESP, label: L('Registro sanitário / segurança alimentar', 'Food safety registration'), description: L('Ex.: FDA Food Facility Registration, FBO (UE).', 'E.g. FDA Food Facility Registration, EU FBO.') },
  { key: 'CUSTOMS_BROKER_POA', companyType: 'IMPORTER', required: false, requiresExpiry: true, partners: DESP, label: L('Procuração ao corretor aduaneiro no destino', 'Destination customs broker POA'), description: L('Quando o corretor de destino atuar em seu nome.', 'When the destination broker acts on your behalf.') },
  { key: 'FINANCIAL_STATEMENTS', companyType: 'IMPORTER', required: false, partners: [...CAM, ...SEG], label: L('Demonstrações financeiras (último exercício)', 'Financial statements (last fiscal year)'), description: L('Balanço e P&L.', 'Balance sheet and P&L.') },
  { key: 'AEO_CERTIFICATE', companyType: 'IMPORTER', required: false, requiresExpiry: true, partners: MAR, label: L('Certificado AEO (se houver)', 'AEO certificate (if any)'), description: L('Operador Econômico Autorizado.', 'Authorised Economic Operator.') },
  { key: 'TRADE_REFERENCE_LETTERS', companyType: 'IMPORTER', required: false, multiple: true, partners: SEG, label: L('Cartas de referência comercial', 'Trade reference letters'), description: L('De fornecedores atuais.', 'From current suppliers.') },
]

export const DOCUMENT_TYPES: DocumentTypeDef[] = [...EXPORTER_DOCUMENTS, ...IMPORTER_DOCUMENTS]

export const documentTypesFor = (type: CompanyType): DocumentTypeDef[] =>
  DOCUMENT_TYPES.filter((d) => d.companyType === type)

export const getDocumentType = (type: CompanyType, key: string): DocumentTypeDef | undefined =>
  DOCUMENT_TYPES.find((d) => d.companyType === type && d.key === key)
