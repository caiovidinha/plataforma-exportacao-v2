import { L } from './i18n'

export interface CountryRef {
  code: string
  name: L
  dial: string
}

/** Países relevantes para o comércio de castanha (lista curada; ISO 3166-1 alpha-2). */
export const COUNTRIES: CountryRef[] = [
  { code: 'BR', name: L('Brasil', 'Brazil'), dial: '+55' },
  { code: 'DE', name: L('Alemanha', 'Germany'), dial: '+49' },
  { code: 'NL', name: L('Países Baixos', 'Netherlands'), dial: '+31' },
  { code: 'BE', name: L('Bélgica', 'Belgium'), dial: '+32' },
  { code: 'FR', name: L('França', 'France'), dial: '+33' },
  { code: 'ES', name: L('Espanha', 'Spain'), dial: '+34' },
  { code: 'IT', name: L('Itália', 'Italy'), dial: '+39' },
  { code: 'PT', name: L('Portugal', 'Portugal'), dial: '+351' },
  { code: 'GB', name: L('Reino Unido', 'United Kingdom'), dial: '+44' },
  { code: 'IE', name: L('Irlanda', 'Ireland'), dial: '+353' },
  { code: 'DK', name: L('Dinamarca', 'Denmark'), dial: '+45' },
  { code: 'SE', name: L('Suécia', 'Sweden'), dial: '+46' },
  { code: 'NO', name: L('Noruega', 'Norway'), dial: '+47' },
  { code: 'FI', name: L('Finlândia', 'Finland'), dial: '+358' },
  { code: 'PL', name: L('Polônia', 'Poland'), dial: '+48' },
  { code: 'CH', name: L('Suíça', 'Switzerland'), dial: '+41' },
  { code: 'AT', name: L('Áustria', 'Austria'), dial: '+43' },
  { code: 'US', name: L('Estados Unidos', 'United States'), dial: '+1' },
  { code: 'CA', name: L('Canadá', 'Canada'), dial: '+1' },
  { code: 'MX', name: L('México', 'Mexico'), dial: '+52' },
  { code: 'AR', name: L('Argentina', 'Argentina'), dial: '+54' },
  { code: 'CL', name: L('Chile', 'Chile'), dial: '+56' },
  { code: 'CO', name: L('Colômbia', 'Colombia'), dial: '+57' },
  { code: 'PE', name: L('Peru', 'Peru'), dial: '+51' },
  { code: 'CN', name: L('China', 'China'), dial: '+86' },
  { code: 'HK', name: L('Hong Kong', 'Hong Kong'), dial: '+852' },
  { code: 'JP', name: L('Japão', 'Japan'), dial: '+81' },
  { code: 'KR', name: L('Coreia do Sul', 'South Korea'), dial: '+82' },
  { code: 'IN', name: L('Índia', 'India'), dial: '+91' },
  { code: 'SG', name: L('Singapura', 'Singapore'), dial: '+65' },
  { code: 'AE', name: L('Emirados Árabes Unidos', 'United Arab Emirates'), dial: '+971' },
  { code: 'SA', name: L('Arábia Saudita', 'Saudi Arabia'), dial: '+966' },
  { code: 'TR', name: L('Turquia', 'Türkiye'), dial: '+90' },
  { code: 'IL', name: L('Israel', 'Israel'), dial: '+972' },
  { code: 'AU', name: L('Austrália', 'Australia'), dial: '+61' },
  { code: 'ZA', name: L('África do Sul', 'South Africa'), dial: '+27' },
]
export const COUNTRY_CODES = COUNTRIES.map((c) => c.code)

export interface PortRef {
  code: string
  name: string
  country: string
}

