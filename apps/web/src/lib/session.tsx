'use client'
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import type { SessionUser } from '@amazon-trade/shared'
import { api, ApiError } from './api'

export const isStaff = (u: SessionUser) => u.platformRole !== 'NONE'

/** Área inicial de cada perfil. */
export function homeFor(u: SessionUser): string {
  if (isStaff(u) && !u.company) return '/admin'
  if (u.company?.type === 'EXPORTER') return '/exporter'
  if (u.company?.type === 'IMPORTER') return '/store'
  return isStaff(u) ? '/admin' : '/login'
}

export function useSession() {
  return useQuery<SessionUser | null>({
    queryKey: ['/auth/me'],
    queryFn: async () => {
      try {
        return await api<SessionUser>('/auth/me')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}

export type Area = 'EXPORTER' | 'IMPORTER' | 'STAFF'

/** Protege uma área: sem sessão → /login; perfil errado → área do próprio perfil. */
export function useGuard(area: Area) {
  const session = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const user = session.data
  useEffect(() => {
    if (session.isLoading) return
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    const ok = area === 'STAFF' ? isStaff(user) : user.company?.type === area
    if (!ok) router.replace(homeFor(user))
  }, [session.isLoading, user, area, router, pathname])
  const ok = !!user && (area === 'STAFF' ? isStaff(user) : user.company?.type === area)
  return { user: ok ? user : null, loading: session.isLoading || !ok }
}

export function useLogout() {
  const qc = useQueryClient()
  const router = useRouter()
  return async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    qc.clear()
    router.replace('/login')
  }
}
