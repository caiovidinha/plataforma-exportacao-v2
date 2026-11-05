import { L } from './i18n'
import type { IntegrationOperation, PartnerType, ShipmentStage } from './enums'

export type TaskActor = 'PLATFORM' | 'EXPORTER' | 'IMPORTER' | 'PARTNER'

export interface TaskDef {
  key: string
  title: L
  actor: TaskActor
  /** Parceiro responsável (quando actor = PARTNER). */
  partner?: PartnerType
  /** Operação disparada ao parceiro quando o estágio começa. */
  operation?: IntegrationOperation
  /** Precisa estar DONE para o estágio avançar. */
  required: boolean
  /** Concluída automaticamente pela plataforma ao entrar no estágio. */
  auto?: boolean
}

export interface StageDef {
  stage: ShipmentStage
  /** Posição no fluxo principal (ramos excepcionais não têm). */
  order: number | null
  title: L
  description: L
  tasks: TaskDef[]
}

/**
 * Estágios do embarque (fluxo do documento "Etapas da plataforma").
 * NEGÓCIO → MERCADORIA PRONTA → NO PORTO → LIBERADA → PAGAMENTO
 * + ramos excepcionais NÃO PAGAMENTO e MERCADORIA RECUSADA.
 */
export const STAGE_DEFS: StageDef[] = [
  {
    stage: 'NEGOCIO',
    order: 1,
    title: L('Negócio', 'Deal'),
    description: L(
      'Contratos aceitos e serviços contratados com os parceiros (seguro, câmbio, despachante, frete marítimo e terrestre).',
      'Contracts accepted and services booked with partners (insurance, FX, customs, sea and land freight).',
    ),
    tasks: [
      { key: 'CONTRACTS_ACCEPTED', title: L('Contratos aceitos pelas partes', 'Contracts accepted by both parties'), actor: 'PLATFORM', required: true, auto: true },
      { key: 'INSURANCE_ISSUED', title: L('Seguro emitido', 'Insurance issued'), actor: 'PARTNER', partner: 'SEGURO', operation: 'REQUEST_INSURANCE', required: true },
      { key: 'FX_CONTRACT_OPENED', title: L('Operação de câmbio aberta', 'FX operation opened'), actor: 'PARTNER', partner: 'CAMBIO', operation: 'REQUEST_FX_CONTRACT', required: true },
      { key: 'CUSTOMS_PROCESS_OPENED', title: L('Processo de despacho aberto', 'Customs process opened'), actor: 'PARTNER', partner: 'DESPACHANTE', operation: 'CREATE_CUSTOMS_PROCESS', required: true },
      { key: 'MARITIME_BOOKING_CONFIRMED', title: L('Booking marítimo confirmado', 'Ocean booking confirmed'), actor: 'PARTNER', partner: 'TRANSPORTE_MARITIMO', operation: 'CREATE_BOOKING', required: true },
      { key: 'LAND_TRANSPORT_SCHEDULED', title: L('Transporte terrestre agendado', 'Land transport scheduled'), actor: 'PARTNER', partner: 'TRANSPORTE_TERRESTRE', operation: 'REQUEST_LAND_TRANSPORT', required: true },
    ],
  },
  {
    stage: 'MERCADORIA_PRONTA',
    order: 2,
    title: L('Mercadoria pronta', 'Cargo ready'),
    description: L(
      'Nota fiscal emitida, coleta e entrega no porto, preparação de documentos e conferência da carga antes do lacre.',
      'Invoice issued, pickup and delivery at port, document preparation and cargo check before sealing.',
    ),
    tasks: [
      { key: 'INVOICE_ISSUED', title: L('Nota fiscal emitida', 'Invoice issued'), actor: 'EXPORTER', required: true },
      { key: 'CARGO_PICKED_UP', title: L('Carga coletada', 'Cargo picked up'), actor: 'PARTNER', partner: 'TRANSPORTE_TERRESTRE', required: true },
      { key: 'CARGO_DELIVERED_TO_PORT', title: L('Carga entregue no porto/terminal', 'Cargo delivered to port/terminal'), actor: 'PARTNER', partner: 'TRANSPORTE_TERRESTRE', required: true },
      { key: 'EXPORT_DOCS_PREPARED', title: L('Documentos de exportação preparados', 'Export documents prepared'), actor: 'PARTNER', partner: 'DESPACHANTE', required: true },
      { key: 'PRE_SEAL_INSPECTION', title: L('Conferência da carga antes do lacre', 'Pre-seal cargo inspection'), actor: 'PARTNER', partner: 'DESPACHANTE', required: true },
    ],
  },
  {
    stage: 'MERCADORIA_PORTO',
    order: 3,
    title: L('Mercadoria no porto', 'Cargo at port'),
    description: L(
      'Fiscalização do MAPA, coleta de amostra, teste de aflatoxina, certificados e registro da DU-E.',
      'MAPA inspection, sampling, aflatoxin test, certificates and export declaration (DU-E).',
    ),
    tasks: [
      { key: 'MAPA_INSPECTION', title: L('Fiscalização MAPA solicitada/realizada', 'MAPA inspection requested/performed'), actor: 'PARTNER', partner: 'DESPACHANTE', required: true },
      { key: 'AFLATOXIN_LAB_REPORT', title: L('Laudo de aflatoxina aprovado', 'Aflatoxin lab report approved'), actor: 'PARTNER', partner: 'DESPACHANTE', required: true },
      { key: 'PHYTOSANITARY_CERTIFICATE', title: L('Certificado fitossanitário emitido', 'Phytosanitary certificate issued'), actor: 'PARTNER', partner: 'DESPACHANTE', required: true },
      { key: 'EXPORT_DECLARATION_REGISTERED', title: L('DU-E registrada e desembaraçada', 'DU-E registered and cleared'), actor: 'PARTNER', partner: 'DESPACHANTE', required: true },
      { key: 'VESSEL_SPACE_CONFIRMED', title: L('Espaço no navio confirmado', 'Vessel space confirmed'), actor: 'PARTNER', partner: 'TRANSPORTE_MARITIMO', required: true },
    ],
  },
  {
    stage: 'MERCADORIA_LIBERADA',
    order: 4,
    title: L('Mercadoria liberada', 'Cargo released'),
    description: L(
      'Carga embarcada, BL emitido, contrato de câmbio fechado e pagamento liberado.',
      'Cargo loaded, BL issued, FX contract closed and payment released.',
    ),
    tasks: [
      { key: 'CARGO_LOADED', title: L('Carga embarcada no navio', 'Cargo loaded on vessel'), actor: 'PARTNER', partner: 'TRANSPORTE_MARITIMO', required: true },
      { key: 'BL_ISSUED', title: L('BL emitido', 'BL issued'), actor: 'PARTNER', partner: 'TRANSPORTE_MARITIMO', required: true },
      { key: 'FX_CONTRACT_SIGNED', title: L('Contrato de câmbio fechado', 'FX contract closed'), actor: 'PARTNER', partner: 'CAMBIO', required: true },
      { key: 'PAYMENT_RELEASE_AUTHORIZED', title: L('Liberação do pagamento autorizada', 'Payment release authorised'), actor: 'PARTNER', partner: 'CAMBIO', required: true },
    ],
  },
  {
    stage: 'PAGAMENTO',
    order: 5,
    title: L('Pagamento', 'Payment'),
    description: L('Recebimento confirmado e liquidação do câmbio.', 'Receipt confirmed and FX settlement.'),
    tasks: [
      { key: 'PAYMENT_RECEIVED', title: L('Pagamento recebido pelo exportador', 'Payment received by exporter'), actor: 'PARTNER', partner: 'CAMBIO', required: true },
      { key: 'SHIPMENT_CLOSED', title: L('Embarque encerrado', 'Shipment closed'), actor: 'PLATFORM', required: true, auto: true },
    ],
  },
  {
    stage: 'NAO_PAGAMENTO',
    order: null,
    title: L('Não pagamento', 'Non-payment'),
    description: L('Quebra de contrato por falta de pagamento; acionamento do seguro.', 'Contract breach due to non-payment; insurance claim.'),
    tasks: [
      { key: 'INSURANCE_CLAIM_OPENED', title: L('Sinistro aberto na seguradora', 'Insurance claim opened'), actor: 'PARTNER', partner: 'SEGURO', operation: 'REQUEST_INSURANCE', required: true },
      { key: 'LEGAL_REVIEW', title: L('Análise jurídica', 'Legal review'), actor: 'PLATFORM', required: true },
    ],
  },
  {
    stage: 'MERCADORIA_RECUSADA',
    order: null,
    title: L('Mercadoria recusada', 'Cargo rejected'),
    description: L('Mercadoria recusada no destino; quebra de contrato e cobertura de seguro.', 'Cargo rejected at destination; contract breach and insurance coverage.'),
    tasks: [
      { key: 'INSURANCE_CLAIM_OPENED', title: L('Sinistro aberto na seguradora', 'Insurance claim opened'), actor: 'PARTNER', partner: 'SEGURO', operation: 'REQUEST_INSURANCE', required: true },
      { key: 'LEGAL_REVIEW', title: L('Análise jurídica', 'Legal review'), actor: 'PLATFORM', required: true },
    ],
  },
]

export const MAIN_FLOW: ShipmentStage[] = STAGE_DEFS.filter((s) => s.order !== null)
  .sort((a, b) => a.order! - b.order!)
  .map((s) => s.stage)

export const getStageDef = (stage: ShipmentStage): StageDef => STAGE_DEFS.find((s) => s.stage === stage)!

export const nextMainStage = (stage: ShipmentStage): ShipmentStage | null => {
  const i = MAIN_FLOW.indexOf(stage)
  return i >= 0 && i < MAIN_FLOW.length - 1 ? MAIN_FLOW[i + 1]! : null
}

/** Todas as tarefas únicas por chave (para mapeamento de status de parceiros). */
export const ALL_TASK_KEYS: string[] = [...new Set(STAGE_DEFS.flatMap((s) => s.tasks.map((t) => t.key)))]
