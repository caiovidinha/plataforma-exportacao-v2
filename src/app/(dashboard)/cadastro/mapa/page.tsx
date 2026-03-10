'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ExternalLink, FileText, AlertTriangle, ChevronRight } from 'lucide-react'

const STEPS = [
  { num: 1, title: 'Acesse o Portal MAPA', desc: 'Entre em www.gov.br/mapa e localize o SISCOMEX Importação/Exportação.' },
  { num: 2, title: 'Cadastre sua Empresa', desc: 'Informe CNPJ, RAI (Registro de Agroindústria), RENASEM e dados do responsável técnico.' },
  { num: 3, title: 'Envie a Documentação', desc: 'GTA (Guia de Trânsito Animal/Vegetal), laudos de laboratório e certificados sanitários.' },
  { num: 4, title: 'Aguarde Aprovação', desc: 'O MAPA analisará em até 30 dias úteis e enviará e-mail de confirmação.' },
]

export default function MapaCadastroPage() {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [number, setNumber] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="card text-center space-y-4 py-10">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-100">Número de Protocolo Salvo</h2>
          <p className="text-sm text-slate-400">
            Acompanhe o andamento diretamente no portal do MAPA. Atualizaremos este painel quando a aprovação for recebida.
          </p>
          <button className="btn-primary mx-auto" onClick={() => router.push('/dashboard')}>
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="page-title">Cadastro no MAPA</h1>
        <p className="text-sm text-slate-400 mt-1">
          O registro junto ao Ministério da Agricultura, Pecuária e Abastecimento é obrigatório para exportar produtos agropecuários.
        </p>
      </div>

      {/* Alert */}
      <div className="rounded-lg bg-amber-400/10 border border-amber-400/30 p-4 flex gap-3 text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-slate-300">
          Seu perfil ainda <strong className="text-amber-300">não está cadastrado no MAPA</strong>. Sem esse registro, você não poderá emitir o Certificado Fitossanitário nem exportar legalmente.
        </div>
      </div>

      {/* Steps */}
      <section>
        <h2 className="section-title mb-4">Como se Registrar</h2>
        <ol className="space-y-4">
          {STEPS.map((s) => (
            <li key={s.num} className="card flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-brand-400/15 text-brand-300 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {s.num}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100 mb-0.5">{s.title}</p>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* External links */}
      <section>
        <h2 className="section-title mb-4">Links Úteis</h2>
        <div className="space-y-2">
          {[
            { label: 'Portal MAPA - Gov.br', url: 'https://www.gov.br/agricultura/pt-br/assuntos/inspecao' },
            { label: 'SISCOMEX - Habilitação', url: 'https://www.siscomex.gov.br/' },
            { label: 'Cadastro Exportador Vegetal (MAPA)', url: 'https://www.gov.br/mapa/pt-br/assuntos/exportacao' },
          ].map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center justify-between card hover:border-slate-600 transition-colors group p-3">
              <span className="text-sm text-slate-300 group-hover:text-brand-300 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" /> {l.label}
              </span>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
            </a>
          ))}
        </div>
      </section>

      {/* Protocol input */}
      <section>
        <h2 className="section-title mb-4">Já Iniciou o Processo?</h2>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <p className="text-sm text-slate-400">
            Se você já solicitou o cadastro, informe o número de protocolo para acompanharmos o andamento.
          </p>
          <div>
            <label className="label" htmlFor="protocol">Número do Protocolo MAPA</label>
            <input id="protocol" className="input" placeholder="Ex.: 21000.123456/2024"
                   value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            Salvar Protocolo <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </form>
      </section>
    </div>
  )
}
