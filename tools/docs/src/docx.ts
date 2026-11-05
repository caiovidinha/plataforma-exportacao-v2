import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableOfContents,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { Block } from './blocks'

const GREEN = '1B6145'
const FONT = 'Calibri'

/** **negrito** e `código` inline → runs. */
function runs(text: string, base: { size?: number; color?: string; bold?: boolean } = {}): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part) => {
    if (part.startsWith('**')) return new TextRun({ text: part.slice(2, -2), bold: true, font: FONT, ...base })
    if (part.startsWith('`')) return new TextRun({ text: part.slice(1, -1), font: 'Consolas', size: (base.size ?? 22) - 2, shading: { type: ShadingType.CLEAR, fill: 'EEF2F0' }, color: base.color })
    return new TextRun({ text: part, font: FONT, ...base })
  })
}

const border = { style: BorderStyle.SINGLE, size: 4, color: 'D0D5DA' }
const cellBorders = { top: border, bottom: border, left: border, right: border }

export async function toDocx(blocks: Block[], meta: { title: string; subtitle?: string }): Promise<Buffer> {
  const children: (Paragraph | Table | TableOfContents)[] = []

  for (const b of blocks) {
    switch (b.kind) {
      case 'title':
        children.push(
          new Paragraph({ spacing: { before: 1800, after: 200 }, children: [new TextRun({ text: b.text, bold: true, size: 56, color: GREEN, font: FONT })] }),
          new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: b.subtitle ?? '', size: 26, color: '6B7480', font: FONT })] }),
          new Paragraph({ spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'Sumário', bold: true, size: 28, color: GREEN, font: FONT })] }),
          new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-2' }),
          new Paragraph({ pageBreakBefore: true, children: [] }),
        )
        break
      case 'h1':
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: b.text, bold: true, size: 36, color: GREEN, font: FONT })] }))
        break
      case 'h2':
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text: b.text, bold: true, size: 28, color: '14181D', font: FONT })] }))
        break
      case 'h3':
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: b.text, bold: true, size: 24, color: '353D46', font: FONT })] }))
        break
      case 'p':
        children.push(new Paragraph({ spacing: { after: 120, line: 288 }, children: runs(b.text, { size: 22 }) }))
        break
      case 'ul':
        for (const i of b.items) children.push(new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: runs(i, { size: 22 }) }))
        break
      case 'ol':
        for (const i of b.items) children.push(new Paragraph({ numbering: { reference: 'numbers', level: 0 }, spacing: { after: 60 }, children: runs(i, { size: 22 }) }))
        break
      case 'checklist':
        for (const i of b.items) children.push(new Paragraph({ indent: { left: 360, hanging: 360 }, spacing: { after: 60 }, children: [new TextRun({ text: '☐  ', font: 'Segoe UI Symbol', size: 22 }), ...runs(i, { size: 22 })] }))
        break
      case 'callout': {
        const fill = b.tone === 'warn' ? 'FFF7E0' : 'EEF7F2'
        const bar = b.tone === 'warn' ? 'E0A800' : GREEN
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 140 },
            shading: { type: ShadingType.CLEAR, fill },
            border: { left: { style: BorderStyle.SINGLE, size: 24, color: bar, space: 8 } },
            indent: { left: 160 },
            children: [new TextRun({ text: `${b.title ?? (b.tone === 'warn' ? 'Atenção' : 'Nota')}: `, bold: true, font: FONT, size: 21 }), ...runs(b.text, { size: 21 })],
          }),
        )
        break
      }
      case 'code':
        for (const line of b.text.split('\n')) {
          children.push(new Paragraph({ spacing: { after: 0 }, shading: { type: ShadingType.CLEAR, fill: 'F1F3F5' }, children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 18 })] }))
        }
        children.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
        break
      case 'table': {
        const total = 9360 // largura útil (US Letter, margens de 1")
        const w = b.widths ?? b.head.map(() => 1)
        const sum = w.reduce((a, x) => a + x, 0)
        const cols = w.map((x) => Math.round((x / sum) * total))
        children.push(
          new Table({
            width: { size: total, type: WidthType.DXA },
            columnWidths: cols,
            rows: [
              new TableRow({
                tableHeader: true,
                children: b.head.map((h, i) => new TableCell({ width: { size: cols[i]!, type: WidthType.DXA }, borders: cellBorders, shading: { type: ShadingType.CLEAR, fill: GREEN }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20, font: FONT })] })] })),
              }),
              ...b.rows.map(
                (r, ri) =>
                  new TableRow({
                    children: r.map((c, i) => new TableCell({ width: { size: cols[i]!, type: WidthType.DXA }, borders: cellBorders, shading: ri % 2 ? { type: ShadingType.CLEAR, fill: 'F8F9FA' } : undefined, margins: { top: 50, bottom: 50, left: 100, right: 100 }, children: c.split('\n').map((line) => new Paragraph({ children: runs(line, { size: 19 }) })) })),
                  }),
              ),
            ],
          }),
          new Paragraph({ spacing: { after: 160 }, children: [] }),
        )
        break
      }
      case 'pagebreak':
        children.push(new Paragraph({ pageBreakBefore: true, children: [] }))
        break
    }
  }

  const doc = new Document({
    creator: 'Amazon Trade',
    title: meta.title,
    description: meta.subtitle,
    features: { updateFields: true },
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    numbering: {
      config: [
        { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Amazon Trade — Guia de integração com parceiros · página ', size: 16, color: '9AA3AC', font: FONT }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '9AA3AC', font: FONT })] })] }) },
        children,
      },
    ],
  })
  return Packer.toBuffer(doc)
}
