import { z } from 'zod'
import {
  COMPANY_TYPES,
  CURRENCIES,
  DOCUMENT_STATUSES,
  INCOTERMS,
  INTEGRATION_ENVIRONMENTS,
  INTEGRATION_MODES,
  MEMBER_ROLES,
  PARTNER_TYPES,
  PRICING_MODES,
  PRICING_SERVICES,
  PRODUCT_STATUSES,
  SHIPMENT_DOCUMENT_TYPES,
} from './enums'
import { COUNTRY_CODES, PORT_CODES } from './reference'
import { isValidNcm, onlyDigits } from './validators'

// ---------- Auth ----------
export const passwordSchema = z
  .string()
  .min(10, 'password_too_short')
  .max(128)
  .regex(/[A-Za-z]/, 'password_needs_letter')
  .regex(/\d/, 'password_needs_digit')

export const registerInputSchema = z.object({
  email: z.email().toLowerCase(),
  password: passwordSchema,
  fullName: z.string().trim().min(3).max(160),
  phone: z.string().trim().max(30).optional(),
  locale: z.enum(['pt', 'en', 'es']).default('pt'),
  companyType: z.enum(COMPANY_TYPES),
  /** Nome inicial da empresa (completado no cadastro). */
  companyName: z.string().trim().min(2).max(200),
  country: z.string().refine((c) => COUNTRY_CODES.includes(c), 'invalid_country'),
  acceptTerms: z.literal(true, { error: 'terms_required' }),
})
export type RegisterInput = z.infer<typeof registerInputSchema>

export const loginInputSchema = z.object({ email: z.email().toLowerCase(), password: z.string().min(1).max(128) })
export type LoginInput = z.infer<typeof loginInputSchema>

export const forgotPasswordSchema = z.object({ email: z.email().toLowerCase() })
export const resetPasswordSchema = z.object({ token: z.string().min(20), password: passwordSchema })
export const verifyEmailSchema = z.object({ token: z.string().min(20) })
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema })

export const inviteMemberSchema = z.object({
  email: z.email().toLowerCase(),
  fullName: z.string().trim().min(3).max(160),
  role: z.enum(MEMBER_ROLES).exclude(['OWNER']),
})

// ---------- Onboarding / Compliance ----------
export const reviewDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  reason: z.string().trim().max(2000).optional(),
})
export const documentReviewSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().trim().max(1000).optional(),
})
export const documentUploadFieldsSchema = z.object({
  typeKey: z.string().min(2).max(80),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(500).optional(),
})
export type DocumentStatusValue = (typeof DOCUMENT_STATUSES)[number]

// ---------- Produto ----------
const aflatoxinRow = z.object({ country: z.string().refine((c) => COUNTRY_CODES.includes(c)), ppb: z.number().nonnegative() })
const legalDoc = z.object({
  type: z.string().min(2).max(60),
  name: z.string().min(2).max(160),
  required: z.boolean().default(true),
  authority: z.string().max(160).optional(),
})

export const technicalSheetSchema = z.object({
  organoleptic: z
    .object({
      appearance: z.string().max(400),
      color: z.string().max(200),
      aroma: z.string().max(200),
      format: z.string().max(200),
      texture: z.string().max(200),
      method: z.string().max(300).optional(),
    })
    .partial()
    .optional(),
  physicochemical: z
    .object({
      maxMoisturePct: z.number().nonnegative().max(100),
      maxDefectivePct: z.number().nonnegative().max(100),
      maxBrokenPct: z.number().nonnegative().max(100),
      maxRancidPct: z.number().nonnegative().max(100),
      aflatoxinTolerance: z.array(aflatoxinRow).max(40),
      method: z.string().max(300),
    })
    .partial()
    .optional(),
  nutritional: z
    .object({
      servingG: z.number().positive(),
      kcal: z.number().nonnegative(),
      totalFatG: z.number().nonnegative(),
      saturatedFatG: z.number().nonnegative(),
      carbsG: z.number().nonnegative(),
      fiberG: z.number().nonnegative(),
      proteinG: z.number().nonnegative(),
      sodiumMg: z.number().nonnegative(),
      seleniumMcg: z.number().nonnegative(),
    })
    .partial()
    .optional(),
  legalRequirements: z.array(z.object({ country: z.string(), documents: z.array(legalDoc).max(20) })).max(40).optional(),
  certifications: z.array(z.string()).max(30).optional(),
})
export type TechnicalSheet = z.infer<typeof technicalSheetSchema>

