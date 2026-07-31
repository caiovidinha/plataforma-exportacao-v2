// Ações contextuais que o exportador pode tomar em cada etapa do workflow.
// É um mapa de dados (não funções) para o WorkflowTimeline interpretar e
// disparar as actions certas do mock-store - mantém a lógica de UI e a
// lógica de mutação de estado desacopladas.
import type { DocumentType, PartnerActivityStatus, PartnerType, WorkflowStage } from '@/types'

interface BaseAction {
  id: string
  label: string
  icon: 'FileText' | 'Truck' | 'FileCheck' | 'Microscope' | 'Ship' | 'DollarSign'
  partner: PartnerType
}

export interface EmitDocumentAction extends BaseAction {
  kind: 'emit_document'
  docType: DocumentType
  docName: string
  activityMessage: string
}

export interface LogActivityAction extends BaseAction {
  kind: 'log_activity'
  message: string
  status?: PartnerActivityStatus
}

export type WorkflowAction = EmitDocumentAction | LogActivityAction

export const STAGE_ACTIONS: Partial<Record<WorkflowStage, WorkflowAction[]>> = {
  MERCADORIA_PRONTA: [
    {
      id: 'emit_nf',
      label: 'Emitir Nota Fiscal',
      icon: 'FileText',
      partner: 'DESPACHANTE',
      kind: 'emit_document',
      docType: 'NF',
      docName: 'Nota Fiscal',
      activityMessage: 'Nota fiscal emitida pelo exportador.',
    },
    {
      id: 'confirm_pickup',
      label: 'Confirmar coleta pela logística',
      icon: 'Truck',
      partner: 'LOGISTICA',
      kind: 'log_activity',
      message: 'Coleta da mercadoria confirmada - carga a caminho do porto de origem.',
      status: 'CONCLUIDO',
    },
  ],
  MERCADORIA_PORTO: [
    {
      id: 'request_mapa',
      label: 'Solicitar fiscalização MAPA',
      icon: 'FileCheck',
      partner: 'DESPACHANTE',
      kind: 'log_activity',
      message: 'Fiscalização do MAPA solicitada junto ao despachante aduaneiro.',
      status: 'ACAO_NECESSARIA',
    },
    {
      id: 'lab_result',
      label: 'Registrar laudo do laboratório',
      icon: 'Microscope',
      partner: 'LABORATORIO',
      kind: 'emit_document',
      docType: 'LAUDO_LAB',
      docName: 'Laudo Laboratorial - Aflatoxina',
      activityMessage: 'Laudo laboratorial de aflatoxina emitido e aprovado.',
    },
  ],
  MERCADORIA_LIBERADA: [
    {
      id: 'register_bl',
      label: 'Registrar embarque (BL)',
      icon: 'Ship',
      partner: 'CIA_NAVEGACAO',
      kind: 'emit_document',
      docType: 'BL',
      docName: 'Bill of Lading',
      activityMessage: 'Mercadoria embarcada - Bill of Lading emitido pela cia de navegação.',
    },
    {
      id: 'release_exchange',
      label: 'Autorizar liberação de câmbio',
      icon: 'DollarSign',
      partner: 'CORRETORA_CAMBIO',
      kind: 'log_activity',
      message: 'Liberação do contrato de câmbio autorizada junto à corretora.',
      status: 'CONCLUIDO',
    },
  ],
  PAGAMENTO: [
    {
      id: 'register_swift',
      label: 'Registrar comprovante SWIFT',
      icon: 'DollarSign',
      partner: 'CORRETORA_CAMBIO',
      kind: 'emit_document',
      docType: 'SWIFT',
      docName: 'Comprovante SWIFT',
      activityMessage: 'Pagamento recebido via SWIFT e liquidado pela corretora de câmbio.',
    },
  ],
}