/** Portos (UN/LOCODE). Origem brasileira + principais destinos. */
export const PORTS: PortRef[] = [
  { code: 'BRBEL', name: 'Belém (PA)', country: 'BR' },
  { code: 'BRVDC', name: 'Vila do Conde / Barcarena (PA)', country: 'BR' },
  { code: 'BRMAO', name: 'Manaus (AM)', country: 'BR' },
  { code: 'BRSTM', name: 'Santarém (PA)', country: 'BR' },
  { code: 'BRSSZ', name: 'Santos (SP)', country: 'BR' },
  { code: 'BRPNG', name: 'Paranaguá (PR)', country: 'BR' },
  { code: 'BRITJ', name: 'Itajaí (SC)', country: 'BR' },
  { code: 'BRNVT', name: 'Navegantes (SC)', country: 'BR' },
  { code: 'BRRIO', name: 'Rio de Janeiro (RJ)', country: 'BR' },
  { code: 'BRSSA', name: 'Salvador (BA)', country: 'BR' },
  { code: 'BRSUA', name: 'Suape (PE)', country: 'BR' },
  { code: 'BRFOR', name: 'Fortaleza / Pecém (CE)', country: 'BR' },
  { code: 'DEHAM', name: 'Hamburg', country: 'DE' },
  { code: 'DEBRV', name: 'Bremerhaven', country: 'DE' },
  { code: 'NLRTM', name: 'Rotterdam', country: 'NL' },
  { code: 'BEANR', name: 'Antwerp', country: 'BE' },
  { code: 'FRLEH', name: 'Le Havre', country: 'FR' },
  { code: 'ESBCN', name: 'Barcelona', country: 'ES' },
  { code: 'ESVLC', name: 'Valencia', country: 'ES' },
  { code: 'ITGOA', name: 'Genoa', country: 'IT' },
  { code: 'PTLIS', name: 'Lisbon', country: 'PT' },
  { code: 'GBFXT', name: 'Felixstowe', country: 'GB' },
  { code: 'GBSOU', name: 'Southampton', country: 'GB' },
  { code: 'USNYC', name: 'New York / New Jersey', country: 'US' },
  { code: 'USMIA', name: 'Miami', country: 'US' },
  { code: 'USLAX', name: 'Los Angeles', country: 'US' },
  { code: 'CNSHA', name: 'Shanghai', country: 'CN' },
  { code: 'CNNGB', name: 'Ningbo', country: 'CN' },
  { code: 'JPTYO', name: 'Tokyo', country: 'JP' },
  { code: 'SGSIN', name: 'Singapore', country: 'SG' },
  { code: 'AEJEA', name: 'Jebel Ali (Dubai)', country: 'AE' },
  { code: 'INNSA', name: 'Nhava Sheva (Mumbai)', country: 'IN' },
]
export const ORIGIN_PORTS = PORTS.filter((p) => p.country === 'BR')
export const portByCode = (code: string) => PORTS.find((p) => p.code === code)
export const PORT_CODES = PORTS.map((p) => p.code)

export const BR_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
  'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const

export const CERTIFICATIONS = [
  { value: 'ORGANIC_IBD', label: L('Orgânico IBD', 'Organic IBD') },
  { value: 'ORGANIC_USDA', label: L('Orgânico USDA', 'Organic USDA') },
  { value: 'ORGANIC_EU', label: L('Orgânico UE', 'Organic EU') },
  { value: 'FAIR_TRADE', label: L('Fair Trade', 'Fair Trade') },
  { value: 'RAINFOREST', label: L('Rainforest Alliance', 'Rainforest Alliance') },
  { value: 'FSSC_22000', label: L('FSSC 22000', 'FSSC 22000') },
  { value: 'HACCP', label: L('HACCP', 'HACCP') },
  { value: 'ISO_22000', label: L('ISO 22000', 'ISO 22000') },
  { value: 'KOSHER', label: L('Kosher', 'Kosher') },
  { value: 'HALAL', label: L('Halal', 'Halal') },
  { value: 'BRC', label: L('BRCGS', 'BRCGS') },
] as const

const ES_COUNTRY: Record<string, string> = {
  BR: 'Brasil', DE: 'Alemania', NL: 'Países Bajos', BE: 'Bélgica', FR: 'Francia', ES: 'España', IT: 'Italia', PT: 'Portugal', GB: 'Reino Unido', IE: 'Irlanda',
  DK: 'Dinamarca', SE: 'Suecia', NO: 'Noruega', FI: 'Finlandia', PL: 'Polonia', CH: 'Suiza', AT: 'Austria', US: 'Estados Unidos', CA: 'Canadá', MX: 'México',
  AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Perú', CN: 'China', HK: 'Hong Kong', JP: 'Japón', KR: 'Corea del Sur', IN: 'India', SG: 'Singapur',
  AE: 'Emiratos Árabes Unidos', SA: 'Arabia Saudita', TR: 'Turquía', IL: 'Israel', AU: 'Australia', ZA: 'Sudáfrica',
}
for (const c of COUNTRIES) if (ES_COUNTRY[c.code]) c.name.es = ES_COUNTRY[c.code]
