'use client'

import { useState } from 'react'
import { FileText, FileImage, Download, Eye, X } from 'lucide-react'
import { cn, documentTypeLabel } from '@/lib/utils'
import type { WorkflowDocument } from '@/types'

type DocStatus = WorkflowDocument['status']

const statusClasses: Record<DocStatus, string> = {
  PENDENTE:  'text-slate-400 bg-slate-400/10 border-slate-400/20',
  EMITIDO:   'text-brand-400 bg-brand-400/10 border-brand-400/20',
  ASSINADO:  'text-violet-400 bg-violet-400/10 border-violet-400/20',
  APROVADO:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  REJEITADO: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const statusLabel: Record<DocStatus, string> = {
  PENDENTE:  'Pendente',
  EMITIDO:   'Emitido',
  ASSINADO:  'Assinado',
  APROVADO:  'Aprovado',
  REJEITADO: 'Rejeitado',
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(url)
}

function isPdfUrl(url: string) {
  return /\.pdf$/i.test(url)
}

function FileIcon({ url }: { url?: string }) {
  if (url && isImageUrl(url)) return <FileImage className="w-4 h-4 text-slate-500 flex-shrink-0" />
  return <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
}

// ---- Preview modal -----------------------------------------
function PreviewModal({ doc, onClose }: { doc: WorkflowDocument; onClose: () => void }) {
  const isImage = !!doc.url && isImageUrl(doc.url)
  const isPdf = !!doc.url && isPdfUrl(doc.url)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-dark-50 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon url={doc.url} />
            <span className="text-sm font-semibold text-slate-100 truncate">{doc.name}</span>
            <span className={cn('badge text-xs flex-shrink-0', statusClasses[doc.status])}>
              {statusLabel[doc.status]}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            {doc.url && (
              <a
                href={doc.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isPdf && doc.url && (
            <iframe
              src={doc.url}
              className="w-full min-h-[72vh]"
              title={doc.name}
            />
          )}
          {isImage && doc.url && (
            <div className="flex items-center justify-center p-6 min-h-[72vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.url} alt={doc.name} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="flex flex-col items-center justify-center min-h-[72vh] gap-4 text-slate-500 p-6">
              <FileText className="w-14 h-14 opacity-20" />
              <p className="text-sm text-center">Pré-visualização não disponível para este tipo de arquivo.</p>
              {doc.url && (
                <a
                  href={doc.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar arquivo
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Public component --------------------------------------
interface DocumentViewerProps {
  documents: WorkflowDocument[]
}

export function DocumentViewer({ documents }: DocumentViewerProps) {
  const [preview, setPreview] = useState<WorkflowDocument | null>(null)

  if (documents.length === 0) return null

  return (
    <>
      <div className="rounded-lg border border-slate-700/40 overflow-hidden divide-y divide-slate-700/30">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between py-2.5 px-3 hover:bg-dark-100 group transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileIcon url={doc.url} />
              <div className="min-w-0">
                <p className="text-xs text-slate-200 truncate">{doc.name}</p>
                <p className="text-xs text-slate-500">{documentTypeLabel[doc.type] ?? doc.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
              <span className={cn('badge text-xs', statusClasses[doc.status])}>
                {statusLabel[doc.status]}
              </span>
              {doc.url && (
                <>
                  <button
                    onClick={() => setPreview(doc)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-brand-400 transition-colors"
                    title="Pré-visualizar"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={doc.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-brand-400 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </>
  )
}
