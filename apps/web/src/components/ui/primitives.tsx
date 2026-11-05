'use client'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useEnumLabel } from '@/lib/i18n'

// ------------------------------------------------------------------ botão
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({
  variant = 'primary',
  size,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'lg'; loading?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={cn(`btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn('h-5 w-5 animate-spin text-ink-400', className)} />

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  )
}

// ------------------------------------------------------------------ badge de status
const TONES = {
  gray: 'bg-ink-100 text-ink-700 ring-ink-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
} as const
export type Tone = keyof typeof TONES

export const Badge = ({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) => (
  <span className={cn('badge', TONES[tone], className)}>{children}</span>
)

const STATUS_TONE: Record<string, Tone> = {
  // cadastro / documentos
  DRAFT: 'gray', SUBMITTED: 'blue', IN_REVIEW: 'blue', CHANGES_REQUESTED: 'amber', APPROVED: 'green', REJECTED: 'red',
  PENDING: 'amber', EXPIRED: 'red',
  // pedidos / embarques / tarefas
  AWAITING_CONFIRMATION: 'amber', CONFIRMED: 'green', CANCELLED: 'gray',
  IN_PROGRESS: 'blue', COMPLETED: 'green', DISPUTE: 'red', DONE: 'green', BLOCKED: 'red', SKIPPED: 'gray',
  // produtos / jobs
  PUBLISHED: 'green', PAUSED: 'amber', QUEUED: 'blue', RUNNING: 'blue', SUCCEEDED: 'green', FAILED: 'amber', DEAD: 'red',
}

/** Badge colorido para qualquer enum de status; o rótulo vem de `messages` (`<group>.<VALOR>`). */
export function StatusBadge({ group, value }: { group: string; value: string }) {
  const label = useEnumLabel()
  return <Badge tone={STATUS_TONE[value] ?? 'gray'}>{label(group, value)}</Badge>
}

// ------------------------------------------------------------------ estruturas de página
export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Section({ title, description, actions, children, className }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card-pad">
      <div className="flex items-center justify-between text-ink-500">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-300 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-400">{icon}</div>}
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

const ALERT = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
} as const
export const Alert = ({ tone = 'info', title, children, className }: { tone?: keyof typeof ALERT; title?: ReactNode; children?: ReactNode; className?: string }) => (
  <div className={cn('rounded-lg border px-4 py-3 text-sm', ALERT[tone], className)} role={tone === 'error' ? 'alert' : undefined}>
    {title && <p className="font-medium">{title}</p>}
    {children && <div className={cn(title && 'mt-1', 'opacity-90')}>{children}</div>}
  </div>
)

export const ProgressBar = ({ value, className }: { value: number; className?: string }) => (
  <div className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
    <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
)

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-ink-200" role="tablist">
      {items.map((i) => (
        <button
          key={i.value}
          role="tab"
          aria-selected={value === i.value}
          onClick={() => onChange(i.value)}
          className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', value === i.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800')}
        >
          {i.label}
          {i.count !== undefined && <span className="ml-1.5 rounded-full bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">{i.count}</span>}
        </button>
      ))}
    </div>
  )
}

export const Dl = ({ items }: { items: { label: ReactNode; value: ReactNode }[] }) => (
  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
    {items.map((i, idx) => (
      <div key={idx}>
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{i.label}</dt>
        <dd className="mt-0.5 text-sm text-ink-900">{i.value ?? '—'}</dd>
      </div>
    ))}
  </dl>
)
