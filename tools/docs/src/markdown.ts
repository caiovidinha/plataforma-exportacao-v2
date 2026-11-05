import type { Block } from './blocks'

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, '<br>')

export function toMarkdown(blocks: Block[]): string {
  const out: string[] = []
  for (const b of blocks) {
    switch (b.kind) {
      case 'title':
        out.push(`# ${b.text}`, b.subtitle ? `_${b.subtitle}_` : '')
        break
      case 'h1':
        out.push(`## ${b.text}`)
        break
      case 'h2':
        out.push(`### ${b.text}`)
        break
      case 'h3':
        out.push(`#### ${b.text}`)
        break
      case 'p':
        out.push(b.text)
        break
      case 'ul':
        out.push(b.items.map((i) => `- ${i}`).join('\n'))
        break
      case 'ol':
        out.push(b.items.map((i, n) => `${n + 1}. ${i}`).join('\n'))
        break
      case 'checklist':
        out.push(b.items.map((i) => `- [ ] ${i}`).join('\n'))
        break
      case 'table':
        out.push([`| ${b.head.map(esc).join(' | ')} |`, `| ${b.head.map(() => '---').join(' | ')} |`, ...b.rows.map((r) => `| ${r.map(esc).join(' | ')} |`)].join('\n'))
        break
      case 'callout':
        out.push(`> **${b.title ?? (b.tone === 'warn' ? 'Atenção' : 'Nota')}** — ${b.text.replace(/\n/g, '\n> ')}`)
        break
      case 'code':
        out.push('```' + (b.lang ?? ''), b.text, '```')
        break
      case 'pagebreak':
        out.push('---')
        break
    }
  }
  return out.filter((x) => x !== undefined).join('\n\n') + '\n'
}
