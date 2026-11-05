import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { makeTestApp, type TestApp } from '../../test/helpers'
import { createActor, type Actor } from '../../test/fixtures'

let t: TestApp
let importer: Actor
let ops: Actor
let compliance: Actor
let root: Actor

beforeAll(async () => {
  t = await makeTestApp()
  importer = await createActor(t, { type: 'IMPORTER', approved: true })
  ops = await createActor(t, { type: 'IMPORTER', platformRole: 'OPERATIONS' })
  compliance = await createActor(t, { type: 'IMPORTER', platformRole: 'COMPLIANCE' })
  root = await createActor(t, { type: 'IMPORTER', platformRole: 'PLATFORM_ADMIN' })
})
afterAll(async () => {
  await t.close()
})

describe('backoffice: visão geral, empresas e usuários', () => {
  it('visão geral é restrita à equipe', async () => {
    expect((await t.app.inject({ method: 'GET', url: '/admin/overview', headers: importer.h })).statusCode).toBe(403)
    for (const a of [ops, compliance, root]) {
      const res = await t.app.inject({ method: 'GET', url: '/admin/overview', headers: a.h })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual(expect.objectContaining({ companiesApproved: expect.any(Number), jobsDead: expect.any(Number), shipmentsInProgress: expect.any(Number) }))
    }
  })

  it('lista e filtra empresas', async () => {
    const all = (await t.app.inject({ method: 'GET', url: '/admin/companies', headers: compliance.h })).json()
    expect(all.length).toBeGreaterThanOrEqual(4)
    const approved = (await t.app.inject({ method: 'GET', url: '/admin/companies?status=APPROVED', headers: compliance.h })).json()
    expect(approved.every((c: { onboardingStatus: string }) => c.onboardingStatus === 'APPROVED')).toBe(true)
    const none = (await t.app.inject({ method: 'GET', url: '/admin/companies?q=zzzz-inexistente', headers: compliance.h })).json()
    expect(none).toEqual([])
  })

  it('gestão de usuários é só do administrador da plataforma e não permite alterar a si mesmo', async () => {
    for (const a of [ops, compliance, importer]) expect((await t.app.inject({ method: 'GET', url: '/admin/users', headers: a.h })).statusCode).toBe(403)
    const list = (await t.app.inject({ method: 'GET', url: '/admin/users', headers: root.h })).json()
    expect(list.find((u: { email: string }) => u.email === importer.email)).toBeTruthy()

    const promote = await t.app.inject({ method: 'PATCH', url: `/admin/users/${importer.userId}`, headers: root.h, payload: { platformRole: 'COMPLIANCE' } })
    expect(promote.statusCode).toBe(200)
    expect((await t.app.inject({ method: 'GET', url: '/admin/overview', headers: importer.h })).statusCode).toBe(200)

    expect((await t.app.inject({ method: 'PATCH', url: `/admin/users/${root.userId}`, headers: root.h, payload: { disabled: true } })).statusCode).toBe(403)

    // usuário desativado perde o acesso imediatamente
    await t.app.inject({ method: 'PATCH', url: `/admin/users/${importer.userId}`, headers: root.h, payload: { disabled: true } })
    expect((await t.app.inject({ method: 'GET', url: '/admin/overview', headers: importer.h })).statusCode).toBe(401)
  })
})
