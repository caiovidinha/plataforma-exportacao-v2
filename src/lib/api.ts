/**
 * Camada de acesso a dados.
 * Quando featureFlags.useMockData === true, retorna dados do JSON mockado.
 * Quando false, faz chamadas HTTP reais via axios.
 */
import axios from 'axios'
import { featureFlags } from './feature-flags'
import mockData from '@/mock/data.json'
import type {
  UserProfile,
  Product,
  Offer,
  Match,
  Negotiation,
  ExportWorkflow,
  Liquidation,
  ServiceProvider,
  InsurancePolicy,
  MapaNotice,
  PaginatedResponse,
} from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta token em cada request
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
}

// Helper de delay para simular latência no mock
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

// ---- Usuários --------------------------------------------------
export async function getMe(): Promise<UserProfile> {
  if (featureFlags.useMockData) {
    await delay()
    return mockData.user as UserProfile
  }
  const { data } = await api.get<UserProfile>('/users/me')
  return data
}

// ---- Produtos --------------------------------------------------
export async function getProducts(): Promise<PaginatedResponse<Product>> {
  if (featureFlags.useMockData) {
    await delay()
    return { data: mockData.products as Product[], total: mockData.products.length, page: 1, limit: 20, total_pages: 1 }
  }
  const { data } = await api.get<PaginatedResponse<Product>>('/products')
  return data
}

export async function getProduct(id: string): Promise<Product> {
  if (featureFlags.useMockData) {
    await delay()
    const p = mockData.products.find((p) => p.id === id)
    if (!p) throw new Error('Produto não encontrado')
    return p as Product
  }
  const { data } = await api.get<Product>(`/products/${id}`)
  return data
}

// ---- Ofertas (Vitrine) -----------------------------------------
export async function getOffers(): Promise<PaginatedResponse<Offer>> {
  if (featureFlags.useMockData) {
    await delay()
    return { data: mockData.offers as Offer[], total: mockData.offers.length, page: 1, limit: 20, total_pages: 1 }
  }
  const { data } = await api.get<PaginatedResponse<Offer>>('/offers')
  return data
}

export async function getOffer(id: string): Promise<Offer> {
  if (featureFlags.useMockData) {
    await delay()
    const o = mockData.offers.find((o) => o.id === id)
    if (!o) throw new Error('Oferta não encontrada')
    return o as Offer
  }
  const { data } = await api.get<Offer>(`/offers/${id}`)
  return data
}

// ---- Matches ---------------------------------------------------
export async function getMatches(): Promise<Match[]> {
  if (featureFlags.useMockData) {
    await delay()
    return mockData.matches as Match[]
  }
  const { data } = await api.get<Match[]>('/matches')
  return data
}

// ---- Negociações -----------------------------------------------
export async function getNegotiations(): Promise<Negotiation[]> {
  if (featureFlags.useMockData) {
    await delay()
    return mockData.negotiations as Negotiation[]
  }
  const { data } = await api.get<Negotiation[]>('/negotiations')
  return data
}

export async function getNegotiation(id: string): Promise<Negotiation> {
  if (featureFlags.useMockData) {
    await delay()
    const n = mockData.negotiations.find((n) => n.id === id)
    if (!n) throw new Error('Negociação não encontrada')
    return n as Negotiation
  }
  const { data } = await api.get<Negotiation>(`/negotiations/${id}`)
  return data
}

// ---- Workflows -------------------------------------------------
export async function getWorkflows(): Promise<ExportWorkflow[]> {
  if (featureFlags.useMockData) {
    await delay()
    return mockData.workflows as ExportWorkflow[]
  }
  const { data } = await api.get<ExportWorkflow[]>('/workflows')
  return data
}

export async function getWorkflow(id: string): Promise<ExportWorkflow> {
  if (featureFlags.useMockData) {
    await delay()
    const w = mockData.workflows.find((w) => w.id === id)
    if (!w) throw new Error('Workflow não encontrado')
    return w as ExportWorkflow
  }
  const { data } = await api.get<ExportWorkflow>(`/workflows/${id}`)
  return data
}

// ---- Liquidação ------------------------------------------------
export async function getLiquidation(workflowId: string): Promise<Liquidation> {
  if (featureFlags.useMockData) {
    await delay()
    const liq = (mockData.liquidation as Record<string, Liquidation>)[workflowId]
    if (!liq) throw new Error('Liquidação não encontrada')
    return liq
  }
  const { data } = await api.get<Liquidation>(`/liquidation/${workflowId}`)
  return data
}

// ---- Prestadores de Serviço ------------------------------------
export async function getServiceProviders(type?: string): Promise<ServiceProvider[]> {
  if (featureFlags.useMockData) {
    await delay()
    const providers = mockData.service_providers as ServiceProvider[]
    return type ? providers.filter((p) => p.type === type) : providers
  }
  const { data } = await api.get<ServiceProvider[]>('/service-providers', { params: { type } })
  return data
}

// ---- Seguros ---------------------------------------------------
export async function getInsurancePolicies(workflowId: string): Promise<InsurancePolicy[]> {
  if (featureFlags.useMockData) {
    await delay()
    return (mockData.insurance_policies as InsurancePolicy[]).filter(
      (p) => p.workflow_id === workflowId,
    )
  }
  const { data } = await api.get<InsurancePolicy[]>(`/insurance/policies?workflow_id=${workflowId}`)
  return data
}

// ---- MAPA Notices ----------------------------------------------
export async function getMapaNotices(): Promise<MapaNotice[]> {
  if (featureFlags.useMockData) {
    await delay()
    return mockData.mapa_notices as MapaNotice[]
  }
  const { data } = await api.get<MapaNotice[]>('/market-intelligence/mapa-notices')
  return data
}

// ---- Câmbio ----------------------------------------------------
export async function getExchangeRates(): Promise<Record<string, number>> {
  if (featureFlags.useMockData) {
    await delay()
    const { updated_at, ...rates } = mockData.exchange_rates
    return rates
  }
  const { data } = await api.get<Record<string, number>>('/exchange-rates')
  return data
}

export default api
