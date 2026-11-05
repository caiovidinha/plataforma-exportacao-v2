'use client'
import type { ReactNode } from 'react'
import { StoreShell } from '@/components/layout/StoreShell'
import { useGuard } from '@/lib/session'

export default function StoreLayout({ children }: { children: ReactNode }) {
  const { user } = useGuard('IMPORTER')
  return <StoreShell user={user}>{children}</StoreShell>
}
