// Central configuration for all registrable entity types.
// Used by the "O que você é?" selector and the multi-step registration form.

export type EntitySlug =
  | 'exportador'
  | 'importador'
  | 'transportadora'
  | 'companhia-navegacao'
  | 'despachante'
  | 'corretora'
  | 'terminal'
  | 'seguradora'
  | 'certificadora'
  | 'laboratorio'

export interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'select' | 'multiselect' | 'textarea' | 'checkbox'
  placeholder?: string
  options?: string[]
  hint?: string
  required?: boolean
}

export interface EntityConfig {
  slug: EntitySlug
  label: string
  labelPlural: string
  tagline: string
  description: string
  /** lucide icon name (used as string; consumer maps to component) */
  icon: string
  color: string  // tailwind text color
  bg: string     // tailwind bg color
  /** Fields shown on Step 2 "Dados Específicos" */
  specificFields: FieldDef[]
  /** Common fields for Step 1 overrides (if needed) */
  cnpjLabel?: string
  /** Whether they need the mapa warning */
  mapaRelevant?: boolean
}

const UF_OPTIONS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const CURRENCY_OPTIONS = ['USD','EUR','GBP','JPY','CNY','CHF','AUD','CAD']
const INSURANCE_OPTIONS = ['Seguro de Carga','Seguro Safra','Seguro Pagamento','Seguro Garantia','Seguro de Crédito à Exportação']
const CERT_OPTIONS = ['Orgânico IBD','Orgânico USDA','Fair Trade','Rainforest Alliance','UTZ','ISO 22000','HACCP','Kosher','Halal']
const LAB_TEST_OPTIONS = ['Aflatoxina','Metais Pesados','Umidade','Granulometria','Microbiológico','Pesticides','Ochratoxin']
const INCOTERM_OPTIONS = ['FOB','CIF','CFR','EXW','DDP','DAP','CPT','FCA']
const TRANSPORT_OPTIONS = ['Caminhão Baú','Caminhão Frigorífico','Van','Carreta','Reboque','Fluvial','Aéreo']
const ROUTE_OPTIONS = ['Santos → Rotterdam','Santos → Hamburg','Itajaí → Felixstowe','Belém → Miami','Manaus → Barcelona','Santos → Shanghai','Belém → Rotterdam']
const PORT_OPTIONS = ['Belém (PA)','Itajaí (SC)','Manaus (AM)','Paranaguá (PR)','Porto Alegre (RS)','Porto Velho (RO)','Recife (PE)','Rio de Janeiro (RJ)','Salvador (BA)','Santarém (PA)','Santos (SP)','São Francisco do Sul (SC)','Vitória (ES)']
const COUNTRY_OPTIONS = ['Alemanha','Angola','Arábia Saudita','Argentina','Austrália','Áustria','Bélgica','Bolívia','Canadá','Chile','China','Colômbia','Coreia do Sul','Costa Rica','Croácia','Dinamarca','Emirados Árabes Unidos','Equador','Espanha','Estados Unidos','Finlândia','França','Grécia','Guatemala','Holanda (Países Baixos)','Hong Kong','Hungria','Índia','Indonésia','Israel','Itália','Japão','Malásia','Marrocos','México','Moçambique','Nigéria','Noruega','Panamá','Paraguai','Peru','Polônia','Portugal','Reino Unido','República Tcheca','Romênia','Rússia','Singapura','Suécia','Suíça','Taiwan','Tailândia','Turquia','Ucrânia','Uruguai','Venezuela','Outro']

