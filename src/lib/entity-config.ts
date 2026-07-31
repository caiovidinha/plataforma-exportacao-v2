// Central configuration for the 2 registrable account types.
// Used by the "O que você é?" selector and the multi-step registration form.
// Os 8 parceiros logísticos/jurídicos/financeiros são fixos do backend
// (ver src/lib/partners.ts) e nunca se cadastram na plataforma.

export type EntitySlug = 'exportador' | 'importador'

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
const INCOTERM_OPTIONS = ['FOB','CIF','CFR','EXW','DDP','DAP','CPT','FCA']
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
}

export const ENTITY_SLUGS = Object.keys(ENTITY_CONFIG) as EntitySlug[]

export function getEntityConfig(slug: string): EntityConfig | null {
  return ENTITY_CONFIG[slug as EntitySlug] ?? null
}
