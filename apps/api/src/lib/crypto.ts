import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2'

export const sha256Hex = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')

/** Token aleatório opaco (base64url). */
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')

export const hmacSha256Hex = (secret: string, data: string | Buffer) =>
  createHmac('sha256', secret).update(data).digest('hex')

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// ---- senhas (argon2id) ----
export const hashPassword = (password: string) =>
  argonHash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
export const verifyPassword = (hash: string, password: string) => argonVerify(hash, password).catch(() => false)

// ---- segredos de integração (AES-256-GCM) ----
export function encryptJson(masterKeyB64: string, value: unknown): string {
  const key = Buffer.from(masterKeyB64, 'base64')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join('.')
}

export function decryptJson<T = Record<string, string>>(masterKeyB64: string, payload: string): T {
  const [version, iv, tag, data] = payload.split('.')
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('invalid_secret_payload')
  const key = Buffer.from(masterKeyB64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  const dec = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()])
  return JSON.parse(dec.toString('utf8')) as T
}

/** Mascara valores sensíveis antes de gravar logs de integração. */
const SENSITIVE_KEYS = /(authorization|api[-_]?key|secret|token|password|senha|cpf|cnpj|passport|iban|swift|account|agency|conta|agencia)/i
export function redact<T>(value: T, depth = 0): T {
  if (depth > 6 || value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1)) as unknown as T
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.test(k) && typeof v === 'string' ? maskString(v) : redact(v, depth + 1)
    }
    return out as T
  }
  return value
}
const maskString = (s: string) => (s.length <= 4 ? '****' : `${s.slice(0, 2)}***${s.slice(-2)}`)
