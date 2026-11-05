import { buildApp } from '../app'
import { createContext } from '../bootstrap'
import { MemoryMailer } from '../lib/mail'
import { MemoryStorage } from '../lib/storage'
import { registerModules } from '../modules'

export async function makeTestApp(opts: { now?: () => Date } = {}) {
  const mailer = new MemoryMailer()
  const storage = new MemoryStorage()
  const ctx = await createContext({}, { mailer, storage, ...(opts.now ? { now: opts.now } : {}) })
  const app = await buildApp(ctx, { rateLimit: false, logger: false, extraRoutes: registerModules })
  await app.ready()
  return {
    app,
    ctx,
    mailer,
    storage,
    close: async () => {
      await app.close()
      await ctx.close()
    },
  }
}
export type TestApp = Awaited<ReturnType<typeof makeTestApp>>

let seq = 0
export const uniqueEmail = (prefix = 'user') => `${prefix}${Date.now()}${seq++}@example.com`

export const PASSWORD = 'Sup3rSecret!pass'

export async function registerUser(t: TestApp, over: Partial<Record<string, unknown>> = {}) {
  const email = (over.email as string) ?? uniqueEmail()
  const body = {
    email,
    password: PASSWORD,
    fullName: 'Maria Teste',
    locale: 'pt',
    companyType: 'EXPORTER',
    companyName: 'Castanheira Export Ltda.',
    country: 'BR',
    acceptTerms: true,
    ...over,
  }
  const res = await t.app.inject({ method: 'POST', url: '/auth/register', payload: body })
  return { res, email, body }
}

/** Faz login e devolve o Bearer token (evita o header CSRF nos testes). */
export async function loginToken(t: TestApp, email: string, password = PASSWORD): Promise<string> {
  const res = await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } })
  if (res.statusCode !== 200) throw new Error(`login failed ${res.statusCode}: ${res.body}`)
  return res.json().accessToken as string
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` })
