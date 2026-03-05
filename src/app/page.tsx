import Link from 'next/link'
import {
  Leaf, Globe, GitBranch, FileText, Package,
  TrendingUp, Shield, ChevronRight, Star, ArrowRight,
  Truck, Ship, Microscope, Building2, DollarSign, Warehouse,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: Globe,      title: 'Matchmaking B2B',        desc: 'Conectamos exportadores brasileiros a importadores em mais de 40 países com sistema inteligente de match por produto, volume e certificação.' },
  { icon: FileText,   title: 'Ficha Técnica Completa',  desc: 'Organoléptico, físico-químico, tolerância de aflatoxina por país, requisitos legais de importação — tudo em um só lugar.' },
  { icon: GitBranch,  title: 'Workflow Transparente',   desc: 'Acompanhe cada etapa da exportação em tempo real: do contrato à chegada no porto de destino, com datas previstas e realizadas.' },
  { icon: Package,    title: 'Marketplace de Serviços', desc: 'Contrate despachantes, transportadoras, laboratórios, seguradoras e corretoras de câmbio diretamente pela plataforma.' },
  { icon: Shield,     title: 'Segurança Comercial',     desc: 'Seguro de carga, seguro safra, seguro de pagamento e auditoria de produto com emissão de contratos e assinatura Gov.br.' },
  { icon: TrendingUp, title: 'Inteligência de Mercado', desc: 'Acesso a estudos Apex-Brasil, CNA, Proex e informativos MAPA diretamente no painel — sem sair da plataforma.' },
]

const ENTITIES = [
  { icon: Globe,      label: 'Exportadores',             color: 'text-brand-400',   bg: 'bg-brand-400/10',   slug: 'exportador' },
  { icon: Building2,  label: 'Importadores',             color: 'text-blue-400',    bg: 'bg-blue-400/10',    slug: 'importador' },
  { icon: Truck,      label: 'Transportadoras',          color: 'text-orange-400',  bg: 'bg-orange-400/10',  slug: 'transportadora' },
  { icon: Ship,       label: 'Cias. de Navegação',       color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    slug: 'companhia-navegacao' },
  { icon: FileText,   label: 'Despachantes Aduaneiros',  color: 'text-green-400',   bg: 'bg-green-400/10',   slug: 'despachante' },
  { icon: DollarSign, label: 'Corretoras de Câmbio',     color: 'text-emerald-400', bg: 'bg-emerald-400/10', slug: 'corretora' },
  { icon: Warehouse,  label: 'Terminais Alfandegários',  color: 'text-amber-400',   bg: 'bg-amber-400/10',   slug: 'terminal' },
  { icon: Shield,     label: 'Seguradoras',              color: 'text-violet-400',  bg: 'bg-violet-400/10',  slug: 'seguradora' },
  { icon: Star,       label: 'Certificadoras',           color: 'text-rose-400',    bg: 'bg-rose-400/10',    slug: 'certificadora' },
  { icon: Microscope, label: 'Laboratórios MAPA',        color: 'text-red-400',     bg: 'bg-red-400/10',     slug: 'laboratorio' },
]

const STEPS = [
  { n: '01', title: 'Match',            desc: 'Exportador publica oferta; importador manifesta interesse.' },
  { n: '02', title: 'Negociação',       desc: 'Chat estruturado, fechamento de acordo e geração de contrato.' },
  { n: '03', title: 'Contratação',      desc: 'Despachante, câmbio, transporte e terminal contratados em bloco.' },
  { n: '04', title: 'Liberação MAPA',   desc: 'Auditoria, análise de aflatoxina em lab credenciado e Certificado Fitossanitário.' },
  { n: '05', title: 'Embarque',         desc: 'Siscomex, DU-E, estufagem e embarque no navio.' },
  { n: '06', title: 'Pagamento',        desc: 'Swift, corretora de câmbio e liberação do BL original.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-display font-semibold tracking-wide">CastanhaExport</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#funcionalidades" className="hidden sm:block hover:text-slate-200 transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hidden sm:block hover:text-slate-200 transition-colors">Como Funciona</a>
          <a href="#quem-usa" className="hidden sm:block hover:text-slate-200 transition-colors">Quem Usa</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/entrar" className="btn-ghost text-sm">Entrar</Link>
          <Link href="/registro" className="btn-primary text-sm">Cadastrar</Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 py-24 md:py-36 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/10 blur-[120px] rounded-full" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-400 bg-brand-400/10 border border-brand-400/20 rounded-full px-4 py-1.5">
            <Leaf className="w-3.5 h-3.5" />
            Plataforma B2B de Exportação · Castanha-do-Brasil
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Exporte castanha{' '}
            <span className="text-brand-400">com segurança</span>{' '}
            do Brasil para o mundo
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Conectamos exportadores, importadores e toda a cadeia logística em uma plataforma integrada.
            Do match ao pagamento, com rastreabilidade total.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/registro" className="btn-primary text-base px-8 py-3 rounded-xl">
              Começar gratuitamente <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/entrar" className="btn-ghost text-base px-8 py-3 rounded-xl">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-slate-800/60 bg-slate-900/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-800/60">
          {[
            { v: '120+', l: 'Exportadores' },
            { v: '300+', l: 'Importadores' },
            { v: '42',   l: 'Países atendidos' },
            { v: '98%',  l: 'Conformidade MAPA' },
          ].map((s) => (
            <div key={s.l} className="py-8 text-center">
              <p className="text-3xl font-display font-bold text-brand-300">{s.v}</p>
              <p className="text-xs text-slate-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="max-w-5xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-white">Tudo que sua exportação precisa</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Cada etapa da cadeia exportadora integrada em um único painel.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card space-y-3 hover:border-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6 py-24 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-white">Como funciona a exportação?</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              A plataforma guia cada etapa do processo do contrato ao pagamento.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card flex gap-4">
                <span className="text-3xl font-display font-bold text-brand-400/30 leading-none flex-shrink-0 select-none">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO USES IT ── */}
      <section id="quem-usa" className="max-w-5xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-white">Quem pode usar?</h2>
          <p className="text-slate-400 text-sm">Cadastre sua empresa em menos de 5 minutos.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ENTITIES.map(({ icon: Icon, label, color, bg, slug }) => (
            <Link key={slug} href={`/registro/${slug}`}
              className={cn(
                'card flex flex-col items-center gap-2 py-5 text-center hover:border-slate-600 hover:bg-slate-800/70 transition-all group cursor-pointer',
              )}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors leading-tight">
                {label}
              </p>
            </Link>
          ))}
        </div>
        <div className="text-center">
          <Link href="/registro" className="btn-primary text-sm px-8">
            Escolher meu tipo de cadastro <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-2xl bg-gradient-to-br from-brand-900/40 via-slate-900 to-slate-900 border border-brand-400/20 p-10 text-center space-y-5">
          <Leaf className="w-10 h-10 text-brand-400 mx-auto" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            Pronto para exportar com mais segurança?
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Crie sua conta gratuitamente e comece a conectar sua empresa ao mercado internacional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/registro" className="btn-primary text-sm px-8 py-3 rounded-xl">
              Criar conta gratuita <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/entrar" className="btn-ghost text-sm">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 px-6 py-8 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} CastanhaExport · Plataforma B2B de Exportação de Castanha-do-Brasil</p>
        <p className="mt-1">Integrado com SISCOMEX · MAPA · Gov.br · SIGVIG · SWIFT</p>
      </footer>
    </div>
  )
}

