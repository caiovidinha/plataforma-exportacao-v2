import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, pattern = 'dd/MM/yyyy') {
  try {
    return format(parseISO(dateStr), pattern, { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateRelative(dateStr: string) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { locale: ptBR, addSuffix: true })
  } catch {
    return dateStr
  }
}

export function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function incotermLabel(incoterm: 'FOB' | 'CIF') {
  const map = {
    FOB: 'FOB — Free On Board',
    CIF: 'CIF — Cost, Insurance & Freight',
  }
  return map[incoterm]
}

export const stepStatusColors = {
  PENDENTE: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  EM_ANDAMENTO: 'text-brand-400 bg-brand-400/10 border-brand-400/30',
  CONCLUIDO: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  ATRASADO: 'text-red-400 bg-red-400/10 border-red-400/30',
  BLOQUEADO: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
} as const

export const stepStatusLabel = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  ATRASADO: 'Atrasado',
  BLOQUEADO: 'Bloqueado',
} as const

export const documentTypeLabel: Record<string, string> = {
  NF: 'Nota Fiscal',
  INVOICE: 'Invoice',
  PACKING_LIST: 'Packing List',
  CERT_ORIGEM: 'Certificado de Origem',
  CERT_FITOSSANITARIO: 'Certificado Fitossanitário',
  CERT_HIGIENICO: 'Cert. Higiênico-Sanitário',
  BL: 'Bill of Lading (BL)',
  DUE: 'DU-E (Declaração de Exportação)',
  LAUDO_LAB: 'Laudo Laboratorial',
  SWIFT: 'SWIFT (Comprovante de Pagamento)',
  OUTROS: 'Outro Documento',
}
