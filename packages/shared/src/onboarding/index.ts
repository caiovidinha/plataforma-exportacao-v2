import type { CompanyType } from '../enums'
import type { SectionDef } from '../fields'
import { EXPORTER_SECTIONS } from './exporter'
import { IMPORTER_SECTIONS } from './importer'

export { EXPORTER_SECTIONS, IMPORTER_SECTIONS }

export const SECTIONS_BY_TYPE: Record<CompanyType, SectionDef[]> = {
  EXPORTER: EXPORTER_SECTIONS,
  IMPORTER: IMPORTER_SECTIONS,
}

export const sectionsFor = (type: CompanyType): SectionDef[] => SECTIONS_BY_TYPE[type]

export const getSection = (type: CompanyType, key: string): SectionDef | undefined =>
  SECTIONS_BY_TYPE[type].find((s) => s.key === key)
