import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildGuide } from './content'
import { toDocx } from './docx'
import { toMarkdown } from './markdown'

/** Gera `docs/parceiros/guia-integracao-parceiros.{md,docx}` a partir de uma única fonte estruturada. */
const outDir = path.resolve(import.meta.dirname, '../../../docs/parceiros')
mkdirSync(outDir, { recursive: true })

const blocks = buildGuide()
const md = path.join(outDir, 'guia-integracao-parceiros.md')
const docx = path.join(outDir, 'guia-integracao-parceiros.docx')
writeFileSync(md, toMarkdown(blocks), 'utf8')
writeFileSync(docx, await toDocx(blocks, { title: 'Guia de integração com parceiros — Amazon Trade', subtitle: 'Checklist e roteiro para o contato com parceiros' }))
console.log(`[docs] ${md}\n[docs] ${docx}`)
