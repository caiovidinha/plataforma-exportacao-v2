import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EntitySlug } from '@/lib/entity-config'
import { MOCK_USERS, type MockUser } from '@/mock/mock-users'

interface MockSessionState {
  entityType: EntitySlug
  user: MockUser
  setEntityType: (slug: EntitySlug) => void
}

export const useMockSession = create<MockSessionState>()(
  persist(
    (set) => ({
      entityType: 'exportador',
      user: MOCK_USERS['exportador'],
      setEntityType: (slug: EntitySlug) =>
        set({ entityType: slug, user: MOCK_USERS[slug] }),
    }),
    {
      name: 'castanha-mock-session',
    },
  ),
)

// Convenience helper used inside server components that can't access Zustand.
// Returns the default (exportador) — the client switcher overrides for interactive use.
export function getDefaultMockUser() {
  return MOCK_USERS['exportador']
}
