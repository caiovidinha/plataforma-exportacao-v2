// Parceiros fixos do backend da plataforma.
// Diferente de entity-config.ts, isto NÃO é um cadastro: são os 8 papéis
// contratados diretamente pela plataforma (jurídico, seguradora, câmbio,
// navegação, despachante, logística, certificadora, laboratório). Eles
// nunca criam conta nem aparecem como resultado de busca - só são
// exibidos como badges "quem está atuando" nas etapas do workflow.

import type { Partner, PartnerType } from '@/types'

export const PARTNERS: Record<PartnerType, Partner> = {
  JURIDICO: {
    type: 'JURIDICO',
    name: 'Jurídico',
    description: 'Estrutura e valida os contratos de exportação, seguro, frete e câmbio.',
    icon: 'Scale',
  },
  SEGURADORA: {
    type: 'SEGURADORA',
    name: 'Seguradora',
    description: 'Cobertura de carga, safra e crédito - cobre quebras de contrato e recusa de mercadoria.',
    icon: 'ShieldCheck',
  },
  CORRETORA_CAMBIO: {
    type: 'CORRETORA_CAMBIO',
    name: 'Corretora de Câmbio',
    description: 'Fecha o contrato de câmbio e libera o pagamento ao exportador.',
    icon: 'DollarSign',
  },
  CIA_NAVEGACAO: {
    type: 'CIA_NAVEGACAO',
    name: 'Cia de Navegação',
    description: 'Reserva o espaço no navio, embarca a carga e emite o BL.',
    icon: 'Ship',
  },
  DESPACHANTE: {
    type: 'DESPACHANTE',
    name: 'Despachante Aduaneiro',
    description: 'Emite documentos, solicita fiscalização do MAPA e libera a mercadoria no porto.',
    icon: 'FileCheck',
  },
  LOGISTICA: {
    type: 'LOGISTICA',
    name: 'Logística',
    description: 'Coleta a mercadoria e entrega no porto de origem.',
    icon: 'Truck',
  },
  CERTIFICADORA: {
    type: 'CERTIFICADORA',
    name: 'Certificadora',
    description: 'Verifica e certifica a mercadoria antes do embarque.',
    icon: 'BadgeCheck',
  },
  LABORATORIO: {
    type: 'LABORATORIO',
    name: 'Laboratório',
    description: 'Realiza o teste de aflatoxina e demais laudos de qualidade.',
    icon: 'Microscope',
  },
}

export const PARTNER_TYPES = Object.keys(PARTNERS) as PartnerType[]

export function getPartner(type: PartnerType): Partner {
  return PARTNERS[type]
}