export const productInputSchema = z.object({
  name: z.string().trim().min(3).max(160),
  category: z.string().trim().max(80).default('Castanha-do-Brasil'),
  description: z.string().trim().max(4000).default(''),
  ncm: z.string().refine(isValidNcm, 'invalid_ncm').transform(onlyDigits),
  packaging: z.string().trim().min(2).max(300),
  originPort: z.string().refine((c) => PORT_CODES.includes(c) && c.startsWith('BR'), 'invalid_origin_port'),
  originState: z.string().length(2).optional(),
  harvestYear: z.number().int().min(2000).max(2100),
  /** Preço base por kg em USD, na base FOB. */
  basePriceUsdPerKg: z.number().positive().max(10_000),
  minOrderKg: z.number().positive(),
  availableKg: z.number().positive(),
  leadTimeDays: z.number().int().min(1).max(365),
  incoterms: z.array(z.enum(INCOTERMS)).min(1),
  destinationCountries: z.array(z.string()).max(60).default([]),
  technicalSheet: technicalSheetSchema.default({}),
  imageFileIds: z.array(z.uuid()).max(8).default([]),
  status: z.enum(PRODUCT_STATUSES).default('DRAFT'),
})
export type ProductInput = z.infer<typeof productInputSchema>

export const productListQuerySchema = z.object({
  q: z.string().optional(),
  originPort: z.string().optional(),
  incoterm: z.enum(INCOTERMS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
})

// ---------- Pedido / Embarque ----------
export const createOrderSchema = z.object({
  simulationId: z.uuid(),
  importerNotes: z.string().max(2000).optional(),
  requestedShipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
export const orderDecisionSchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT']),
  reason: z.string().max(1000).optional(),
})
export const shipmentTaskUpdateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'DONE', 'BLOCKED']),
  note: z.string().max(1000).optional(),
})
export const shipmentDocumentUploadFieldsSchema = z.object({
  type: z.enum(SHIPMENT_DOCUMENT_TYPES),
  note: z.string().max(500).optional(),
})
export const shipmentExceptionSchema = z.object({
  stage: z.enum(['NAO_PAGAMENTO', 'MERCADORIA_RECUSADA']),
  reason: z.string().min(5).max(2000),
})

// ---------- Admin: parceiros / integrações / tarifas ----------
export const partnerInputSchema = z.object({
  type: z.enum(PARTNER_TYPES),
  key: z.string().regex(/^[a-z0-9][a-z0-9-]{2,40}$/, 'invalid_key'),
  name: z.string().trim().min(2).max(160),
  contactName: z.string().max(160).optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().max(40).optional(),
  active: z.boolean().default(true),
  notes: z.string().max(2000).optional(),
})
export type PartnerInput = z.infer<typeof partnerInputSchema>

export const integrationInputSchema = z.object({
  mode: z.enum(INTEGRATION_MODES),
  environment: z.enum(INTEGRATION_ENVIRONMENTS).default('SANDBOX'),
  enabled: z.boolean().default(false),
  /** Configuração não secreta (base URL, caminhos, mapeamento de status, e-mail destino...). */
  config: z.record(z.string(), z.unknown()).default({}),
  /** Segredos (API keys, client secret, HMAC secret); gravados criptografados e nunca devolvidos. */
  secrets: z.record(z.string(), z.string()).optional(),
  timeoutMs: z.number().int().min(1000).max(120_000).default(15_000),
  maxAttempts: z.number().int().min(1).max(15).default(6),
  contractVersion: z.string().max(40).optional(),
})
export type IntegrationInput = z.infer<typeof integrationInputSchema>

export const pricingConfigSchema = z.object({
  service: z.enum(PRICING_SERVICES),
  mode: z.enum(PRICING_MODES),
  fallbackToTable: z.boolean().default(true),
})

export const partnerActionSubmitSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'UPDATE_STATUS', 'SEND_QUOTE']),
  /** Tarefa-alvo; por padrão a do link. Só tarefas do tipo do parceiro são aceitas. */
  taskKey: z.string().max(60).optional(),
  taskStatus: z.enum(['IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
  note: z.string().max(2000).optional(),
  quote: z.object({ amount: z.number().nonnegative(), currency: z.enum(CURRENCIES), validUntil: z.string().optional() }).optional(),
  reference: z.string().max(120).optional(),
})

export const idParamSchema = z.object({ id: z.uuid() })
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
