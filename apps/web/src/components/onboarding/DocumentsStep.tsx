'use client'
import { Eye, FileText, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { DOCUMENT_UPLOAD_RULES, documentTypesFor, type CompanyType, type DocumentDto, type DocumentTypeDef, type PartnerType } from '@amazon-trade/shared'
import { Badge, Button, StatusBadge } from '@/components/ui/primitives'
import { Input } from '@/components/ui/form'
import { api, openFile } from '@/lib/api'
import { fmtBytes, fmtDate } from '@/lib/format'
import { useEnumLabel, useIntlLocale, useL, useT } from '@/lib/i18n'
import { useSend } from '@/lib/query'

function DocRow({ def, docs, locked, missing }: { def: DocumentTypeDef; docs: DocumentDto[]; locked: boolean; missing: boolean }) {
  const t = useT()
  const tl = useL()
  const enumLabel = useEnumLabel()
  const locale = useIntlLocale()
  const fileRef = useRef<HTMLInputElement>(null)
  const [expiry, setExpiry] = useState('')
  const canUpload = !locked && (def.multiple || !docs.some((d) => d.status === 'APPROVED') || true)

  const upload = useSend(
    (file: File) => {
      const form = new FormData()
      form.set('typeKey', def.key)
      if (expiry) form.set('expiresAt', expiry)
      form.set('file', file) // o arquivo precisa ser o último campo
      return api<DocumentDto>('/documents', { method: 'POST', form })
    },
    { invalidate: ['/onboarding', '/dashboard'], onSuccess: () => toast.success(t('documents.uploaded')) },
  )
  const remove = useSend((id: string) => api(`/documents/${id}`, { method: 'DELETE' }), { invalidate: ['/onboarding'] })

  const onPick = (file?: File) => {
    if (!file) return
    if (file.size > DOCUMENT_UPLOAD_RULES.maxBytes) return void toast.error(t('documents.tooLarge'))
    if (def.requiresExpiry && !expiry) return void toast.error(t('documents.needExpiry'))
    upload.mutate(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <li className={`rounded-xl border p-4 ${missing ? 'border-red-300 bg-red-50/40' : 'border-ink-200 bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-900">{tl(def.label)}</p>
            {def.required ? <Badge tone="brand">{t('documents.required')}</Badge> : <Badge>{t('documents.optional')}</Badge>}
            {def.partners?.map((p: PartnerType) => (
              <Badge key={p} tone="gray">{enumLabel('partner', p)}</Badge>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-500">{tl(def.description)}</p>
        </div>
        {canUpload && (
          <div className="flex items-end gap-2">
            {def.requiresExpiry && (
              <div>
                <label className="mb-0.5 block text-[11px] font-medium text-ink-500">{t('documents.expiry')}</label>
                <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-40 py-1.5 text-xs" min={new Date().toISOString().slice(0, 10)} />
              </div>
            )}
            <input ref={fileRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onPick(e.target.files?.[0])} />
            <Button size="sm" variant="secondary" loading={upload.isPending} onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> {docs.length && !def.multiple ? t('documents.replace') : t('documents.upload')}
            </Button>
          </div>
        )}
      </div>

      {docs.length > 0 && (
        <ul className="mt-3 divide-y divide-ink-100 rounded-lg border border-ink-100">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-ink-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-800">{d.fileName}</p>
                <p className="text-xs text-ink-500">
                  {fmtBytes(d.sizeBytes)} · v{d.version} · {fmtDate(d.uploadedAt, locale)}
                  {d.expiresAt && ` · ${t('documents.expires')} ${fmtDate(d.expiresAt, locale)}`}
                </p>
                {d.status === 'REJECTED' && d.reviewReason && <p className="mt-0.5 text-xs text-red-600">{t('documents.rejectedReason')}: {d.reviewReason}</p>}
              </div>
              <StatusBadge group="docStatus" value={d.status} />
              <button type="button" className="rounded p-1.5 text-ink-500 hover:bg-ink-100" aria-label={t('common.view')} onClick={() => openFile(`/documents/${d.id}/download`, d.fileName)}>
                <Eye className="h-4 w-4" />
              </button>
              {!locked && d.status !== 'APPROVED' && (
                <button type="button" className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label={t('common.remove')} onClick={() => remove.mutate(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function DocumentsStep({ companyType, documents, locked, missingKeys }: { companyType: CompanyType; documents: DocumentDto[]; locked: boolean; missingKeys: Set<string> }) {
  const t = useT()
  const defs = documentTypesFor(companyType)
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">{t('documents.intro', { max: Math.round(DOCUMENT_UPLOAD_RULES.maxBytes / 1024 / 1024) })}</p>
      <ul className="space-y-3">
        {defs.map((d) => (
          <DocRow key={d.key} def={d} docs={documents.filter((x) => x.typeKey === d.key)} locked={locked} missing={missingKeys.has(d.key)} />
        ))}
      </ul>
    </div>
  )
}
