'use client'
import { ChevronDown, LogOut } from 'lucide-react'
import type { SessionUser } from '@amazon-trade/shared'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { useLocale, useSetLocale, useT } from '@/lib/i18n'
import { useLogout } from '@/lib/session'
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/overlay'

export function UserMenu({ user, className, light }: { user: SessionUser; className?: string; light?: boolean }) {
  const t = useT()
  const logout = useLogout()
  const locale = useLocale()
  const setLocale = useSetLocale()
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <button type="button" className={cn('flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-ink-100', light && 'hover:bg-white/10', className)}>
          <span className="grid h-8 w-8 place-items-center rounded-none bg-brand-600 text-xs font-semibold text-white">{initials(user.fullName)}</span>
          <span className="hidden max-w-[10rem] text-left leading-tight lg:block">
            <span className={cn('block truncate text-sm font-medium', light ? 'text-white' : 'text-ink-900')}>{user.fullName}</span>
            <span className={cn('block truncate text-xs', light ? 'text-white/70' : 'text-ink-500')}>{user.company?.legalName ?? t(`role.${user.platformRole}` as never)}</span>
          </span>
          <ChevronDown className={cn('h-4 w-4', light ? 'text-white/70' : 'text-ink-400')} />
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{user.email}</DropdownLabel>
        <DropdownSeparator />
        {(['pt', 'en', 'es'] as const).filter((l) => l !== locale).map((l) => (
          <DropdownItem key={l} onSelect={() => setLocale(l)}>{l === 'pt' ? 'Português' : l === 'en' ? 'English' : 'Español'}</DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem danger onSelect={logout}>
          <LogOut className="h-4 w-4" /> {t('nav.logout')}
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  )
}
