# API Structure — Plataforma de Exportação v2

> Base URL: `/api/v1`  
> Autenticação: Bearer JWT em todos os endpoints autenticados.  
> Convenção: snake_case nos payloads JSON, PascalCase nas interfaces TypeScript.

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Usuários & Perfis](#2-usuários--perfis)
3. [Produtos & Ficha Técnica](#3-produtos--ficha-técnica)
4. [Vitrine & Matchmaking](#4-vitrine--matchmaking)
5. [Negociação & Contratos](#5-negociação--contratos)
6. [Workflow Logístico](#6-workflow-logístico)
7. [Liquidação (FOB & CIF)](#7-liquidação-fob--cif)
8. [Marketplace de Serviços](#8-marketplace-de-serviços)
9. [Seguros](#9-seguros)
10. [Documentos & Assinatura Digital](#10-documentos--assinatura-digital)
11. [Painel de Inteligência de Mercado](#11-painel-de-inteligência-de-mercado)
12. [CRUD de Entidades](#12-crud-de-entidades)
13. [Integrações Externas](#13-integrações-externas)

---

## 1. Autenticação

### `POST /auth/login`
```json
// Request
{ "email": "string", "password": "string" }

// Response 200
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 3600,
  "user": { "id": "uuid", "name": "string", "role": "EXPORTADOR | IMPORTADOR | ADMIN", "mapa_registered": true }
}
```

### `POST /auth/refresh`
```json
// Request
{ "refresh_token": "string" }
// Response 200 → mesmo schema do login
```

### `POST /auth/register`
```json
// Request
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "EXPORTADOR | IMPORTADOR",
  "cnpj": "string",
  "company_name": "string"
}
```

---

## 2. Usuários & Perfis

### `GET /users/me`
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'EXPORTADOR' | 'IMPORTADOR' | 'ADMIN';
  company_name: string;
  cnpj: string;
  country: string;
  mapa_registered: boolean;        // Flag de cadastro no MAPA
  mapa_registration_code?: string; // Código de habilitação MAPA
  created_at: string;
  updated_at: string;
}
```

### `PUT /users/me`
Atualiza perfil do usuário logado.

### `PUT /users/me/mapa-registration`
```json
// Request
{ "mapa_registration_code": "string", "mapa_document_url": "string" }
```

---

## 3. Produtos & Ficha Técnica

### Interfaces TypeScript

```typescript
interface ProductOrganoleptic {
  appearance: string;       // aspecto físico
  color: string;
  aroma: string;
  format: string;
  texture: string;
  analysis_method: string;
}

interface ProductPhysicochemical {
  aflatoxin_tolerance_by_country: AflatoxinTolerance[];
  max_defective_units_pct: number;   // % máx castanhas com defeito
  max_broken_units_pct: number;      // % máx quebradas
  max_rancid_units_pct: number;      // % máx rançosas
  analysis_method: string;
}

interface AflatoxinTolerance {
  country_code: string;   // ISO 3166-1 alpha-2
  country_name: string;
  tolerance_ppb: number;  // partes por bilhão
}

interface NutritionalInfo {
  serving_size_g: number;
  calories_kcal: number;
  total_fat_g: number;
  saturated_fat_g: number;
  sodium_mg: number;
  total_carbs_g: number;
  dietary_fiber_g: number;
  proteins_g: number;
  selenium_mcg?: number;
}

interface LegalRequirement {
  country_code: string;
  country_name: string;
  documents: LegalDocument[];
}

interface LegalDocument {
  type: 'FITOSSANITARIO' | 'ORIGEM' | 'HIGIENICO_SANITARIO' | 'MERCADO' | 'OUTROS';
  name: string;
  required: boolean;
  issuing_authority: string;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  packaging: string;
  expiration_date?: string;
  transport_modes: ('MARITIMO' | 'AEREO')[];
  organoleptical: ProductOrganoleptic;
  physicochemical: ProductPhysicochemical;
  nutritional: NutritionalInfo;
  legal_requirements: LegalRequirement[];
  images: string[];
  certifications: string[];
  created_by: string;   // exportador user id
  created_at: string;
  updated_at: string;
}
```

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/products` | Lista produtos com filtros |
| `GET` | `/products/:id` | Detalhe + ficha técnica |
| `POST` | `/products` | Criar produto (Exportador) |
| `PUT` | `/products/:id` | Atualizar produto |
| `DELETE` | `/products/:id` | Remover produto |
| `GET` | `/products/:id/legal-requirements/:country_code` | Exigências legais por país |

**Filtros `GET /products`:**
```
?category=&country_destination=&min_quantity=&max_price=&transport_mode=&harvest_year=&page=&limit=
```

---

## 4. Vitrine & Matchmaking

### Interfaces

```typescript
interface Offer {
  id: string;
  product: Pick<Product, 'id' | 'name' | 'description' | 'images' | 'packaging'>;
  exporter: OfferParty;
  available_quantity_kg: number;
  price_per_kg_usd: number;
  incoterm: 'FOB' | 'CIF';
  origin_port: string;
  destination_ports: string[];           // portos que o exportador atende
  delivery_days: number;
  harvest_year: number;
  sale_modality: 'SPOT' | 'CONTRATO_LONGO_PRAZO';
  status: 'ATIVA' | 'NEGOCIANDO' | 'VENDIDA' | 'EXPIRADA';
  created_at: string;
  expires_at: string;
}

interface OfferParty {
  id: string;
  company_name: string;
  country: string;
  rating: number;
  mapa_registered: boolean;
}

interface Match {
  id: string;
  offer: Offer;
  importer: OfferParty;
  status: 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CONTRATADO';
  created_at: string;
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/offers` | Vitrine pública com filtros |
| `GET` | `/offers/:id` | Detalhe da oferta |
| `POST` | `/offers` | Criar oferta (Exportador) |
| `PUT` | `/offers/:id` | Atualizar oferta |
| `DELETE` | `/offers/:id` | Remover oferta |
| `POST` | `/offers/:id/interest` | Importador demonstra interesse → cria Match |
| `GET` | `/matches` | Lista matches do usuário |
| `PUT` | `/matches/:id/status` | Aceitar/recusar match |

---

## 5. Negociação & Contratos

### Interfaces

```typescript
interface NegotiationMessage {
  id: string;
  negotiation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface NegotiationDeal {
  product_id: string;
  product_name: string;
  quantity_kg: number;
  price_per_kg_usd: number;
  total_usd: number;
  payment_conditions: string;    // Ex: "30% adiantado, 70% contra BL"
  delivery_days: number;
  delivery_deadline: string;
  transport_mode: 'MARITIMO' | 'AEREO';
  incoterm: 'FOB' | 'CIF';
  origin_port: string;
  destination_port: string;
}

interface Negotiation {
  id: string;
  match_id: string;
  exporter: OfferParty;
  importer: OfferParty;
  deal: NegotiationDeal;
  status: 'ABERTA' | 'ACORDO_PENDENTE' | 'ACORDO_FECHADO' | 'CANCELADA';
  messages: NegotiationMessage[];
  created_at: string;
  agreed_at?: string;
}

interface Contract {
  id: string;
  negotiation_id: string;
  type: 'PRINCIPAL' | 'CAMBIO' | 'DESPACHANTE' | 'TERMINAL' | 'TRANSPORTADORA' | 'LABORATORIO' | 'SEGURO';
  pdf_url: string;
  status: 'PENDENTE_ASSINATURA' | 'ASSINADO' | 'CANCELADO';
  signatories: ContractSignatory[];
  created_at: string;
  signed_at?: string;
}

interface ContractSignatory {
  user_id: string;
  name: string;
  role: string;
  signed: boolean;
  signed_at?: string;
  govbr_transaction_id?: string;
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/negotiations` | Lista negociações do usuário |
| `GET` | `/negotiations/:id` | Detalhe + mensagens |
| `POST` | `/negotiations/:id/messages` | Enviar mensagem |
| `PUT` | `/negotiations/:id/deal` | Atualizar dados do painel de fechamento |
| `POST` | `/negotiations/:id/close` | Fechar acordo → gera contrato |
| `GET` | `/contracts` | Lista contratos |
| `GET` | `/contracts/:id` | Detalhe do contrato |
| `POST` | `/contracts/:id/sign` | Acionar assinatura Gov.br |
| `GET` | `/contracts/:id/sign/status` | Status assinatura Gov.br |

---

## 6. Workflow Logístico

### Interfaces

```typescript
type WorkflowStepStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO' | 'BLOQUEADO';

interface WorkflowStep {
  id: string;
  order: number;
  code: WorkflowStepCode;
  title: string;
  description: string;
  status: WorkflowStepStatus;
  responsible_party: string;
  planned_date: string;
  actual_date?: string;
  documents: WorkflowDocument[];
  notes?: string;
  external_ref?: string;   // Ex: DU-E number, BL number
  blockers?: string[];
}

type WorkflowStepCode =
  | 'ASSINATURA_CONTRATOS'
  | 'EMISSAO_NF_ARMAZENAGEM'
  | 'ENTRADA_REDEX'
  | 'TERMINAL_PESAGEM_ESTUFAGEM'
  | 'FISCALIZACAO_MAPA'
  | 'CERTIFICADO_FITOSSANITARIO'
  | 'ENTRADA_SISCOMEX_DUE'
  | 'EMBARQUE_NAVIO_BL'
  | 'CHEGADA_PORTO_DESTINO';

interface WorkflowDocument {
  id: string;
  type: 'NF' | 'INVOICE' | 'PACKING_LIST' | 'CERT_ORIGEM' | 'CERT_FITOSSANITARIO' | 'CERT_HIGIENICO' | 'BL' | 'DUE' | 'LAUDO_LAB' | 'SWIFT' | 'OUTROS';
  name: string;
  status: 'PENDENTE' | 'EMITIDO' | 'ASSINADO' | 'APROVADO' | 'REJEITADO';
  url?: string;
  emitted_by?: string;
  emitted_at?: string;
}

interface ExportWorkflow {
  id: string;
  contract_id: string;
  negotiation: Pick<NegotiationDeal, 'product_name' | 'quantity_kg' | 'incoterm' | 'origin_port' | 'destination_port'>;
  exporter: OfferParty;
  importer: OfferParty;
  steps: WorkflowStep[];
  current_step_code: WorkflowStepCode;
  incoterm: 'FOB' | 'CIF';
  overall_status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO' | 'CANCELADO';
  created_at: string;
  estimated_completion: string;
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/workflows` | Lista workflows do usuário |
| `GET` | `/workflows/:id` | Detalhe completo com etapas |
| `PUT` | `/workflows/:id/steps/:stepId` | Atualizar status/datas de uma etapa |
| `POST` | `/workflows/:id/steps/:stepId/documents` | Anexar documento a etapa |
| `GET` | `/workflows/:id/steps/:stepId/documents/:docId` | Download documento |
| `POST` | `/workflows/:id/siscomex-sync` | Sincronizar status com SISCOMEX |

---

## 7. Liquidação (FOB & CIF)

### Interfaces

```typescript
interface LiquidationFOB {
  workflow_id: string;
  incoterm: 'FOB';
  payment_status: 'AGUARDANDO_SWIFT' | 'SWIFT_RECEBIDO' | 'BL_LIBERADO' | 'CONCLUIDO';
  swift_document_url?: string;
  swift_received_at?: string;
  bl_release_authorized_by?: string;
  bl_release_authorized_at?: string;
  exchange_broker_id: string;
  exchange_rate: number;
  amount_usd: number;
  amount_brl: number;
}

interface LiquidationCIF {
  workflow_id: string;
  incoterm: 'CIF';
  payment_status: 'AGUARDANDO_CHEGADA' | 'NAVIO_CHEGOU' | 'DOCS_ENVIADOS_IMPORTADOR' | 'AGUARDANDO_FISCALIZACAO_MAPA_DESTINO' | 'ANALISE_APROVADA' | 'AGUARDANDO_SWIFT' | 'SWIFT_RECEBIDO' | 'CONCLUIDO';
  arrival_date?: string;
  destination_mapa_inspection_date?: string;
  aflatoxin_result_at_destination?: 'APROVADO' | 'REPROVADO';
  swift_document_url?: string;
  swift_received_at?: string;
  exchange_settlement_date?: string;  // D+2 após swift
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/liquidation/:workflowId` | Status liquidação (FOB ou CIF) |
| `POST` | `/liquidation/:workflowId/swift` | Upload do SWIFT |
| `POST` | `/liquidation/:workflowId/authorize-bl` | (FOB) Autorizar BL original |
| `POST` | `/liquidation/:workflowId/send-docs-to-importer` | (CIF) Enviar docs ao importador |
| `PUT` | `/liquidation/:workflowId/mapa-destination-result` | (CIF) Registrar resultado análise |

---

## 8. Marketplace de Serviços

### Interfaces

```typescript
interface ServiceProvider {
  id: string;
  type: ServiceProviderType;
  company_name: string;
  cnpj: string;
  country: string;
  city: string;
  ports_covered?: string[];           // Companhias de Navegação / Terminais
  coverage_area?: string;             // Transportadoras
  currency_pairs?: string[];          // Corretoras: ['USD/BRL', 'EUR/BRL']
  exchange_rate_usd?: number;         // Corretoras: cotação atual
  fixed_fee_brl?: number;             // Despachantes (tabelado)
  mapa_accredited?: boolean;          // Laboratórios
  rating: number;
  reviews_count: number;
  active: boolean;
}

type ServiceProviderType =
  | 'SEGURADORA'
  | 'TRANSPORTADORA'
  | 'COMPANHIA_NAVEGACAO'
  | 'DESPACHANTE'
  | 'CORRETORA'
  | 'TERMINAL_ALFANDEGARIO'
  | 'CERTIFICADORA'
  | 'LABORATORIO';

interface ServiceContract {
  id: string;
  workflow_id: string;
  provider_id: string;
  provider: ServiceProvider;
  type: ServiceProviderType;
  status: 'PENDENTE' | 'CONTRATADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  value_brl: number;
  signed_at?: string;
  contract_url?: string;
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/service-providers` | Lista prestadores (filtro por type, port, city) |
| `GET` | `/service-providers/:id` | Detalhe do prestador |
| `POST` | `/service-contracts` | Contratar prestador |
| `GET` | `/service-contracts?workflow_id=` | Contratos de serviço de um workflow |
| `GET` | `/exchange-rates` | Cotações de câmbio atuais |

---

## 9. Seguros

### Interfaces

```typescript
type InsuranceType = 'SAFRA' | 'MERCADORIA' | 'PAGAMENTO_EXPORTADOR' | 'RECEBIMENTO_IMPORTADOR';

interface InsurancePolicy {
  id: string;
  workflow_id: string;
  type: InsuranceType;
  insurer_id: string;
  insurer_name: string;
  coverage_usd: number;
  premium_brl: number;
  status: 'COTADO' | 'CONTRATADO' | 'ATIVO' | 'SINISTRO' | 'ENCERRADO';
  valid_from: string;
  valid_until: string;
  policy_document_url?: string;
}

interface InsuranceQuote {
  insurer_id: string;
  insurer_name: string;
  type: InsuranceType;
  coverage_usd: number;
  premium_brl: number;
  valid_until: string;
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/insurance/quote` | Solicitar cotação de seguro |
| `POST` | `/insurance/policies` | Contratar apólice |
| `GET` | `/insurance/policies?workflow_id=` | Apólices do workflow |
| `GET` | `/insurance/policies/:id` | Detalhe da apólice |

---

## 10. Documentos & Assinatura Digital

### Interfaces

```typescript
interface Document {
  id: string;
  workflow_id: string;
  type: WorkflowDocument['type'];
  name: string;
  html_template?: string;
  pdf_url?: string;
  status: 'RASCUNHO' | 'PENDENTE_ASSINATURA' | 'ASSINADO' | 'ENVIADO';
  signatories: ContractSignatory[];
  created_at: string;
}

interface GovBrSignatureRequest {
  document_id: string;
  signer_cpf: string;
  callback_url: string;
}

interface GovBrSignatureStatus {
  transaction_id: string;
  status: 'PENDENTE' | 'ASSINADO' | 'RECUSADO' | 'EXPIRADO';
  signed_at?: string;
  signature_url?: string;
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/documents?workflow_id=` | Lista documentos do workflow |
| `POST` | `/documents` | Criar documento (Invoice, Packing List) |
| `GET` | `/documents/:id` | Detalhe + PDF URL |
| `POST` | `/documents/:id/sign` | Iniciar assinatura Gov.br |
| `GET` | `/documents/:id/sign/status` | Callback status Gov.br |
| `POST` | `/documents/:id/send` | Enviar documento ao destinatário |

---

## 11. Painel de Inteligência de Mercado

```typescript
interface MarketIntelligence {
  apex_study_url: string;       // URL do iFrame Apex-Brasil
  cna_study_url: string;        // URL do iFrame CNA
  proex_url: string;            // URL BNDES Proex
  mapa_notices: MapaNotice[];
}

interface MapaNotice {
  id: string;
  title: string;
  date: string;
  url: string;
  category: 'NORMATIVA' | 'INFORMATIVO' | 'ALERTA';
}
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/market-intelligence/config` | URLs e configurações dos iframes |
| `GET` | `/market-intelligence/mapa-notices` | Informativos MAPA (cache 1h) |
| `GET` | `/market-intelligence/proex-programs` | Programas Proex disponíveis |

---

## 12. CRUD de Entidades

Cada entidade abaixo segue o padrão REST completo:

```
GET    /admin/{entity}          → Lista paginada
GET    /admin/{entity}/:id      → Detalhe
POST   /admin/{entity}          → Criar
PUT    /admin/{entity}/:id      → Atualizar
DELETE /admin/{entity}/:id      → Remover (soft delete)
```

| Entidade (`{entity}`) | Campos Principais |
|------------------------|-------------------|
| `exporters` | cnpj, company_name, country, mapa_registered, mapa_registration_code |
| `importers` | cnpj, company_name, country, import_license |
| `insurers` | cnpj, company_name, risk_analysis_methods[], coverage_types[] |
| `transporters` | cnpj, company_name, coverage_locations[], vehicle_types[] |
| `shipping-companies` | cnpj, company_name, origin_ports[], destination_ports[] |
| `customs-brokers` | cnpj, company_name, siscomex_accreditation, fixed_fee_brl |
| `exchange-brokers` | cnpj, company_name, currency_pairs[], bacen_authorization |
| `customs-terminals` | cnpj, company_name, location, port_code, services[] |
| `certifiers` | cnpj, company_name, certifications_issued[], accreditations[] |
| `laboratories` | cnpj, company_name, location, mapa_accredited, tests_performed[] |
| `products` | (ver seção 3) |

---

## 13. Integrações Externas

### SISCOMEX

```typescript
// GET /integrations/siscomex/status/:due_number
interface SiscomexStatus {
  due_number: string;
  status: 'REGISTRADA' | 'CONFERIDA' | 'LIBERADA' | 'EMBARCADA' | 'AVERBADA';
  last_update: string;
  channel: 'VERDE' | 'AMARELO' | 'VERMELHO' | 'CINZA';
}
```

### SIGVIG (MAPA)
```typescript
// GET /integrations/sigvig/phytosanitary/:certificate_number
interface PhytosanitaryCertificate {
  certificate_number: string;
  product: string;
  origin_country: string;
  destination_country: string;
  issued_at: string;
  valid_until: string;
  status: 'VALIDO' | 'EXPIRADO' | 'CANCELADO';
}
```

### SWIFT (Pagamentos)
```typescript
// POST /integrations/swift/verify
// Request: { swift_code: string, expected_amount_usd: number }
// Response:
interface SwiftVerification {
  swift_code: string;
  sender_bank: string;
  sender_country: string;
  amount_usd: number;
  received_at: string;
  verified: boolean;
}
```

### Gov.br (Assinatura)
```typescript
// Callback webhook: POST /webhooks/govbr/signature
interface GovBrWebhookPayload {
  transaction_id: string;
  signer_cpf: string;
  document_id: string;
  status: 'ASSINADO' | 'RECUSADO';
  signed_at?: string;
  pfx_signature_url?: string;
}
```

---

## Códigos de Erro Padrão

| HTTP | Código | Descrição |
|------|--------|-----------|
| 400 | `VALIDATION_ERROR` | Dados inválidos no request |
| 401 | `UNAUTHORIZED` | Token ausente ou expirado |
| 403 | `FORBIDDEN` | Sem permissão para o recurso |
| 403 | `MAPA_NOT_REGISTERED` | Requer cadastro no MAPA para esta ação |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `CONFLICT` | Estado incompatível (ex: contrato já assinado) |
| 422 | `BUSINESS_RULE_ERROR` | Regra de negócio violada |
| 503 | `INTEGRATION_UNAVAILABLE` | Integração externa indisponível |
