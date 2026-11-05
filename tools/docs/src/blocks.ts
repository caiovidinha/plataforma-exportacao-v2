/** Fonte estruturada única do guia: o mesmo conteúdo vira Markdown e .docx. */
export type Block =
  | { kind: 'title'; text: string; subtitle?: string }
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'checklist'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][]; widths?: number[] }
  | { kind: 'callout'; tone: 'info' | 'warn'; title?: string; text: string }
  | { kind: 'code'; lang?: string; text: string }
  | { kind: 'pagebreak' }

export const h1 = (text: string): Block => ({ kind: 'h1', text })
export const h2 = (text: string): Block => ({ kind: 'h2', text })
export const h3 = (text: string): Block => ({ kind: 'h3', text })
export const p = (text: string): Block => ({ kind: 'p', text })
export const ul = (items: string[]): Block => ({ kind: 'ul', items })
export const ol = (items: string[]): Block => ({ kind: 'ol', items })
export const checklist = (items: string[]): Block => ({ kind: 'checklist', items })
export const table = (head: string[], rows: string[][], widths?: number[]): Block => ({ kind: 'table', head, rows, widths })
export const callout = (text: string, tone: 'info' | 'warn' = 'info', title?: string): Block => ({ kind: 'callout', tone, title, text })
export const code = (text: string, lang = 'json'): Block => ({ kind: 'code', lang, text })
export const pagebreak = (): Block => ({ kind: 'pagebreak' })
