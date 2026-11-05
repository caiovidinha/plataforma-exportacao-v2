import { getListings } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import { VitrineListings } from '@/components/vitrine/VitrineListings'
import { NewListingButton } from '@/components/vitrine/NewListingButton'

export const metadata = { title: 'Vitrine' }

export default async function VitrinePage() {
  const { data: listings } = await getListings()
  const t = await getTranslations('vitrine')
  // Anúncios em destaque vêm primeiro
  const sortedListings = [...listings].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('pageTitle')}</h1>
          <p className="text-sm text-[#584531] mt-1">{t('offersCount', { count: sortedListings.length })}</p>
        </div>
        <NewListingButton />
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap gap-3">
        <input className="input w-48" placeholder={t('searchPlaceholder')} />
        <select className="input w-36">
          <option value="">{t('filterIncoterm')}</option>
          <option value="FOB">FOB</option>
          <option value="CIF">CIF</option>
        </select>
        <select className="input w-40">
          <option value="">{t('filterOriginPort')}</option>
          <option value="belem">Porto de Belém</option>
          <option value="santos">Porto de Santos</option>
        </select>
        <select className="input w-36">
          <option value="">{t('filterHarvest')}</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>

      <VitrineListings listings={sortedListings} />
    </div>
  )
}
