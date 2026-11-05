import { cn } from '@/lib/cn'

/**
 * Marca provisória Amazon Trade (SVG): folha atravessada por um rio. Substituir pelo logo oficial quando existir —
 * basta trocar este componente e `src/app/icon.svg`.
 */
export function LogoMark({ className, tone = 'brand' }: { className?: string; tone?: 'brand' | 'light' }) {
  const bg = tone === 'brand' ? '#1b6145' : '#ffffff'
  const fg = tone === 'brand' ? '#ffffff' : '#1b6145'
  return (
    <svg viewBox="0 0 40 40" className={cn('h-8 w-8 shrink-0', className)} aria-hidden>
      <rect width="40" height="40" rx="10" fill={bg} />
      <path d="M11 27c0-9 6-15 18-16-.5 11-6.500 17-16 16z" fill={fg} opacity=".95" />
      <path d="M12.500 28.500C16 22 20.500 18 26 15.500" stroke={bg} strokeWidth="1.800" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Logo({ className, tone = 'brand', compact }: { className?: string; tone?: 'brand' | 'light'; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark tone={tone} />
      {!compact && (
        <span className={cn('text-[17px] leading-none tracking-tight', tone === 'light' ? 'text-white' : 'text-ink-900')}>
          <span className="font-semibold">Amazon</span> <span className="font-normal opacity-80">Trade</span>
        </span>
      )}
    </span>
  )
}
