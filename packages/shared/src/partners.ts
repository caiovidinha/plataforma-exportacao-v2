import { L } from './i18n'
import type { IntegrationMode, IntegrationOperation, PartnerType, PricingService } from './enums'

export type IntegrationLevel = 'API' | 'NOTIFY' | 'TO_BE_DEFINED'

export interface PartnerMeta {
  type: PartnerType
  label: L
  /** Papel no fluxo. */
  role: L
  /** Como pretendemos integrar (do diagrama/briefing). */
  level: IntegrationLevel
  /** Modo padrão sugerido ao cadastrar o parceiro. */
  defaultMode: IntegrationMode
  /** Operações que a plataforma pode pedir. */
  operations: IntegrationOperation[]
  /** Serviço de precificação que este parceiro alimenta. */
  pricingService?: PricingService
  /** Está no diagrama (core) ou é fase 2. */
  core: boolean
}

export const PARTNER_META: Record<PartnerType, PartnerMeta> = {
  DESPACHANTE: {
    type: 'DESPACHANTE',
    label: L('Despachante aduaneiro', 'Customs broker'),
    role: L(
      'Abre o processo de despacho, registra a DU-E no Siscomex, solicita fiscalização do MAPA e certificados, acompanha liberação.',
      'Opens the customs process, registers the DU-E in Siscomex, requests MAPA inspection and certificates, tracks clearance.',
    ),
    level: 'API',
    defaultMode: 'API',
    operations: ['QUOTE', 'CREATE_CUSTOMS_PROCESS', 'SYNC_STATUS', 'SEND_DOCUMENT', 'CANCEL'],
    pricingService: 'CUSTOMS_BROKER',
    core: true,
  },
  TRANSPORTE_MARITIMO: {
    type: 'TRANSPORTE_MARITIMO',
    label: L('Transportadora marítima', 'Ocean carrier'),
    role: L(
      'Booking, confirmação de espaço, embarque, emissão do BL e rastreio do navio/contêiner até o destino.',
      'Booking, space confirmation, loading, BL issuance and vessel/container tracking to destination.',
    ),
    level: 'API',
    defaultMode: 'API',
    operations: ['QUOTE', 'CREATE_BOOKING', 'SYNC_STATUS', 'SEND_DOCUMENT', 'CANCEL'],
    pricingService: 'FREIGHT_MARITIME',
    core: true,
  },
  TRANSPORTE_TERRESTRE: {
    type: 'TRANSPORTE_TERRESTRE',
    label: L('Transportadora terrestre', 'Land carrier'),
    role: L(
      'Coleta a carga no exportador e entrega no porto/terminal de embarque.',
      'Picks up the cargo at the exporter and delivers it to the loading port/terminal.',
    ),
    level: 'TO_BE_DEFINED',
    defaultMode: 'EMAIL',
    operations: ['QUOTE', 'REQUEST_LAND_TRANSPORT', 'SYNC_STATUS', 'CANCEL'],
    pricingService: 'FREIGHT_LAND',
    core: true,
  },
  CAMBIO: {
    type: 'CAMBIO',
    label: L('Câmbio', 'Foreign exchange'),
    role: L(
      'Contrato de câmbio, recebimento do pagamento do importador e liberação ao exportador.',
      'FX contract, receiving the importer payment and releasing proceeds to the exporter.',
    ),
    level: 'TO_BE_DEFINED',
    defaultMode: 'EMAIL',
    operations: ['QUOTE', 'REQUEST_FX_CONTRACT', 'SYNC_STATUS', 'SEND_DOCUMENT', 'CANCEL'],
    pricingService: 'FX',
    core: true,
  },
  SEGURO: {
    type: 'SEGURO',
    label: L('Seguro', 'Insurance'),
    role: L(
      'Cotação e emissão do seguro da mercadoria (e, futuramente, de crédito/pagamento e safra).',
      'Quote and issuance of cargo insurance (and later credit/payment and crop insurance).',
    ),
    level: 'NOTIFY',
    defaultMode: 'EMAIL',
    operations: ['QUOTE', 'REQUEST_INSURANCE', 'SEND_DOCUMENT'],
    pricingService: 'INSURANCE',
    core: true,
  },
  LABORATORIO: {
    type: 'LABORATORIO',
    label: L('Laboratório credenciado', 'Accredited laboratory'),
    role: L('Análise de aflatoxina e laudos (fase 2).', 'Aflatoxin analysis and reports (phase 2).'),
    level: 'TO_BE_DEFINED',
    defaultMode: 'MANUAL',
    operations: ['SEND_DOCUMENT'],
    core: false,
  },
  CERTIFICADORA: {
    type: 'CERTIFICADORA',
    label: L('Certificadora', 'Certifier'),
    role: L('Certificados de origem/orgânicos e auditoria (fase 2).', 'Origin/organic certificates and audit (phase 2).'),
    level: 'TO_BE_DEFINED',
    defaultMode: 'MANUAL',
    operations: ['SEND_DOCUMENT'],
    core: false,
  },
  TERMINAL: {
    type: 'TERMINAL',
    label: L('Terminal alfandegário', 'Bonded terminal'),
    role: L('Armazenagem e ovação do contêiner (fase 2).', 'Storage and container stuffing (phase 2).'),
    level: 'TO_BE_DEFINED',
    defaultMode: 'MANUAL',
    operations: ['SEND_DOCUMENT'],
    core: false,
  },
}

export const partnerLabel = (type: PartnerType, locale: 'pt' | 'en' | 'es' = 'pt') => PARTNER_META[type].label[locale] ?? PARTNER_META[type].label.en

// ---------------------------------------------------------------- espanhol
const ES_PARTNER: Record<PartnerType, { label: string; role: string }> = {
  DESPACHANTE: { label: 'Agente de aduanas', role: 'Abre el proceso de despacho, registra la DU-E en Siscomex, solicita inspección del MAPA y certificados, y sigue la liberación.' },
  TRANSPORTE_MARITIMO: { label: 'Transporte marítimo', role: 'Booking, confirmación de espacio, embarque, emisión del BL y seguimiento del buque/contenedor hasta el destino.' },
  TRANSPORTE_TERRESTRE: { label: 'Transporte terrestre', role: 'Recoge la carga en el exportador y la entrega en el puerto/terminal de embarque.' },
  CAMBIO: { label: 'Cambio', role: 'Contrato de cambio, recepción del pago del importador y liberación al exportador.' },
  SEGURO: { label: 'Seguro', role: 'Cotización y emisión del seguro de la mercancía (y, a futuro, de crédito/pago y cosecha).' },
  LABORATORIO: { label: 'Laboratorio acreditado', role: 'Análisis de aflatoxina e informes (fase 2).' },
  CERTIFICADORA: { label: 'Certificadora', role: 'Certificados de origen/orgánicos y auditoría (fase 2).' },
  TERMINAL: { label: 'Terminal aduanero', role: 'Almacenaje y estiba del contenedor (fase 2).' },
}
for (const [k, v] of Object.entries(ES_PARTNER) as [PartnerType, { label: string; role: string }][]) {
  PARTNER_META[k].label.es = v.label
  PARTNER_META[k].role.es = v.role
}
