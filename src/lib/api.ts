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
  Order,
  OrderStatus,
  Incoterm,
  SaleModality,
  ExportWorkflow,
  Liquidation,
  ServiceProvider,
  InsurancePolicy,
  MapaNotice,
  Exporter,
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

export interface CreateOfferInput {
  product_id: string
  available_quantity_kg: number
  price_per_kg_usd: number
  incoterm: Incoterm
  origin_port: string
  destination_ports: string[]
  delivery_days: number
  harvest_year: number
  sale_modality: SaleModality
}

/** Exportador publica uma nova oferta de produto na vitrine. */
export async function createOffer(input: CreateOfferInput): Promise<Offer> {
  if (featureFlags.useMockData) {
    await delay()
    const product = (mockData.products as Product[]).find((p) => p.id === input.product_id)
    const user = mockData.user as UserProfile
    return {
      id: `off_${Date.now()}`,
      product: {
        id: input.product_id,
        name: product?.name ?? 'Produto',
        description: product?.description ?? '',
        images: product?.images ?? [],
        packaging: product?.packaging ?? '',
      },
      exporter: {
        id: user.id,
        company_name: user.company_name,
        country: user.country,
        rating: 5,
        mapa_registered: user.mapa_registered,
      },
      available_quantity_kg: input.available_quantity_kg,
      price_per_kg_usd: input.price_per_kg_usd,
      incoterm: input.incoterm,
      origin_port: input.origin_port,
      destination_ports: input.destination_ports,
      delivery_days: input.delivery_days,
      harvest_year: input.harvest_year,
      sale_modality: input.sale_modality,
      status: 'ATIVA',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(),
    }
  }
  const { data } = await api.post<Offer>('/offers', input)
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

// ---- Matches ---------------------------------------------------
export async function getMatches(): Promise<Match[]> {
  if (featureFlags.useMockData) {
    await delay()
    return mockData.matches as Match[]
  }
  const { data } = await api.get<Match[]>('/matches')
  return data
}

// ---- Pedidos (Orders) ------------------------------------------
export async function getOrders(): Promise<Order[]> {
  if (featureFlags.useMockData) {
    await delay()
    return (mockData.orders ?? []) as Order[]
  }
  const { data } = await api.get<Order[]>('/orders')
  return data
}

export async function getOrder(id: string): Promise<Order> {
  if (featureFlags.useMockData) {
    await delay()
    const o = (mockData.orders as Order[]).find((o) => o.id === id)
    if (!o) throw new Error('Pedido não encontrado')
    return o
  }
  const { data } = await api.get<Order>(`/orders/${id}`)
  return data
}

/** Payload mínimo para criar um pedido a partir de uma oferta. */
export interface CreateOrderInput {
  offer_id: string
  quantity_kg: number
}

/**
 * Cria um pedido a preço fixo. No backend real, dispara o evento
 * `order.created` (Kafka) e aguarda a confirmação do exportador.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (featureFlags.useMockData) {
    await delay()
    const offer = (mockData.offers as Offer[]).find((o) => o.id === input.offer_id)
    if (!offer) throw new Error('Oferta não encontrada')
    const now = new Date().toISOString()
    return {
      id: `ord_${Date.now()}`,
      offer_id: offer.id,
      product_id: offer.product.id,
      product_name: offer.product.name,
      exporter: offer.exporter,
      importer: {
        id: (mockData.user as UserProfile).id,
        company_name: (mockData.user as UserProfile).company_name,
        country: (mockData.user as UserProfile).country,
        rating: 5,
        mapa_registered: (mockData.user as UserProfile).mapa_registered,
      },
      quantity_kg: input.quantity_kg,
      price_per_kg_usd: offer.price_per_kg_usd,
      total_usd: +(offer.price_per_kg_usd * input.quantity_kg).toFixed(2),
      incoterm: offer.incoterm,
      transport_mode: 'MARITIMO',
      origin_port: offer.origin_port,
      destination_port: offer.destination_ports[0] ?? '',
      payment_conditions: '30% adiantado, 70% contra apresentação do BL',
      delivery_days: offer.delivery_days,
      status: 'AGUARDANDO_CONFIRMACAO',
      created_at: now,
    }
  }
  const { data } = await api.post<Order>('/orders', input)
  return data
}

/**
 * Exportador aceita o pedido → backend emite `order.confirmed` e o
 * workflow-service cria o ExportWorkflow (`workflow.started`).
 */
export async function confirmOrder(id: string): Promise<Order> {
  if (featureFlags.useMockData) {
    await delay()
    const o = await getOrder(id)
    return { ...o, status: 'CONFIRMADO' as OrderStatus, confirmed_at: new Date().toISOString() }
  }
  const { data } = await api.post<Order>(`/orders/${id}/confirm`)
  return data
}

/** Exportador recusa o pedido → backend emite `order.rejected`. */
export async function rejectOrder(id: string, reason?: string): Promise<Order> {
  if (featureFlags.useMockData) {
    await delay()
    const o = await getOrder(id)
    return { ...o, status: 'RECUSADO' as OrderStatus, rejection_reason: reason }
  }
  const { data } = await api.post<Order>(`/orders/${id}/reject`, { reason })
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
