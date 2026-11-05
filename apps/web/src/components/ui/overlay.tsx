'use client'
import * as Dialog from '@radix-ui/react-dialog'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import { Button } from './primitives'

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[1px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-pop focus:outline-none',
            size === 'sm' && 'max-w-sm',
            size === 'md' && 'max-w-lg',
            size === 'lg' && 'max-w-3xl',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-ink-900">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-ink-500">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === 'string' ? title : 'dialog'}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Confirmação com texto livre opcional/obrigatório (motivo de recusa, etc.). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger,
  reason,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  reason?: { label: string; required?: boolean }
  loading?: boolean
}) {
  const t = useT()
  const [text, setText] = useState('')
  const blocked = !!reason?.required && text.trim().length < 3
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} disabled={blocked} onClick={() => onConfirm(reason ? text.trim() : undefined)}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      {reason && (
        <div>
          <label className="label">{reason.label}</label>
          <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      )}
    </Modal>
  )
}

export const DropdownMenu = Menu.Root
export const DropdownTrigger = Menu.Trigger
export function DropdownContent({ children, align = 'end' }: { children: ReactNode; align?: 'start' | 'end' }) {
  return (
    <Menu.Portal>
      <Menu.Content align={align} sideOffset={8} className="z-50 min-w-[12rem] rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop animate-fade-in">
        {children}
      </Menu.Content>
    </Menu.Portal>
  )
}
export const DropdownItem = ({ children, onSelect, danger }: { children: ReactNode; onSelect?: () => void; danger?: boolean }) => (
  <Menu.Item onSelect={onSelect} className={cn('flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink-100', danger ? 'text-red-600' : 'text-ink-800')}>
    {children}
  </Menu.Item>
)
export const DropdownLabel = ({ children }: { children: ReactNode }) => <Menu.Label className="px-3 py-1.5 text-xs text-ink-500">{children}</Menu.Label>
export const DropdownSeparator = () => <Menu.Separator className="my-1 h-px bg-ink-100" />
