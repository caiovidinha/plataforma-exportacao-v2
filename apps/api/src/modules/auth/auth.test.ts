import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bearer, loginToken, makeTestApp, PASSWORD, registerUser, type TestApp, uniqueEmail } from '../../test/helpers'

let t: TestApp
beforeAll(async () => {
  t = await makeTestApp()
})
afterAll(async () => {
  await t.close()
})

const cookieOf = (res: { cookies: { name: string; value: string }[] }, name: string) => res.cookies.find((c) => c.name === name)?.value

describe('auth', () => {
  it('health', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('ok')
  })

  it('registra usuário + empresa, define cookies e envia e-mail de verificação', async () => {
    const { res, email } = await registerUser(t)
    expect(res.statusCode).toBe(201)
    expect(cookieOf(res as never, 'at_access')).toBeTruthy()
    expect(cookieOf(res as never, 'at_refresh')).toBeTruthy()
    expect(t.mailer.last(email)?.subject).toMatch(/Confirme/)

    const token = await loginToken(t, email)
    const me = await t.app.inject({ method: 'GET', url: '/auth/me', headers: bearer(token) })
    expect(me.statusCode).toBe(200)
    expect(me.json()).toMatchObject({ email, emailVerified: false, company: { type: 'EXPORTER', onboardingStatus: 'DRAFT', memberRole: 'OWNER' } })
  })

  it('valida payload (senha fraca, e-mail duplicado)', async () => {
    const weak = await registerUser(t, { password: 'short' })
    expect(weak.res.statusCode).toBe(400)
    expect(weak.res.json().error.code).toBe('validation_error')
    const a = await registerUser(t)
    const dup = await registerUser(t, { email: a.email })
    expect(dup.res.statusCode).toBe(409)
  })

  it('login com senha errada falha de forma uniforme', async () => {
    const { email } = await registerUser(t)
    const bad = await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email, password: 'Wrong-password-1' } })
    const ghost = await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email: uniqueEmail('ghost'), password: PASSWORD } })
    expect(bad.statusCode).toBe(401)
    expect(ghost.statusCode).toBe(401)
    expect(bad.json().error.code).toBe(ghost.json().error.code)
  })

  it('rota protegida sem sessão → 401; cookie exige header CSRF em métodos de escrita', async () => {
    const anon = await t.app.inject({ method: 'GET', url: '/auth/me' })
    expect(anon.statusCode).toBe(401)

    const { res } = await registerUser(t)
    const access = cookieOf(res as never, 'at_access')!
    const withoutHeader = await t.app.inject({ method: 'POST', url: '/auth/logout', cookies: { at_access: access } })
    expect(withoutHeader.statusCode).toBe(403)
    const ok = await t.app.inject({ method: 'POST', url: '/auth/logout', cookies: { at_access: access }, headers: { 'x-requested-with': 'amazon-trade' } })
    expect(ok.statusCode).toBe(200)
  })

  it('refresh rotaciona o token e detecta reuso revogando a família', async () => {
    const { res } = await registerUser(t)
    const r1 = cookieOf(res as never, 'at_refresh')!
    const rotated = await t.app.inject({ method: 'POST', url: '/auth/refresh', cookies: { at_refresh: r1 }, headers: { 'x-requested-with': 'amazon-trade' } })
    expect(rotated.statusCode).toBe(200)
    const r2 = cookieOf(rotated as never, 'at_refresh')!
    expect(r2).not.toBe(r1)

    // reutilizar o token antigo = comprometido
    const reuse = await t.app.inject({ method: 'POST', url: '/auth/refresh', cookies: { at_refresh: r1 }, headers: { 'x-requested-with': 'amazon-trade' } })
    expect(reuse.statusCode).toBe(401)
    expect(reuse.json().error.code).toBe('refresh_token_reused')
    // e o novo também foi revogado
    const afterReuse = await t.app.inject({ method: 'POST', url: '/auth/refresh', cookies: { at_refresh: r2 }, headers: { 'x-requested-with': 'amazon-trade' } })
    expect(afterReuse.statusCode).toBe(401)
  })

  it('verifica e-mail e redefine senha', async () => {
    const { email } = await registerUser(t)
    const mail = t.mailer.last(email)!
    const verifyToken = /token=([\w-]+)/.exec(mail.text)![1]!
    const v = await t.app.inject({ method: 'POST', url: '/auth/verify-email', payload: { token: verifyToken } })
    expect(v.statusCode).toBe(200)
    const again = await t.app.inject({ method: 'POST', url: '/auth/verify-email', payload: { token: verifyToken } })
    expect(again.statusCode).toBe(401)

    await t.app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email } })
    const resetMail = t.mailer.last(email)!
    expect(resetMail.subject).toMatch(/senha/i)
    const resetToken = /token=([\w-]+)/.exec(resetMail.text)![1]!
    const newPass = 'Another-Strong-1pass'
    const reset = await t.app.inject({ method: 'POST', url: '/auth/reset-password', payload: { token: resetToken, password: newPass } })
    expect(reset.statusCode).toBe(200)
    const login = await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email, password: newPass } })
    expect(login.statusCode).toBe(200)
    const old = await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email, password: PASSWORD } })
    expect(old.statusCode).toBe(401)
  })

  it('bloqueia a conta após muitas tentativas inválidas', async () => {
    const { email } = await registerUser(t)
    for (let i = 0; i < 8; i++) {
      await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email, password: 'Wrong-password-1' } })
    }
    const locked = await t.app.inject({ method: 'POST', url: '/auth/login', payload: { email, password: PASSWORD } })
    expect(locked.statusCode).toBe(423)
  })
})
