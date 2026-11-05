import { z } from 'zod'

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  /** URL pública da API (links de portal-lite, downloads assinados). */
  PUBLIC_API_URL: z.string().default('http://localhost:3000/api'),
  DB_DRIVER: z.enum(['pg', 'pglite']).default('pglite'),
  DATABASE_URL: z.string().optional(),
  PGLITE_DATA_DIR: z.string().default('./.data/pglite'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter ao menos 32 caracteres'),
  SECRETS_MASTER_KEY: z.string().refine((v) => Buffer.from(v, 'base64').length === 32, 'SECRETS_MASTER_KEY deve ser 32 bytes em base64'),
  STORAGE_DRIVER: z.enum(['local']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  MAIL_DRIVER: z.enum(['console', 'smtp', 'memory']).default('console'),
  MAIL_FROM: z.string().default('Amazon Trade <no-reply@amazontrade.local>'),
  SMTP_URL: z.string().optional(),
  PRICING_DEFAULT_MODE: z.enum(['TABLE', 'PARTNER_API']).default('TABLE'),
  INTEGRATION_WORKER_ENABLED: bool.default(true),
  INTEGRATION_WORKER_INTERVAL_MS: z.coerce.number().int().min(100).default(3000),
  COOKIE_SECURE: bool.optional(),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().default(15 * 60),
  REFRESH_TOKEN_TTL_SEC: z.coerce.number().int().default(30 * 24 * 3600),
  LOG_LEVEL: z.string().default('info'),
})

export type Config = Omit<z.infer<typeof envSchema>, 'COOKIE_SECURE'> & { COOKIE_SECURE: boolean }

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ')
    throw new Error(`Configuração inválida:\n  ${msg}`)
  }
  const cfg = parsed.data
  if (cfg.DB_DRIVER === 'pg' && !cfg.DATABASE_URL) throw new Error('DATABASE_URL é obrigatório com DB_DRIVER=pg')
  return { ...cfg, COOKIE_SECURE: cfg.COOKIE_SECURE ?? cfg.NODE_ENV === 'production' }
}
