import { L } from '../i18n'
import type { PartnerType } from '../enums'
import { CORE_PARTNER_TYPES } from '../enums'
import type { FieldOption, SectionDef } from '../fields'
import { yesNo } from '../fields'

const ALL = CORE_PARTNER_TYPES
const DESP: PartnerType[] = ['DESPACHANTE']
const MAR: PartnerType[] = ['TRANSPORTE_MARITIMO']
const TER: PartnerType[] = ['TRANSPORTE_TERRESTRE']
const CAM: PartnerType[] = ['CAMBIO']
const SEG: PartnerType[] = ['SEGURO']

const o = (value: string, pt: string, en: string): FieldOption => ({ value, label: L(pt, en) })

/**
 * Cadastro do EXPORTADOR (empresa brasileira).
 * Cada campo traz `partners`: quais parceiros precisam do dado (registro de requisitos → guia de integração).
 */
export const EXPORTER_SECTIONS: SectionDef[] = [
  {
    key: 'company',
    companyType: 'EXPORTER',
    required: true,
    title: L('Dados da empresa', 'Company details'),
    description: L(
      'Informações cadastrais conforme cartão CNPJ e contrato social.',
      'Registration data as per CNPJ card and articles of association.',
    ),
    fields: [
      { key: 'legalName', label: L('Razão social', 'Legal name'), type: 'text', required: true, partners: ALL, width: 'full' },
      { key: 'tradeName', label: L('Nome fantasia', 'Trade name'), type: 'text', partners: ALL, width: 'half' },
      { key: 'cnpj', label: L('CNPJ', 'CNPJ'), type: 'cnpj', required: true, partners: ALL, width: 'half' },
      { key: 'stateRegistration', label: L('Inscrição estadual', 'State registration (IE)'), type: 'text', required: true, partners: DESP, width: 'half' },
      { key: 'municipalRegistration', label: L('Inscrição municipal', 'Municipal registration'), type: 'text', width: 'half' },
      { key: 'cnaePrimary', label: L('CNAE principal', 'Primary CNAE'), type: 'text', required: true, partners: DESP, placeholder: '0000-0/00', width: 'half' },
      { key: 'cnaeSecondary', label: L('CNAEs secundários', 'Secondary CNAEs'), type: 'tags', width: 'half' },
      { key: 'legalNature', label: L('Natureza jurídica', 'Legal nature'), type: 'text', required: true, placeholder: 'Ex.: 206-2 Sociedade Empresária Limitada', width: 'half' },
      {
        key: 'companySize', label: L('Porte', 'Company size'), type: 'select', required: true, width: 'half',
        options: [o('MEI', 'MEI', 'MEI'), o('ME', 'Microempresa', 'Micro'), o('EPP', 'Empresa de pequeno porte', 'Small'), o('MEDIUM', 'Média', 'Medium'), o('LARGE', 'Grande', 'Large')],
      },
      {
        key: 'taxRegime', label: L('Regime tributário', 'Tax regime'), type: 'select', required: true, partners: DESP, width: 'half',
        options: [o('SIMPLES', 'Simples Nacional', 'Simples Nacional'), o('PRESUMIDO', 'Lucro presumido', 'Presumed profit'), o('REAL', 'Lucro real', 'Real profit')],
      },
      { key: 'foundedAt', label: L('Data de abertura', 'Founding date'), type: 'date', required: true, width: 'half' },
      {
        key: 'employeesRange', label: L('Nº de funcionários', 'Employees'), type: 'select', width: 'half',
        options: [o('1-9', '1 a 9', '1-9'), o('10-49', '10 a 49', '10-49'), o('50-199', '50 a 199', '50-199'), o('200+', '200 ou mais', '200+')],
      },
      { key: 'shareCapital', label: L('Capital social (R$)', 'Share capital (BRL)'), type: 'number', width: 'half' },
      { key: 'website', label: L('Site', 'Website'), type: 'url', width: 'half' },
      { key: 'description', label: L('Descrição da empresa e da operação', 'Company and operation description'), type: 'textarea', width: 'full' },
    ],
  },
  {
    key: 'addresses',
    companyType: 'EXPORTER',
    required: true,
    repeatable: { min: 1, max: 10, itemLabel: L('Endereço', 'Address') },
    title: L('Endereços', 'Addresses'),
    description: L(
      'Sede, filiais e locais de armazenagem/coleta da mercadoria (usado pela transportadora terrestre).',
      'Headquarters, branches and cargo storage/pickup sites (used by the land carrier).',
    ),
    fields: [
      {
        key: 'kind', label: L('Tipo', 'Type'), type: 'select', required: true, width: 'third',
        options: [o('HEADQUARTERS', 'Sede', 'Headquarters'), o('BRANCH', 'Filial', 'Branch'), o('WAREHOUSE', 'Armazém / Beneficiamento', 'Warehouse / Processing'), o('FARM', 'Propriedade / Extrativismo', 'Farm / Extraction site')],
      },
      { key: 'zip', label: L('CEP', 'ZIP'), type: 'text', required: true, partners: TER, width: 'third' },
      { key: 'street', label: L('Logradouro', 'Street'), type: 'text', required: true, partners: [...ALL], width: 'full' },
      { key: 'number', label: L('Número', 'Number'), type: 'text', required: true, partners: TER, width: 'third' },
      { key: 'complement', label: L('Complemento', 'Complement'), type: 'text', width: 'third' },
      { key: 'district', label: L('Bairro', 'District'), type: 'text', partners: TER, width: 'third' },
      { key: 'city', label: L('Cidade', 'City'), type: 'text', required: true, partners: TER, width: 'third' },
      { key: 'state', label: L('UF', 'State'), type: 'select', optionsFrom: 'br_states', required: true, partners: TER, width: 'third' },
      { key: 'isPickupLocation', label: L('É local de coleta da carga?', 'Is a cargo pickup location?'), type: 'select', options: yesNo(), partners: TER, width: 'third' },
      { key: 'pickupHours', label: L('Horário de funcionamento / coleta', 'Operating / pickup hours'), type: 'text', partners: TER, showIf: { key: 'isPickupLocation', equals: 'YES' }, width: 'half' },
      { key: 'loadingFacilities', label: L('Estrutura de carga (doca, empilhadeira, balança...)', 'Loading facilities (dock, forklift, scale...)'), type: 'text', partners: TER, showIf: { key: 'isPickupLocation', equals: 'YES' }, width: 'half' },
    ],
  },
  {
    key: 'contacts',
    companyType: 'EXPORTER',
    required: true,
    repeatable: { min: 2, max: 12, itemLabel: L('Contato', 'Contact') },
    title: L('Contatos operacionais', 'Operational contacts'),
    description: L(
      'Pelo menos um contato comercial e um de logística/financeiro. Os parceiros usam estes contatos nas solicitações.',
      'At least a commercial contact and a logistics/finance one. Partners use these in requests.',
    ),
    fields: [
      { key: 'name', label: L('Nome completo', 'Full name'), type: 'text', required: true, partners: ALL, width: 'half' },
      {
        key: 'department', label: L('Área', 'Department'), type: 'select', required: true, width: 'half',
        options: [o('COMMERCIAL', 'Comercial', 'Commercial'), o('LOGISTICS', 'Logística', 'Logistics'), o('FINANCE', 'Financeiro', 'Finance'), o('FISCAL', 'Fiscal / Documental', 'Fiscal / Documents'), o('LEGAL', 'Jurídico', 'Legal'), o('QUALITY', 'Qualidade', 'Quality')],
      },
      { key: 'role', label: L('Cargo', 'Job title'), type: 'text', width: 'half' },
      { key: 'email', label: L('E-mail', 'E-mail'), type: 'email', required: true, partners: ALL, width: 'half' },
      { key: 'phone', label: L('Telefone', 'Phone'), type: 'phone', required: true, partners: ALL, width: 'half' },
      { key: 'whatsapp', label: L('WhatsApp', 'WhatsApp'), type: 'phone', partners: [...SEG, ...TER, ...CAM], width: 'half' },
      { key: 'isPrimary', label: L('Contato principal?', 'Primary contact?'), type: 'select', options: yesNo(), width: 'half' },
    ],
  },
  {
    key: 'representatives',
    companyType: 'EXPORTER',
    required: true,
    repeatable: { min: 1, max: 8, itemLabel: L('Representante legal', 'Legal representative') },
    title: L('Representantes legais e signatários', 'Legal representatives & signatories'),
    description: L(
      'Quem assina contratos, procurações e documentos de exportação pela empresa.',
      'Who signs contracts, powers of attorney and export documents on behalf of the company.',
    ),
    fields: [
      { key: 'fullName', label: L('Nome completo', 'Full name'), type: 'text', required: true, partners: ALL, width: 'half' },
      { key: 'cpf', label: L('CPF', 'CPF'), type: 'cpf', required: true, partners: [...DESP, ...CAM], width: 'half' },
      { key: 'rg', label: L('RG', 'ID (RG)'), type: 'text', required: true, partners: DESP, width: 'third' },
      { key: 'rgIssuer', label: L('Órgão emissor / UF', 'Issuer / state'), type: 'text', width: 'third' },
      { key: 'birthDate', label: L('Data de nascimento', 'Birth date'), type: 'date', required: true, partners: [...DESP, ...CAM], width: 'third' },
      { key: 'nationality', label: L('Nacionalidade', 'Nationality'), type: 'country', required: true, width: 'third' },
      { key: 'maritalStatus', label: L('Estado civil', 'Marital status'), type: 'select', width: 'third', options: [o('SINGLE', 'Solteiro(a)', 'Single'), o('MARRIED', 'Casado(a)', 'Married'), o('DIVORCED', 'Divorciado(a)', 'Divorced'), o('WIDOWED', 'Viúvo(a)', 'Widowed'), o('STABLE_UNION', 'União estável', 'Stable union')] },
      { key: 'role', label: L('Cargo', 'Role'), type: 'text', required: true, width: 'third' },
      { key: 'email', label: L('E-mail', 'E-mail'), type: 'email', required: true, partners: DESP, width: 'half' },
      { key: 'phone', label: L('Telefone', 'Phone'), type: 'phone', required: true, width: 'half' },
      {
        key: 'signingPower', label: L('Poder de assinatura', 'Signing power'), type: 'select', required: true, partners: [...DESP, ...CAM], width: 'half',
        options: [o('ALONE', 'Isoladamente', 'Alone'), o('JOINT', 'Em conjunto', 'Jointly')],
      },
      { key: 'isPep', label: L('É pessoa politicamente exposta (PEP)?', 'Is a politically exposed person (PEP)?'), type: 'select', required: true, options: yesNo(), partners: CAM, width: 'half' },
    ],
  },
  {
    key: 'ubos',
    companyType: 'EXPORTER',
    required: true,
    repeatable: { min: 1, max: 20, itemLabel: L('Sócio / beneficiário final', 'Shareholder / beneficial owner') },
    title: L('Quadro societário e beneficiários finais', 'Shareholders & beneficial owners'),
    description: L(
      'Todos os sócios com participação relevante e o beneficiário final (pessoa física) da empresa.',
      'All relevant shareholders and the ultimate beneficial owner (natural person).',
    ),
    fields: [
      { key: 'name', label: L('Nome / razão social', 'Name / legal name'), type: 'text', required: true, partners: [...CAM, ...SEG], width: 'half' },
      { key: 'kind', label: L('Tipo', 'Type'), type: 'select', required: true, width: 'third', options: [o('PERSON', 'Pessoa física', 'Natural person'), o('COMPANY', 'Pessoa jurídica', 'Legal entity')] },
      { key: 'document', label: L('CPF / CNPJ', 'CPF / CNPJ'), type: 'text', required: true, partners: [...CAM, ...SEG], width: 'third' },
      { key: 'ownershipPct', label: L('Participação (%)', 'Ownership (%)'), type: 'number', required: true, partners: CAM, width: 'third' },
      { key: 'nationality', label: L('Nacionalidade', 'Nationality'), type: 'country', width: 'third' },
      { key: 'isUltimateBeneficiary', label: L('É beneficiário final?', 'Is ultimate beneficial owner?'), type: 'select', required: true, options: yesNo(), partners: CAM, width: 'third' },
      { key: 'isPep', label: L('É PEP?', 'Is PEP?'), type: 'select', required: true, options: yesNo(), partners: CAM, width: 'third' },
    ],
  },
  {
    key: 'tradeRegistrations',
    companyType: 'EXPORTER',
    required: true,
    title: L('Habilitações e registros de exportação', 'Export registrations & licences'),
    description: L(
      'Habilitação no Siscomex (RADAR), registros no MAPA e demais cadastros exigidos para exportar.',
      'Siscomex (RADAR) enablement, MAPA registrations and other export licences.',
    ),
    fields: [
      {
        key: 'radarStatus', label: L('Habilitação no RADAR (Siscomex)', 'RADAR (Siscomex) enablement'), type: 'select', required: true, partners: DESP, width: 'half',
        options: [o('UNLIMITED', 'Ilimitada', 'Unlimited'), o('LIMITED', 'Limitada', 'Limited'), o('EXPRESS', 'Expressa', 'Express'), o('NONE', 'Não possui', 'None')],
      },
      { key: 'radarDate', label: L('Data da habilitação', 'Enablement date'), type: 'date', partners: DESP, width: 'half' },
      { key: 'mapaRegistration', label: L('Registro / cadastro no MAPA (exportador)', 'MAPA registration (exporter)'), type: 'text', required: true, partners: DESP, width: 'half' },
      { key: 'mapaRegistrationValidity', label: L('Validade do registro MAPA', 'MAPA registration validity'), type: 'date', partners: DESP, width: 'half' },
      { key: 'ibamaCtf', label: L('Cadastro Técnico Federal IBAMA (CTF/APP), se aplicável', 'IBAMA federal registry (CTF/APP), if applicable'), type: 'text', width: 'half' },
      { key: 'hasExportExperience', label: L('Já exportou antes?', 'Has previous export experience?'), type: 'select', required: true, options: yesNo(), width: 'half' },
      { key: 'exportExperienceYears', label: L('Anos de experiência exportando', 'Years of export experience'), type: 'number', showIf: { key: 'hasExportExperience', equals: 'YES' }, width: 'half' },
      { key: 'currentCustomsBroker', label: L('Despachante aduaneiro atual (se houver)', 'Current customs broker (if any)'), type: 'text', partners: DESP, width: 'half' },
      { key: 'notes', label: L('Observações sobre habilitações', 'Notes about registrations'), type: 'textarea', width: 'full' },
    ],
  },
  {
    key: 'bankAccounts',
    companyType: 'EXPORTER',
    required: true,
    repeatable: { min: 1, max: 6, itemLabel: L('Conta bancária', 'Bank account') },
    title: L('Dados bancários (recebimento do câmbio)', 'Bank details (FX proceeds)'),
    description: L(
      'Conta(s) em nome da empresa para recebimento. Repassadas ao parceiro de câmbio.',
      'Account(s) in the company name to receive proceeds. Shared with the FX partner.',
    ),
    fields: [
      { key: 'currency', label: L('Moeda', 'Currency'), type: 'select', optionsFrom: 'currencies', required: true, partners: CAM, width: 'third' },
      { key: 'bankName', label: L('Banco', 'Bank'), type: 'text', required: true, partners: CAM, width: 'third' },
      { key: 'bankCode', label: L('Código do banco (COMPE)', 'Bank code (COMPE)'), type: 'text', required: true, partners: CAM, width: 'third' },
      { key: 'agency', label: L('Agência', 'Branch'), type: 'text', required: true, partners: CAM, width: 'third' },
      { key: 'accountNumber', label: L('Conta (com dígito)', 'Account number'), type: 'text', required: true, partners: CAM, width: 'third' },
      { key: 'accountType', label: L('Tipo de conta', 'Account type'), type: 'select', required: true, partners: CAM, width: 'third', options: [o('CHECKING', 'Corrente', 'Checking'), o('SAVINGS', 'Poupança', 'Savings')] },
      { key: 'swift', label: L('SWIFT/BIC do banco', 'Bank SWIFT/BIC'), type: 'swift', partners: CAM, width: 'half' },
      { key: 'iban', label: L('IBAN (se houver)', 'IBAN (if any)'), type: 'iban', partners: CAM, width: 'half' },
      { key: 'holderName', label: L('Titular', 'Account holder'), type: 'text', required: true, partners: CAM, width: 'half' },
      { key: 'holderDocument', label: L('CNPJ do titular', 'Holder CNPJ'), type: 'cnpj', required: true, partners: CAM, width: 'half' },
    ],
  },
  {
    key: 'operation',
    companyType: 'EXPORTER',
    required: true,
    title: L('Operação e produtos', 'Operation & products'),
    description: L(
      'Perfil de exportação: produtos, capacidade, mercados e condições comerciais.',
      'Export profile: products, capacity, markets and commercial conditions.',
    ),
    fields: [
      { key: 'mainProducts', label: L('Principais produtos', 'Main products'), type: 'tags', required: true, partners: [...DESP, ...SEG], width: 'full' },
      { key: 'ncmCodes', label: L('NCM dos produtos', 'NCM codes'), type: 'ncm', required: true, partners: DESP, help: L('8 dígitos, ex.: 0801.21.00', '8 digits, e.g. 0801.21.00'), width: 'full' },
      { key: 'annualCapacityTons', label: L('Capacidade anual (ton)', 'Annual capacity (t)'), type: 'number', required: true, width: 'third' },
      { key: 'annualExportTons', label: L('Volume exportado/ano (ton)', 'Exported volume per year (t)'), type: 'number', width: 'third' },
      { key: 'avgShipmentValueUsd', label: L('Valor médio por embarque (USD)', 'Average shipment value (USD)'), type: 'number', required: true, partners: [...SEG, ...CAM], width: 'third' },
      { key: 'mainDestinations', label: L('Principais destinos', 'Main destinations'), type: 'multiselect', optionsFrom: 'countries', required: true, width: 'full' },
      { key: 'originPorts', label: L('Portos de embarque preferenciais', 'Preferred loading ports'), type: 'multiselect', optionsFrom: 'ports_br', required: true, partners: [...MAR, ...TER, ...DESP], width: 'full' },
      { key: 'productionRegions', label: L('Regiões de produção/extrativismo', 'Production / extraction regions'), type: 'tags', partners: TER, width: 'full' },
      { key: 'harvestMonths', label: L('Meses de safra', 'Harvest months'), type: 'tags', width: 'half' },
      { key: 'storageCapacityTons', label: L('Capacidade de armazenagem (ton)', 'Storage capacity (t)'), type: 'number', partners: TER, width: 'half' },
      { key: 'packagingTypes', label: L('Embalagens oferecidas', 'Packaging offered'), type: 'tags', partners: [...MAR, ...TER], width: 'half' },
      { key: 'pickupLeadTimeDays', label: L('Prazo p/ ficar pronto após pedido (dias)', 'Lead time to ready cargo (days)'), type: 'number', required: true, partners: TER, width: 'half' },
      { key: 'certifications', label: L('Certificações', 'Certifications'), type: 'multiselect', optionsFrom: 'certifications', width: 'full' },
      { key: 'preferredIncoterms', label: L('Incoterms oferecidos', 'Incoterms offered'), type: 'multiselect', optionsFrom: 'incoterms', required: true, width: 'half' },
      {
        key: 'acceptedPayments', label: L('Condições de pagamento aceitas', 'Accepted payment terms'), type: 'multiselect', required: true, partners: CAM, width: 'half',
        options: [o('ADVANCE', 'Pagamento antecipado', 'Advance payment'), o('LC', 'Carta de crédito', 'Letter of credit'), o('DOC_COLLECTION', 'Cobrança documentária', 'Documentary collection'), o('30_70_BL', '30% antecipado + 70% contra BL', '30% advance + 70% against BL'), o('OPEN_ACCOUNT', 'Conta aberta', 'Open account')],
      },
      { key: 'hasQualityLab', label: L('Possui laboratório/controle de qualidade próprio?', 'Has own quality lab?'), type: 'select', options: yesNo(), width: 'half' },
    ],
  },
  {
    key: 'insuranceInfo',
    companyType: 'EXPORTER',
    required: true,
    title: L('Seguros e histórico de risco', 'Insurance & risk history'),
    description: L('Informações usadas na cotação do seguro de carga e de crédito.', 'Used for cargo and credit insurance quotes.'),
    fields: [
      { key: 'hasCargoInsurance', label: L('Possui seguro de carga?', 'Has cargo insurance?'), type: 'select', required: true, options: yesNo(), partners: SEG, width: 'half' },
      { key: 'currentInsurer', label: L('Seguradora atual', 'Current insurer'), type: 'text', partners: SEG, showIf: { key: 'hasCargoInsurance', equals: 'YES' }, width: 'half' },
      { key: 'hasCreditInsurance', label: L('Possui seguro de crédito à exportação?', 'Has export credit insurance?'), type: 'select', required: true, options: yesNo(), partners: SEG, width: 'half' },
      { key: 'claimsLast3Years', label: L('Sinistros nos últimos 3 anos', 'Claims in the last 3 years'), type: 'select', required: true, partners: SEG, width: 'half', options: [o('NONE', 'Nenhum', 'None'), o('1_2', '1 a 2', '1-2'), o('3_PLUS', '3 ou mais', '3+')] },
      { key: 'claimsDescription', label: L('Descreva os sinistros', 'Describe the claims'), type: 'textarea', partners: SEG, showIf: { key: 'claimsLast3Years', equals: '1_2' }, width: 'full' },
    ],
  },
  {
    key: 'references',
    companyType: 'EXPORTER',
    required: true,
    repeatable: { min: 2, max: 8, itemLabel: L('Referência comercial', 'Trade reference') },
    title: L('Referências comerciais e bancárias', 'Trade & bank references'),
    fields: [
      { key: 'kind', label: L('Tipo', 'Type'), type: 'select', required: true, width: 'third', options: [o('CUSTOMER', 'Cliente', 'Customer'), o('SUPPLIER', 'Fornecedor', 'Supplier'), o('BANK', 'Banco', 'Bank')] },
      { key: 'companyName', label: L('Empresa / banco', 'Company / bank'), type: 'text', required: true, width: 'third' },
      { key: 'country', label: L('País', 'Country'), type: 'country', required: true, width: 'third' },
      { key: 'contactName', label: L('Contato', 'Contact'), type: 'text', required: true, width: 'third' },
      { key: 'email', label: L('E-mail', 'E-mail'), type: 'email', required: true, width: 'third' },
      { key: 'phone', label: L('Telefone', 'Phone'), type: 'phone', width: 'third' },
      { key: 'relationshipYears', label: L('Anos de relacionamento', 'Years of relationship'), type: 'number', width: 'third' },
    ],
  },
  {
    key: 'declarations',
    companyType: 'EXPORTER',
    required: true,
    title: L('Declarações e consentimentos', 'Declarations & consents'),
    description: L(
      'Necessárias para a análise de compliance e para compartilharmos seus dados com os parceiros da operação.',
      'Required for compliance review and to share your data with operation partners.',
    ),
    fields: [
      { key: 'truthful', label: L('Declaro que todas as informações e documentos são verdadeiros e atualizados.', 'I declare that all information and documents are true and up to date.'), type: 'boolean', required: true, width: 'full' },
      { key: 'terms', label: L('Li e aceito os Termos de Uso da plataforma Amazon Trade.', 'I have read and accept the Amazon Trade Terms of Use.'), type: 'boolean', required: true, width: 'full' },
      { key: 'privacy', label: L('Li e aceito a Política de Privacidade (LGPD).', 'I have read and accept the Privacy Policy (LGPD).'), type: 'boolean', required: true, width: 'full' },
      { key: 'partnerSharing', label: L('Autorizo o compartilhamento dos meus dados e documentos com despachante, transportadoras, câmbio e seguradora estritamente para executar as operações contratadas.', 'I authorize sharing my data and documents with customs broker, carriers, FX and insurer strictly to perform contracted operations.'), type: 'boolean', required: true, width: 'full' },
      { key: 'amlSanctions', label: L('Declaro que a empresa, seus sócios e administradores não constam em listas de sanções nem respondem por lavagem de dinheiro, corrupção ou trabalho análogo ao escravo.', 'I declare that the company, shareholders and officers are not on sanctions lists nor subject to money laundering, corruption or forced-labour proceedings.'), type: 'boolean', required: true, width: 'full' },
      { key: 'environmental', label: L('Declaro que o produto não provém de áreas embargadas ou desmatamento ilegal.', 'I declare the product does not originate from embargoed areas or illegal deforestation.'), type: 'boolean', required: true, width: 'full' },
    ],
  },
]
