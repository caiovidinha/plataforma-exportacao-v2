import { getMapaNotices } from '@/lib/api'
import { BarChart2, ExternalLink, Bell, Globe, TrendingUp, BookOpen } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Inteligência de Mercado' }

export default async function MercadoPage() {
  const [notices, t] = await Promise.all([getMapaNotices(), getTranslations('mercado')])

  const externalLinks = [
    {
      title: t('apexTitle'),
      desc: t('apexDesc'),
      url: 'https://www.apexbrasil.com.br',
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      title: t('cnaTitle'),
      desc: t('cnaDesc'),
      url: 'https://www.cnabrasil.org.br',
      icon: Globe,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      title: t('proexTitle'),
      desc: t('proexDesc'),
      url: 'https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/proex',
      icon: BookOpen,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
    },
    {
      title: t('mapaPortalTitle'),
      desc: t('mapaPortalDesc'),
      url: 'https://www.gov.br/agricultura/pt-br/assuntos/internacional',
      icon: Bell,
      color: 'text-brand-400',
      bg: 'bg-brand-400/10',
    },
  ]

  const categoryColor = {
    ALERTA: 'text-red-400 bg-red-400/10 border-red-400/30',
    NORMATIVA: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    INFORMATIVO: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-[#584531]" /> {t('pageTitle')}
        </h1>
        <p className="text-sm text-[#584531] mt-1">{t('subtitle')}</p>
      </div>

      {/* Links externos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {externalLinks.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card hover:border-[#3e2e1e]/30 transition-all group flex items-start gap-4"
          >
            <div className={cn('w-10 h-10 flex items-center justify-center flex-shrink-0', link.bg)}>
              <link.icon className={cn('w-5 h-5', link.color)} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#3e2e1e] group-hover:text-[#1c1208] transition-colors flex items-center gap-1.5">
                {link.title}
                <ExternalLink className="w-3 h-3 text-[#584531]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#584531] mt-0.5">{link.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Informativos MAPA */}
      <div>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#584531]" /> {t('mapaNoticesTitle')}
        </h2>
        <div className="space-y-2.5">
          {notices.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card hover:border-[#3e2e1e]/30 transition-all flex items-start gap-3 group"
            >
              <span className={cn('badge flex-shrink-0 mt-0.5', categoryColor[n.category])}>
                {n.category}
              </span>
              <div className="flex-1">
                <p className="text-sm text-[#3e2e1e] group-hover:text-[#1c1208] transition-colors leading-relaxed">
                  {n.title}
                </p>
                <p className="text-xs text-[#584531]/60 mt-0.5">{formatDate(n.date)}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-[#584531]/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </div>

      {/* iFrame MAPA (opcional - descomente quando disponível) */}
      {/* 
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="section-title">Portal MAPA - Embutido</h3>
        </div>
        <iframe
          src="https://www.gov.br/agricultura/pt-br/assuntos/internacional"
          className="w-full h-[600px] border-0"
          title="Portal MAPA"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      */}
    </div>
  )
}
