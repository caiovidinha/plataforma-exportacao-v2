import { L } from '../i18n'
import type { PartnerType } from '../enums'
import { CORE_PARTNER_TYPES } from '../enums'
import type { FieldOption, SectionDef } from '../fields'
import { yesNo } from '../fields'

const ALL = CORE_PARTNER_TYPES
const DESP: PartnerType[] = ['DESPACHANTE']
const MAR: PartnerType[] = ['TRANSPORTE_MARITIMO']
const CAM: PartnerType[] = ['CAMBIO']
const SEG: PartnerType[] = ['SEGURO']

const o = (value: string, pt: string, en: string): FieldOption => ({ value, label: L(pt, en) })

/**
 * Cadastro do IMPORTADOR (empresa estrangeira). Textos bilíngues.
 * `partners` indica quem precisa do dado no destino (consignee/notify aparecem no BL e na DU-E).
 */
export const IMPORTER_SECTIONS: SectionDef[] = [
  {
    key: 'company',
    companyType: 'IMPORTER',
    required: true,
    title: L('Dados da empresa', 'Company details'),
    description: L('Dados cadastrais conforme registro comercial do seu país.', 'Registration data as per your national commercial register.'),
    fields: [
      { key: 'legalName', label: L('Razão social', 'Legal name'), type: 'text', required: true, partners: ALL, width: 'full' },
      { key: 'tradeName', label: L('Nome fantasia', 'Trade name'), type: 'text', partners: ALL, width: 'half' },
      { key: 'country', label: L('País de registro', 'Country of registration'), type: 'country', required: true, partners: ALL, width: 'half' },
      { key: 'taxId', label: L('Tax ID / VAT', 'Tax ID / VAT'), type: 'text', required: true, partners: ALL, width: 'half' },
      { key: 'eori', label: L('EORI (UE/Reino Unido)', 'EORI (EU/UK)'), type: 'text', partners: [...DESP, ...MAR], width: 'half' },
      { key: 'registryNumber', label: L('Nº do registro comercial', 'Commercial register number'), type: 'text', required: true, partners: CAM, width: 'half' },
      { key: 'registryAuthority', label: L('Órgão de registro', 'Registry authority'), type: 'text', width: 'half' },
      { key: 'legalForm', label: L('Forma jurídica', 'Legal form'), type: 'text', required: true, placeholder: 'GmbH, BV, Ltd, Inc...', width: 'half' },
      { key: 'foundedAt', label: L('Data de constituição', 'Incorporation date'), type: 'date', required: true, width: 'half' },
      { key: 'businessActivity', label: L('Atividade principal', 'Main business activity'), type: 'text', required: true, width: 'half' },
      { key: 'employeesRange', label: L('Funcionários', 'Employees'), type: 'select', width: 'half', options: [o('1-9', '1 a 9', '1-9'), o('10-49', '10 a 49', '10-49'), o('50-199', '50 a 199', '50-199'), o('200+', '200 ou mais', '200+')] },
      { key: 'website', label: L('Site', 'Website'), type: 'url', width: 'half' },
      { key: 'description', label: L('Descrição da empresa', 'Company description'), type: 'textarea', width: 'full' },
    ],
  },
  {
    key: 'addresses',
    companyType: 'IMPORTER',
    required: true,
    repeatable: { min: 1, max: 10, itemLabel: L('Endereço', 'Address') },
    title: L('Endereços', 'Addresses'),
    fields: [
      { key: 'kind', label: L('Tipo', 'Type'), type: 'select', required: true, width: 'third', options: [o('REGISTERED', 'Sede registrada', 'Registered office'), o('WAREHOUSE', 'Armazém / entrega', 'Warehouse / delivery'), o('BILLING', 'Cobrança', 'Billing')] },
      { key: 'street', label: L('Endereço', 'Street address'), type: 'text', required: true, partners: ALL, width: 'full' },
      { key: 'city', label: L('Cidade', 'City'), type: 'text', required: true, partners: ALL, width: 'third' },
      { key: 'region', label: L('Estado / região', 'State / region'), type: 'text', width: 'third' },
      { key: 'zip', label: L('Código postal', 'Postal code'), type: 'text', required: true, partners: ALL, width: 'third' },
      { key: 'country', label: L('País', 'Country'), type: 'country', required: true, partners: ALL, width: 'third' },
    ],
  },
  {
    key: 'contacts',
    companyType: 'IMPORTER',
    required: true,
    repeatable: { min: 2, max: 12, itemLabel: L('Contato', 'Contact') },
    title: L('Contatos operacionais', 'Operational contacts'),
    description: L('Ao menos um contato comercial e um de logística/financeiro.', 'At least one commercial and one logistics/finance contact.'),
    fields: [
      { key: 'name', label: L('Nome completo', 'Full name'), type: 'text', required: true, partners: ALL, width: 'half' },
      { key: 'department', label: L('Área', 'Department'), type: 'select', required: true, width: 'half', options: [o('COMMERCIAL', 'Comercial', 'Commercial'), o('LOGISTICS', 'Logística', 'Logistics'), o('FINANCE', 'Financeiro', 'Finance'), o('CUSTOMS', 'Alfândega', 'Customs'), o('QUALITY', 'Qualidade', 'Quality')] },
      { key: 'role', label: L('Cargo', 'Job title'), type: 'text', width: 'half' },
      { key: 'email', label: L('E-mail', 'E-mail'), type: 'email', required: true, partners: ALL, width: 'half' },
      { key: 'phone', label: L('Telefone', 'Phone'), type: 'phone', required: true, partners: ALL, width: 'half' },
      { key: 'whatsapp', label: L('WhatsApp', 'WhatsApp'), type: 'phone', partners: [...SEG, ...CAM], width: 'half' },
    ],
  },
  {
    key: 'representatives',
    companyType: 'IMPORTER',
    required: true,
    repeatable: { min: 1, max: 8, itemLabel: L('Signatário autorizado', 'Authorised signatory') },
    title: L('Signatários autorizados', 'Authorised signatories'),
    fields: [
      { key: 'fullName', label: L('Nome completo', 'Full name'), type: 'text', required: true, partners: [...CAM, ...DESP], width: 'half' },
      { key: 'role', label: L('Cargo', 'Role'), type: 'text', required: true, width: 'half' },
      { key: 'nationality', label: L('Nacionalidade', 'Nationality'), type: 'country', required: true, partners: CAM, width: 'third' },
      { key: 'birthDate', label: L('Data de nascimento', 'Birth date'), type: 'date', required: true, partners: CAM, width: 'third' },
      { key: 'passportNumber', label: L('Nº do passaporte / ID', 'Passport / ID number'), type: 'text', required: true, partners: CAM, width: 'third' },
      { key: 'idIssuingCountry', label: L('País emissor do documento', 'Document issuing country'), type: 'country', required: true, width: 'third' },
      { key: 'idExpiry', label: L('Validade do documento', 'Document expiry'), type: 'date', required: true, width: 'third' },
      { key: 'email', label: L('E-mail', 'E-mail'), type: 'email', required: true, width: 'half' },
      { key: 'phone', label: L('Telefone', 'Phone'), type: 'phone', width: 'half' },
      { key: 'signingPower', label: L('Poder de assinatura', 'Signing power'), type: 'select', required: true, width: 'half', options: [o('ALONE', 'Isoladamente', 'Alone'), o('JOINT', 'Em conjunto', 'Jointly')] },
      { key: 'isPep', label: L('É pessoa politicamente exposta (PEP)?', 'Is a politically exposed person (PEP)?'), type: 'select', required: true, options: yesNo(), partners: CAM, width: 'half' },
    ],
  },
  {
    key: 'ubos',
    companyType: 'IMPORTER',
    required: true,
    repeatable: { min: 1, max: 20, itemLabel: L('Beneficiário final / sócio', 'Beneficial owner / shareholder') },
    title: L('Beneficiários finais (UBO)', 'Ultimate beneficial owners (UBO)'),
    description: L('Pessoas físicas com 25% ou mais, ou que exerçam controle.', 'Natural persons holding 25%+ or exercising control.'),
    fields: [
      { key: 'name', label: L('Nome / razão social', 'Name / legal name'), type: 'text', required: true, partners: [...CAM, ...SEG], width: 'half' },
      { key: 'kind', label: L('Tipo', 'Type'), type: 'select', required: true, width: 'third', options: [o('PERSON', 'Pessoa física', 'Natural person'), o('COMPANY', 'Pessoa jurídica', 'Legal entity')] },
      { key: 'ownershipPct', label: L('Participação (%)', 'Ownership (%)'), type: 'number', required: true, partners: CAM, width: 'third' },
      { key: 'nationality', label: L('Nacionalidade', 'Nationality'), type: 'country', required: true, width: 'third' },
      { key: 'residenceCountry', label: L('País de residência', 'Country of residence'), type: 'country', width: 'third' },
      { key: 'isPep', label: L('É PEP?', 'Is PEP?'), type: 'select', required: true, options: yesNo(), partners: CAM, width: 'third' },
    ],
  },
  {
    key: 'importRegulatory',
    companyType: 'IMPORTER',
    required: true,
    title: L('Importação, consignee e notify', 'Import, consignee & notify party'),
    description: L(
      'Dados que constam no BL, na DU-E e na liberação no destino.',
      'Data that appears on the BL, export declaration and destination clearance.',
    ),
    fields: [
      { key: 'importLicenseNumber', label: L('Licença / registro de importação', 'Import licence / registration'), type: 'text', required: true, partners: DESP, width: 'half' },
      { key: 'importLicenseExpiry', label: L('Validade da licença', 'Licence expiry'), type: 'date', partners: DESP, width: 'half' },
      { key: 'foodSafetyRegistration', label: L('Registro sanitário/segurança alimentar (ex.: FDA FFR, UE FBO)', 'Food safety registration (e.g. FDA FFR, EU FBO)'), type: 'text', required: true, partners: DESP, width: 'full' },
      { key: 'aeoCertified', label: L('Possui certificação AEO?', 'AEO certified?'), type: 'select', options: yesNo(), width: 'half' },
      { key: 'destinationPorts', label: L('Portos de destino preferenciais', 'Preferred destination ports'), type: 'multiselect', optionsFrom: 'ports_all', required: true, partners: MAR, width: 'half' },
      { key: 'consigneeName', label: L('Consignee (nome no BL)', 'Consignee (name on BL)'), type: 'text', required: true, partners: [...MAR, ...DESP], width: 'half' },
      { key: 'consigneeTaxId', label: L('Tax ID do consignee', 'Consignee tax ID'), type: 'text', required: true, partners: [...MAR, ...DESP], width: 'half' },
      { key: 'consigneeAddress', label: L('Endereço do consignee', 'Consignee address'), type: 'text', required: true, partners: [...MAR, ...DESP], width: 'full' },
      { key: 'notifySameAsConsignee', label: L('Notify party é o mesmo que o consignee?', 'Notify party same as consignee?'), type: 'select', required: true, options: yesNo(), width: 'full' },
      { key: 'notifyName', label: L('Notify party (nome)', 'Notify party (name)'), type: 'text', partners: MAR, showIf: { key: 'notifySameAsConsignee', equals: 'NO' }, width: 'half' },
      { key: 'notifyAddress', label: L('Notify party (endereço)', 'Notify party (address)'), type: 'text', partners: MAR, showIf: { key: 'notifySameAsConsignee', equals: 'NO' }, width: 'half' },
      { key: 'customsBrokerName', label: L('Despachante/corretor aduaneiro no destino', 'Destination customs broker'), type: 'text', required: true, partners: DESP, width: 'half' },
      { key: 'customsBrokerContact', label: L('Contato do corretor (e-mail/telefone)', 'Broker contact (e-mail/phone)'), type: 'text', required: true, partners: DESP, width: 'half' },
      { key: 'deliveryRequirements', label: L('Requisitos de entrega/recebimento', 'Delivery / receiving requirements'), type: 'textarea', width: 'full' },
    ],
  },
  {
    key: 'bankAccounts',
    companyType: 'IMPORTER',
    required: true,
    repeatable: { min: 1, max: 6, itemLabel: L('Conta bancária', 'Bank account') },
    title: L('Dados bancários (pagamento)', 'Bank details (payments)'),
    description: L('Conta de origem dos pagamentos. Repassada ao parceiro de câmbio.', 'Paying account. Shared with the FX partner.'),
    fields: [
      { key: 'currency', label: L('Moeda', 'Currency'), type: 'select', optionsFrom: 'currencies', required: true, partners: CAM, width: 'third' },
      { key: 'bankName', label: L('Banco', 'Bank'), type: 'text', required: true, partners: CAM, width: 'third' },
      { key: 'bankCountry', label: L('País do banco', 'Bank country'), type: 'country', required: true, partners: CAM, width: 'third' },
      { key: 'swift', label: L('SWIFT/BIC', 'SWIFT/BIC'), type: 'swift', required: true, partners: CAM, width: 'half' },
      { key: 'iban', label: L('IBAN / nº da conta', 'IBAN / account number'), type: 'iban', partners: CAM, width: 'half' },
      { key: 'accountNumber', label: L('Nº da conta (se não houver IBAN)', 'Account number (if no IBAN)'), type: 'text', partners: CAM, width: 'half' },
      { key: 'holderName', label: L('Titular', 'Account holder'), type: 'text', required: true, partners: CAM, width: 'half' },
    ],
  },
  {
    key: 'operation',
    companyType: 'IMPORTER',
    required: true,
    title: L('Perfil de compra', 'Buying profile'),
    fields: [
      { key: 'annualImportTons', label: L('Volume de importação/ano (ton)', 'Annual import volume (t)'), type: 'number', required: true, width: 'third' },
      { key: 'avgOrderValueUsd', label: L('Valor médio por pedido (USD)', 'Average order value (USD)'), type: 'number', required: true, partners: [...SEG, ...CAM], width: 'third' },
      { key: 'targetMarkets', label: L('Mercados atendidos', 'Markets served'), type: 'tags', width: 'third' },
      { key: 'productsOfInterest', label: L('Produtos de interesse', 'Products of interest'), type: 'tags', required: true, width: 'full' },
      { key: 'certificationsRequired', label: L('Certificações exigidas', 'Required certifications'), type: 'multiselect', optionsFrom: 'certifications', width: 'full' },
      { key: 'qualityRequirements', label: L('Requisitos de qualidade (aflatoxina máx., umidade, calibre...)', 'Quality requirements (max aflatoxin, moisture, grade...)'), type: 'textarea', width: 'full' },
      { key: 'preferredIncoterms', label: L('Incoterms preferidos', 'Preferred incoterms'), type: 'multiselect', optionsFrom: 'incoterms', required: true, width: 'half' },
      { key: 'acceptedPayments', label: L('Condições de pagamento aceitas', 'Accepted payment terms'), type: 'multiselect', required: true, partners: CAM, width: 'half', options: [o('ADVANCE', 'Pagamento antecipado', 'Advance payment'), o('LC', 'Carta de crédito', 'Letter of credit'), o('DOC_COLLECTION', 'Cobrança documentária', 'Documentary collection'), o('30_70_BL', '30% antecipado + 70% contra BL', '30% advance + 70% against BL')] },
      { key: 'requiresCargoInsurance', label: L('Exige seguro da mercadoria?', 'Requires cargo insurance?'), type: 'select', required: true, options: yesNo(), partners: SEG, width: 'half' },
    ],
  },
  {
    key: 'credit',
    companyType: 'IMPORTER',
    required: true,
    title: L('Informações financeiras e crédito', 'Financial & credit information'),
    fields: [
      { key: 'annualRevenueRange', label: L('Faturamento anual (USD)', 'Annual revenue (USD)'), type: 'select', required: true, partners: [...CAM, ...SEG], width: 'half', options: [o('<1M', 'Até 1 mi', 'Up to 1M'), o('1-5M', '1 a 5 mi', '1-5M'), o('5-20M', '5 a 20 mi', '5-20M'), o('20-100M', '20 a 100 mi', '20-100M'), o('100M+', 'Acima de 100 mi', '100M+')] },
      { key: 'creditRating', label: L('Rating de crédito (Dun & Bradstreet, Creditsafe...)', 'Credit rating (Dun & Bradstreet, Creditsafe...)'), type: 'text', partners: SEG, width: 'half' },
      { key: 'duns', label: L('Número D-U-N-S', 'D-U-N-S number'), type: 'text', partners: SEG, width: 'half' },
      { key: 'hasPaymentDefaults', label: L('Já teve atraso/inadimplência com fornecedores nos últimos 3 anos?', 'Any supplier payment defaults in the last 3 years?'), type: 'select', required: true, options: yesNo(), partners: [...CAM, ...SEG], width: 'half' },
      { key: 'defaultsDescription', label: L('Descreva', 'Describe'), type: 'textarea', showIf: { key: 'hasPaymentDefaults', equals: 'YES' }, width: 'full' },
    ],
  },
  {
    key: 'references',
    companyType: 'IMPORTER',
    required: true,
    repeatable: { min: 2, max: 8, itemLabel: L('Referência comercial', 'Trade reference') },
    title: L('Referências comerciais e bancárias', 'Trade & bank references'),
    fields: [
      { key: 'kind', label: L('Tipo', 'Type'), type: 'select', required: true, width: 'third', options: [o('SUPPLIER', 'Fornecedor', 'Supplier'), o('CUSTOMER', 'Cliente', 'Customer'), o('BANK', 'Banco', 'Bank')] },
      { key: 'companyName', label: L('Empresa / banco', 'Company / bank'), type: 'text', required: true, width: 'third' },
      { key: 'country', label: L('País', 'Country'), type: 'country', required: true, width: 'third' },
      { key: 'contactName', label: L('Contato', 'Contact'), type: 'text', required: true, width: 'third' },
      { key: 'email', label: L('E-mail', 'E-mail'), type: 'email', required: true, width: 'third' },
      { key: 'phone', label: L('Telefone', 'Phone'), type: 'phone', width: 'third' },
    ],
  },
  {
    key: 'declarations',
    companyType: 'IMPORTER',
    required: true,
    title: L('Declarações e consentimentos', 'Declarations & consents'),
    fields: [
      { key: 'truthful', label: L('Declaro que todas as informações e documentos são verdadeiros e atualizados.', 'I declare that all information and documents are true and up to date.'), type: 'boolean', required: true, width: 'full' },
      { key: 'terms', label: L('Li e aceito os Termos de Uso da plataforma Amazon Trade.', 'I have read and accept the Amazon Trade Terms of Use.'), type: 'boolean', required: true, width: 'full' },
      { key: 'privacy', label: L('Li e aceito a Política de Privacidade (LGPD/GDPR).', 'I have read and accept the Privacy Policy (LGPD/GDPR).'), type: 'boolean', required: true, width: 'full' },
      { key: 'partnerSharing', label: L('Autorizo o compartilhamento dos meus dados e documentos com despachante, transportadoras, câmbio e seguradora estritamente para executar as operações contratadas.', 'I authorize sharing my data and documents with customs broker, carriers, FX and insurer strictly to perform contracted operations.'), type: 'boolean', required: true, width: 'full' },
      { key: 'amlSanctions', label: L('Declaro que a empresa, seus sócios e administradores não constam em listas de sanções (OFAC, UE, ONU) nem respondem por lavagem de dinheiro ou corrupção.', 'I declare that the company, shareholders and officers are not on sanctions lists (OFAC, EU, UN) nor subject to money laundering or corruption proceedings.'), type: 'boolean', required: true, width: 'full' },
    ],
  },
]
