import Link from 'next/link'
import {
  Users, Building, Truck, Ship, FileCheck, DollarSign,
  Package, Microscope, Shield, Leaf, ChevronRight, AlertTriangle,
} from 'lucide-react'
import mockData from '@/mock/data.json'

export const metadata = { title: 'Cadastros' }

const entities = [
  { href: '/cadastro/exportadores',   label: 'Exportadores',         icon: Users,        count: mockData.exporters.length,     desc: 'Empresas cadastradas como exportadoras' },
  { href: '/cadastro/importadores',   label: 'Importadores',         icon: Building,     count: mockData.importers.length,     desc: 'Buyers internacionais cadastrados' },
  { href: '/cadastro/produtos',       label: 'Produtos',             icon: Package,      count: mockData.products.length,      desc: 'Produtos e fichas técnicas' },
  { href: '/cadastro/transportadoras',label: 'Transportadoras',      icon: Truck,        count: 1,  desc: 'Parceiros de transporte rodoviário/aéreo' },
  { href: '/cadastro/navegacao',      label: 'Cias. de Navegação',   icon: Ship,         count: 1,  desc: 'Armadores e agências marítimas' },
  { href: '/cadastro/despachantes',   label: 'Despachantes',         icon: FileCheck,    count: 1,  desc: 'Despachantes aduaneiros homologados' },
  { href: '/cadastro/corretoras',     label: 'Corretoras de Câmbio', icon: DollarSign,   count: 1,  desc: 'Instituições de câmbio autorizadas' },
  { href: '/cadastro/terminais',      label: 'Terminais',            icon: Package,      count: 1,  desc: 'Terminais alfandegários e de contêineres' },
  { href: '/cadastro/certificadoras', label: 'Certificadoras',       icon: Leaf,         count: 1,  desc: 'Entidades certificadoras credenciadas' },
  { href: '/cadastro/laboratorios',   label: 'Laboratórios',         icon: Microscope,   count: 1,  desc: 'Labs de análise acreditados MAPA/INMETRO' },
  { href: '/cadastro/seguradoras',    label: 'Seguradoras',          icon: Shield,       count: 1,  desc: 'Seguradoras de carga e crédito' },
]

export default function CadastroPage() {
  const mapaRegistered = (mockData.user as { mapa_registered?: boolean }).mapa_registered ?? false

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="page-title">Cadastros</h1>
        <p className="text-sm text-slate-400 mt-1">Gerencie todas as entidades da sua operação de exportação.</p>
      </div>

      {!mapaRegistered && (
        <div className="rounded-lg bg-amber-400/10 border border-amber-400/30 p-4 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-200 font-medium">Cadastro MAPA pendente</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Você precisa se registrar no MAPA para exportar legalmente produtos agropecuários.
              </p>
            </div>
          </div>
          <Link href="/cadastro/mapa" className="btn-primary whitespace-nowrap flex-shrink-0 text-sm py-1.5">
            Registrar no MAPA
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {entities.map(({ href, label, icon: Icon, count, desc }) => (
          <Link key={href} href={href}
            className="card flex items-center gap-4 hover:border-slate-600 hover:bg-slate-800/60 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors">{label}</p>
                <span className="text-xs text-slate-500 font-mono">{count}</span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