export const ENTITY_CONFIG: Record<EntitySlug, EntityConfig> = {
  exportador: {
    slug: 'exportador',
    label: 'Exportador',
    labelPlural: 'Exportadores',
    tagline: 'Venda sua castanha para o mundo',
    description: 'Empresas e produtores que exportam castanha-do-Brasil ou outros produtos agropecuários.',
    icon: 'Globe',
    color: 'text-brand-400',
    bg: 'bg-brand-400/10',
    mapaRelevant: true,
    specificFields: [
      { key: 'origem_uf', label: 'Estado de Origem Principal', type: 'select', options: UF_OPTIONS, required: true },
      { key: 'cidade', label: 'Município', type: 'text', required: true },
      { key: 'siscomex_code', label: 'Código SISCOMEX (Habilitação)', type: 'text', placeholder: 'Ex.: BR0123456' },
      { key: 'mapa_registered', label: 'Possui registro no MAPA?', type: 'select', options: ['Sim','Não','Em andamento'] },
      { key: 'mapa_code', label: 'Código de Registro MAPA', type: 'text', placeholder: 'Ex.: SIP/RO/00123', hint: 'Deixe em branco se ainda não possui' },
      { key: 'ncm_codes', label: 'NCM dos produtos que exporta', type: 'text', placeholder: 'Ex.: 0801.21.00, 0801.22.00' },
      { key: 'capacidade_anual_ton', label: 'Capacidade anual de exportação (ton)', type: 'number', placeholder: 'Ex.: 50' },
    ],
  },
  importador: {
    slug: 'importador',
    label: 'Importador',
    labelPlural: 'Importadores',
    tagline: 'Encontre castanha diretamente na origem',
    description: 'Compradores internacionais que importam castanha-do-Brasil.',
    icon: 'Building2',
    color: 'text-[#c9a07a]',
    bg: 'bg-[#c9a07a]/10',
    cnpjLabel: 'VAT / Tax ID',
    specificFields: [
      { key: 'country_code', label: 'País', type: 'select', options: COUNTRY_OPTIONS, required: true },
      { key: 'target_port', label: 'Porto de Destino Principal', type: 'text', placeholder: 'Ex.: Rotterdam, Hamburg', required: true },
      { key: 'preferred_incoterm', label: 'Incoterm Preferido', type: 'select', options: INCOTERM_OPTIONS, required: true },
      { key: 'annual_volume_ton', label: 'Volume anual de importação (ton)', type: 'number', placeholder: 'Ex.: 100' },
      { key: 'certifications_required', label: 'Certificações exigidas', type: 'text', placeholder: 'Ex.: Orgânico IBD, Fair Trade' },
      { key: 'ministry_registration', label: 'Reg. Ministério da Agricultura local', type: 'text' },
    ],
  },
  transportadora: {
    slug: 'transportadora',
    label: 'Transportadora',
    labelPlural: 'Transportadoras',
    tagline: 'Transporte da origem ao porto',
    description: 'Empresas de transporte rodoviário ou fluvial que movem a mercadoria até o terminal.',
    icon: 'Truck',
    color: 'text-[#ab7d52]',
    bg: 'bg-[#ab7d52]/10',
    specificFields: [
      { key: 'ufs_cobertas', label: 'Estados atendidos', type: 'multiselect', options: UF_OPTIONS, required: true },
      { key: 'rntrc', label: 'RNTRC (ANTT)', type: 'text', placeholder: 'Ex.: 0012345', required: true, hint: 'Registro Nacional de Transportadores Rodoviários de Cargas' },
      { key: 'valor_km', label: 'Valor médio por km (R$)', type: 'number', placeholder: 'Ex.: 4.50' },
      { key: 'seguro_carga', label: 'Oferece seguro de carga?', type: 'select', options: ['Sim','Não'] },
    ],
  },
  'companhia-navegacao': {
    slug: 'companhia-navegacao',
    label: 'Companhia de Navegação',
    labelPlural: 'Companhias de Navegação',
    tagline: 'Rota marítima e aérea internacional',
    description: 'Armadores, agências marítimas e operadores logísticos internacionais.',
    icon: 'Ship',
    color: 'text-[#c9a07a]',
    bg: 'bg-[#c9a07a]/10',
    specificFields: [
      { key: 'ports_covered', label: 'Portos de Origem atendidos', type: 'multiselect', options: PORT_OPTIONS, required: true },
      { key: 'transit_time_days', label: 'Tempo médio de trânsito (dias)', type: 'number', placeholder: 'Ex.: 21' },
      { key: 'bl_draft_fee_usd', label: 'Taxa de emissão de BL (USD)', type: 'number', placeholder: 'Ex.: 75' },
    ],
  },
  despachante: {
    slug: 'despachante',
    label: 'Despachante Aduaneiro',
    labelPlural: 'Despachantes Aduaneiros',
    tagline: 'Liberação de carga no Siscomex e Redex',
    description: 'Despachantes habilitados para operar no REDEX e SISCOMEX para liberação de exportações.',
    icon: 'FileCheck',
    color: 'text-[#ab7d52]',
    bg: 'bg-[#ab7d52]/10',
    specificFields: [
      { key: 'habilitacao_siscomex', label: 'Habilitado no SISCOMEX?', type: 'select', options: ['Sim','Não'], required: true },
      { key: 'habilitacao_redex', label: 'Habilitado no REDEX?', type: 'select', options: ['Sim','Não'], required: true },
      { key: 'cnpj_habilitacao', label: 'CNPJ de Habilitação Receita Federal', type: 'text' },
      { key: 'portos_atuacao', label: 'Portos/Aeroportos de atuação', type: 'text', placeholder: 'Ex.: Santos, Guarulhos, Belém' },
      { key: 'fee_fixed_brl', label: 'Honorários fixos por processo (R$)', type: 'number', placeholder: 'Ex.: 2500' },
      { key: 'fee_variable_pct', label: 'Honorários variáveis (% do FOB)', type: 'number', placeholder: 'Ex.: 0.5' },
    ],
  },
  corretora: {
    slug: 'corretora',
    label: 'Corretora de Câmbio',
    labelPlural: 'Corretoras de Câmbio',
    tagline: 'Câmbio e recebimento do pagamento',
    description: 'Instituições autorizadas pelo BACEN para operações de câmbio na exportação.',
    icon: 'DollarSign',
    color: 'text-emerald-700',
    bg: 'bg-emerald-700/10',
    specificFields: [
      { key: 'bacen_authorization', label: 'Autorização BACEN', type: 'text', placeholder: 'Ex.: CAMTVM-123456', required: true },
      { key: 'currency_pairs', label: 'Moedas operadas', type: 'text', placeholder: 'Ex.: USD, EUR, GBP', required: true },
      { key: 'spread_pct', label: 'Spread médio (%)', type: 'number', placeholder: 'Ex.: 0.8' },
      { key: 'liquidation_days', label: 'Prazo de liquidação (dias úteis)', type: 'number', placeholder: 'Ex.: 2' },
      { key: 'swift_code', label: 'Código SWIFT/BIC', type: 'text', placeholder: 'Ex.: BRASBRRJXXX' },
    ],
  },
  terminal: {
    slug: 'terminal',
    label: 'Terminal Alfandegário',
    labelPlural: 'Terminais Alfandegários',
    tagline: 'Armazenamento, ovação e liberação',
    description: 'Empresas dentro de área alfandegária para pesagem, estufagem e movimentação de contêineres.',
    icon: 'Warehouse',
    color: 'text-[#c9a07a]',
    bg: 'bg-[#c9a07a]/10',
    specificFields: [
      { key: 'porto_nome', label: 'Porto vinculado', type: 'text', placeholder: 'Ex.: Porto de Santos', required: true },
      { key: 'cidade', label: 'Cidade', type: 'text', required: true },
      { key: 'uf', label: 'Estado', type: 'select', options: UF_OPTIONS, required: true },
      { key: 'capacidade_m3', label: 'Capacidade de armazenagem (m³)', type: 'number', placeholder: 'Ex.: 5000' },
      { key: 'redex', label: 'Área REDEX própria?', type: 'select', options: ['Sim','Não'] },
      { key: 'fee_estufagem_usd', label: 'Taxa de estufagem (USD/container)', type: 'number', placeholder: 'Ex.: 280' },
      { key: 'fee_armazem_dia_brl', label: 'Diária de armazém (R$/ton)', type: 'number', placeholder: 'Ex.: 12' },
    ],
  },
  seguradora: {
    slug: 'seguradora',
    label: 'Seguradora',
    labelPlural: 'Seguradoras',
    tagline: 'Proteção do produtor ao pagamento',
    description: 'Seguradoras autorizadas pela SUSEP para cobertura de carga, safra e risco de crédito.',
    icon: 'Shield',
    color: 'text-[#ab7d52]',
    bg: 'bg-[#ab7d52]/10',
    specificFields: [
      { key: 'susep_code', label: 'Código SUSEP', type: 'text', placeholder: 'Ex.: 06629', required: true },
      { key: 'tipos_seguro', label: 'Tipos de seguro oferecidos', type: 'text', placeholder: 'Ex.: Carga, Safra, Crédito', required: true },
      { key: 'cobertura_minima_usd', label: 'Cobertura mínima (USD)', type: 'number', placeholder: 'Ex.: 10000' },
      { key: 'cobertura_maxima_usd', label: 'Cobertura máxima (USD)', type: 'number', placeholder: 'Ex.: 5000000' },
      { key: 'premio_pct', label: 'Prêmio médio (% do valor segurado)', type: 'number', placeholder: 'Ex.: 0.4' },
      { key: 'latam_coverage', label: 'Cobertura América Latina?', type: 'select', options: ['Sim','Não'] },
    ],
  },
  certificadora: {
    slug: 'certificadora',
    label: 'Certificadora / Auditoria',
    labelPlural: 'Certificadoras',
    tagline: 'Certificação e auditoria de produto',
    description: 'Entidades credenciadas para emitir certificados de origem, orgânicos e auditar processos.',
    icon: 'BadgeCheck',
    color: 'text-[#c9a07a]',
    bg: 'bg-[#c9a07a]/10',
    specificFields: [
      { key: 'certificacoes', label: 'Certificações que emite', type: 'text', placeholder: 'Ex.: Orgânico IBD, Origem, HACCP', required: true },
      { key: 'acreditacao_inmetro', label: 'Acreditada INMETRO?', type: 'select', options: ['Sim','Não'], required: true },
      { key: 'acreditacao_mapa', label: 'Credenciada MAPA?', type: 'select', options: ['Sim','Não'] },
      { key: 'cod_autorizado', label: 'Emite Certificado de Origem (CO)?', type: 'select', options: ['Sim','Não'] },
      { key: 'prazo_emissao_dias', label: 'Prazo médio de emissão (dias úteis)', type: 'number', placeholder: 'Ex.: 5' },
      { key: 'fee_certificado_brl', label: 'Taxa por certificado (R$)', type: 'number', placeholder: 'Ex.: 800' },
    ],
  },
  laboratorio: {
    slug: 'laboratorio',
    label: 'Laboratório',
    labelPlural: 'Laboratórios',
    tagline: 'Análise de aflatoxina e laudos MAPA',
    description: 'Laboratórios credenciados pelo MAPA e/ou INMETRO para análise de aflatoxina e qualidade.',
    icon: 'Microscope',
    color: 'text-[#ab7d52]',
    bg: 'bg-[#ab7d52]/10',
    specificFields: [
      { key: 'mapa_accredited', label: 'Credenciado pelo MAPA?', type: 'select', options: ['Sim','Não'], required: true },
      { key: 'inmetro_accredited', label: 'Acreditado pelo INMETRO?', type: 'select', options: ['Sim','Não'], required: true },
      { key: 'id_mapa', label: 'Nº de credenciamento MAPA', type: 'text', placeholder: 'Ex.: LAB/RO/0042' },
      { key: 'analises', label: 'Tipos de análise oferecidas', type: 'text', placeholder: 'Ex.: Aflatoxina, Umidade, Pesticidas', required: true },
      { key: 'prazo_laudo_horas', label: 'Prazo de emissão do laudo (horas)', type: 'number', placeholder: 'Ex.: 48' },
      { key: 'fee_aflatoxina_brl', label: 'Taxa análise de aflatoxina (R$)', type: 'number', placeholder: 'Ex.: 350' },
    ],
  },
}

export const ENTITY_SLUGS = Object.keys(ENTITY_CONFIG) as EntitySlug[]

export function getEntityConfig(slug: string): EntityConfig | null {
  return ENTITY_CONFIG[slug as EntitySlug] ?? null
}
