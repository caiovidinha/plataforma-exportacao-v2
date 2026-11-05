import nodemailer from 'nodemailer'
import type { Config } from '../config'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: { filename: string; content: Buffer; contentType?: string }[]
}

export interface Mailer {
  send(message: MailMessage): Promise<void>
}

class ConsoleMailer implements Mailer {
  async send(m: MailMessage) {
    console.log(`\n[mail] to=${m.to} subject="${m.subject}"\n${m.text}\n`)
  }
}

/** Guarda as mensagens (testes). */
export class MemoryMailer implements Mailer {
  sent: MailMessage[] = []
  async send(m: MailMessage) {
    this.sent.push(m)
  }
  last(to?: string) {
    return [...this.sent].reverse().find((m) => !to || m.to === to)
  }
}

class SmtpMailer implements Mailer {
  private transport
  constructor(url: string, private from: string) {
    this.transport = nodemailer.createTransport(url)
  }
  async send(m: MailMessage) {
    await this.transport.sendMail({ from: this.from, ...m })
  }
}

export function createMailer(cfg: Pick<Config, 'MAIL_DRIVER' | 'SMTP_URL' | 'MAIL_FROM'>): Mailer {
  if (cfg.MAIL_DRIVER === 'smtp') {
    if (!cfg.SMTP_URL) throw new Error('SMTP_URL é obrigatório com MAIL_DRIVER=smtp')
    return new SmtpMailer(cfg.SMTP_URL, cfg.MAIL_FROM)
  }
  if (cfg.MAIL_DRIVER === 'memory') return new MemoryMailer()
  return new ConsoleMailer()
}
