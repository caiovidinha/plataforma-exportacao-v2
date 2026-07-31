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
  Listing,
  Order,
  ExportWorkflow,
  Liquidation,
  InsurancePolicy,
  MapaNotice,
  Exporter,
  PaginatedResponse,
  FreightQuote,
  InsuranceQuote,
  OrderSimulation,
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

// ---- Anúncios (Vitrine) -----------------------------------------
export async function getListings(): Promise<PaginatedResponse<Listing>> {
  if (featureFlags.useMockData) {
    await delay()
    return { data: mockData.listings as Listing[], total: mockData.listings.length, page: 1, limit: 20, total_pages: 1 }
  }
  const { data } = await api.get<PaginatedResponse<Listing>>('/listings')
  return data
}

export async function getListing(id: string): Promise<Listing> {
  if (featureFlags.useMockData) {
    await delay()
    const l = mockData.listings.find((l) => l.id === id)
    if (!l) throw new Error('Anúncio não encontrado')
    return l as Listing
  }
  const { data } = await api.get<Listing>(`/listings/${id}`)
  return data
}

export async function getExporterByCompanyName(companyName: string): Promise<Exporter | null> {
  if (featureFlags.useMockData) {
    await delay()
    const exp = (mockData.exporters as Exporter[]).find((e) => e.company_name === companyName)
    return exp ?? null
  }
  const { data } = await api.get<Exporter[]>('/exporters', { params: { company_name: companyName } })
  return data[0] ?? null
}

export async function getExporter(id: string): Promise<Exporter> {
  if (featureFlags.useMockData) {
    await delay()
    const exp = (mockData.exporters as Exporter[]).find((e) => e.id === id)
    if (!exp) throw new Error('Exportador não encontrado')
    return exp as Exporter
  }
  const { data } = await api.get<Exporter>(`/exporters/${id}`)
  return data
}

// ---- Pedidos -----------------------------------------------------
// Compra a preço fixo: o importador pede, o exportador aceita/recusa.
export async function getOrders(): Promise<Order[]> {
  if (featureFlags.useMockData) {
    await delay()
    return mockData.orders as Order[]
  }
  const { data } = await api.get<Order[]>('/orders')
  return data
}

export async function getOrder(id: string): Promise<Order> {
  if (featureFlags.useMockData) {
    await delay()
    const o = mockData.orders.find((o) => o.id === id)
    if (!o) throw new Error('Pedido não encontrado')
    return o as Order
  }
  const { data } = await api.get<Order>(`/orders/${id}`)
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

export async function getExchangeRatesWithMeta(): Promise<{ rates: Record<string, number>; updated_at: string }> {
  if (featureFlags.useMockData) {
    await delay()
    const { updated_at, ...rates } = mockData.exchange_rates
    return { rates, updated_at }
  }
  const { data } = await api.get<{ rates: Record<string, number>; updated_at: string }>('/exchange-rates')
  return data
}

// ---- Simulação de compra (frete + seguro + câmbio) -------------
// Frete e seguro não são escolhidos pelo comprador: Cia de Navegação e
// Seguradora são parceiros fixos contratados diretamente pela plataforma
// (ver src/lib/partners.ts). O "roster" abaixo é só o critério interno
// usado para designar automaticamente qual parceiro atende cada pedido
// (determinístico, sem Math.random) - nunca é exposto como opção de escolha.
export async function simulateOrder(listing: Listing, quantityKg: number): Promise<OrderSimulation> {
  await delay(500)

  const rates = await getExchangeRates()
  const exchangeRate = rates.USD ?? 5.7
  const productUsd = quantityKg * listing.price_per_kg_usd

  // Variação determinística por anúncio, sem aleatoriedade real
  const hash = Array.from(listing.id).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const variance = (hash % 10) / 100

  const carrierRoster = [
    { name: 'MSC', ratePerKg: 0.19, speedDelta: -3 },
    { name: 'Maersk', ratePerKg: 0.23, speedDelta: -8 },
    { name: 'Hapag-Lloyd', ratePerKg: 0.16, speedDelta: 5 },
  ]
  const carrier = carrierRoster[hash % carrierRoster.length]
  const freight: FreightQuote = {
    id: `fq_${listing.id}`,
    carrier_name: carrier.name,
    transport_mode: 'MARITIMO',
    transit_days: Math.max(14, listing.delivery_days + carrier.speedDelta),
    price_usd: Math.round(quantityKg * (carrier.ratePerKg + variance)),
  }

  const insurerRoster: { name: string; type: InsuranceQuote['type']; rate: number }[] = [
    { name: 'Seguradora Atlântica Cargas', type: 'MERCADORIA', rate: 0.004 },
    { name: 'Porto Seguro Comércio Exterior', type: 'MERCADORIA', rate: 0.0055 },
  ]
  const insurer = insurerRoster[hash % insurerRoster.length]
  const coverageUsd = Math.round(productUsd * 1.1)
  const insurance: InsuranceQuote = {
    id: `iq_${listing.id}`,
    insurer_name: insurer.name,
    type: insurer.type,
    coverage_usd: coverageUsd,
    premium_brl: Math.round(coverageUsd * exchangeRate * insurer.rate),
  }

  return {
    listing_id: listing.id,
    quantity_kg: quantityKg,
    product_usd: productUsd,
    freight,
    insurance,
    exchange_rate: exchangeRate,
  }
}

export default api
