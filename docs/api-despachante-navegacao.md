# Especificação de Integração — API do Despachante Aduaneiro & Companhia de Navegação

> Documento de requisitos técnicos do que a **plataforma** precisa consumir das empresas parceiras
> de **despacho aduaneiro** e **navegação/frete marítimo** para orquestrar o workflow de exportação.
>
> Público-alvo: equipe de integração do parceiro (despachante/armador) e time de backend da plataforma.
> Versão do documento: **1.0** · Última atualização: **2026-07-06**

---

## 1. Visão geral & contexto

A plataforma é um marketplace onde **exportadores** publicam produtos e **importadores** fazem pedidos a
preço fixo. Ao o exportador confirmar um pedido, a plataforma inicia um **workflow de exportação** de
9 etapas. Duas dessas frentes dependem de sistemas externos:

- **Despachante Aduaneiro** — documentação de exportação (Invoice, Packing List, Certificado de Origem),
  fiscalização MAPA, emissão da **DU-E** e acompanhamento do **SISCOMEX** (canal/parametrização).
- **Companhia de Navegação (armador)** — **booking** de praça, alocação/liberação de contêiner,
  emissão do **Draft BL** e do **BL original**, e **rastreamento** do contêiner até o destino.

O backend da plataforma é assíncrono (microsserviços orquestrados por **Kafka**). Cada evento recebido
dessas APIs (via **webhook** de preferência, ou **polling** como fallback) é normalizado e publicado
como um evento interno que faz o workflow avançar. Portanto, **o requisito central é: para cada mudança
de estado relevante, a plataforma precisa ser notificada de forma confiável e idempotente.**

### 1.1 Mapa etapa do workflow → sistema externo

| # | Etapa (`WorkflowStepCode`)      | Despachante | Navegação | Artefatos-chave |
|---|----------------------------------|:-----------:|:---------:|-----------------|
| 1 | `ASSINATURA_CONTRATOS`           | —           | —         | (interno da plataforma) |
| 2 | `EMISSAO_NF_ARMAZENAGEM`         | —           | —         | NF-e (interno) |
| 3 | `ENTRADA_REDEX`                  | ✅          | —         | Invoice, Packing List, Cert. Origem |
| 4 | `TERMINAL_PESAGEM_ESTUFAGEM`     | ✅ (coord.) | ✅        | Liberação/alocação de contêiner, lacre |
| 5 | `FISCALIZACAO_MAPA`             | ✅ (coord.) | —         | Laudo laboratorial (aflatoxina) |
| 6 | `CERTIFICADO_FITOSSANITARIO`     | ✅ (coord.) | —         | Certificado Fitossanitário (MAPA) |
| 7 | `ENTRADA_SISCOMEX_DUE`           | ✅          | —         | **DU-E**, canal SISCOMEX |
| 8 | `EMBARQUE_NAVIO_BL`              | —           | ✅        | **Draft BL**, **BL original**, saída |
| 9 | `CHEGADA_PORTO_DESTINO`          | —           | ✅        | ETA/chegada, liberação no destino |

> Referência de tipos internos (o backend mapeia os payloads para estes): `WorkflowStep`,
> `WorkflowDocument`, `DocumentType`, `SiscomexStatus`, `Order` (ver `src/types/index.ts`).

---

## 2. Requisitos comuns (ambas as APIs)

### 2.1 Ambientes
- **Sandbox** obrigatório, com dados fictícios e sem custo, para homologação.
- **Produção** com credenciais separadas.
- URLs base versionadas, ex.: `https://api.parceiro.com/v1`.

### 2.2 Autenticação
Aceitamos qualquer um dos padrões abaixo (em ordem de preferência):
1. **OAuth 2.0 Client Credentials** (`grant_type=client_credentials`), com `access_token` de curta duração + refresh.
2. **API Key** por header (`Authorization: Bearer <key>` ou `X-API-Key`), com possibilidade de rotação.
3. **mTLS** (certificado cliente) para operações sensíveis (emissão de DU-E, liberação de BL).

Requerido: escopos/permissões separados para **leitura** (tracking, status) e **escrita** (emitir DU-E, liberar BL).

### 2.3 Convenções de API
- **REST/JSON** (UTF-8). Datas em **ISO 8601 UTC** (`2026-07-06T14:30:00Z`).
- **Versionamento** no path (`/v1`) e política de depreciação com aviso ≥ 90 dias.
- **Idempotência**: aceitar header `Idempotency-Key` em todas as operações de escrita (POST), garantindo
  que reenvios (retries) não dupliquem DU-E, booking, etc.
- **Paginação** por cursor (`?cursor=...&limit=...`) nas listagens.
- **Rate limits** documentados por endpoint, com headers `X-RateLimit-*` e resposta `429` com `Retry-After`.
- **Correlação**: aceitar e ecoar um `X-Correlation-Id` nosso em requests e webhooks (para rastreabilidade fim-a-fim).

### 2.4 Formato de erro (padrão esperado)
```json
{
  "error": {
    "code": "DUE_VALIDATION_FAILED",
    "message": "NCM inválido para o produto informado",
    "details": [{ "field": "items[0].ncm", "issue": "not_found" }],
    "request_id": "req_abc123"
  }
}
```
- HTTP status coerente (`400/401/403/404/409/422/429/5xx`).
- Erros de negócio com `code` estável (string), não apenas mensagem livre.

### 2.5 Webhooks (mecanismo preferido de notificação)
Para evitar polling agressivo, o parceiro deve **empurrar** eventos para um endpoint nosso.

- **Registro**: permitir cadastrar 1+ URLs de callback por ambiente + um **secret** compartilhado.
- **Assinatura**: assinar o corpo (HMAC-SHA256) em header `X-Signature`, para validarmos autenticidade.
- **Entrega confiável**: retentativas com backoff em caso de não-2xx, por ≥ 24h; **at-least-once**
  (por isso exigimos `event_id` para deduplicação do nosso lado).
- **Envelope padrão**:
```json
{
  "event_id": "evt_01H...",
  "event_type": "shipping.container.gate_in",
  "occurred_at": "2026-07-06T14:30:00Z",
  "resource_id": "BR-EXP-2026-000123",
  "data": { "...": "..." }
}
```
- **Polling de fallback**: para cada recurso, um `GET .../status` idempotente que retorne o estado atual
  e um `updated_at`, caso um webhook se perca.

### 2.6 Ponte com o barramento de eventos (Kafka) da plataforma
Cada webhook/estado externo é normalizado pelo `workflow-service` e republicado internamente:

| Origem externa                              | Evento Kafka interno            | Efeito no workflow |
|---------------------------------------------|---------------------------------|--------------------|
| Despachante: DU-E registrada                | `customs.due.registered`        | Avança etapa 7 |
| Despachante: mudança de canal SISCOMEX      | `customs.status.changed`        | Atualiza `SiscomexStatus` |
| Despachante: documento emitido/assinado     | `document.emitted` / `.signed`  | Atualiza `WorkflowDocument` |
| Navegação: booking confirmado               | `shipping.booked`               | Habilita etapa 4 |
| Navegação: evento de contêiner              | `shipping.container.event`      | Atualiza etapa 4/8 |
| Navegação: Draft BL emitido                 | `shipping.bl.drafted`           | Avança etapa 8 |
| Navegação: BL original liberado             | `shipping.bl.released`          | Libera liquidação (FOB) |
| Navegação: navio chegou ao destino          | `shipping.arrived`              | Avança etapa 9 |

### 2.7 SLA & operação
- Disponibilidade alvo ≥ **99,5%**; janela de manutenção comunicada.
- Latência de webhook (evento → entrega) alvo ≤ **5 min**.
- Suporte técnico com canal e SLA de resposta definidos.
- Página/health-check público (`GET /health`).

---

## 3. Despachante Aduaneiro — endpoints necessários

### 3.1 Abertura do processo de exportação
Cria o "processo" no sistema do despachante a partir do pedido confirmado na plataforma.

`POST /v1/export-processes`
```json
{
  "external_ref": "ord_1042",                     // nosso Order.id (idempotência)
  "exporter": { "cnpj": "12.345.678/0001-90", "name": "Castanheira Export Ltda." },
  "importer": { "tax_id": "DE123456789", "name": "NaturKern GmbH", "country": "DE" },
  "incoterm": "FOB",
  "origin_port": "BRBEL",                          // UN/LOCODE
  "destination_port": "DEHAM",
  "goods": [
    { "ncm": "0801.22.00", "description": "Castanha-do-Brasil sem casca",
      "quantity_kg": 15000, "unit_price_usd": 4.85, "total_usd": 72750 }
  ],
  "redex": { "required": true }
}
```
Retorno: `process_id`, `status`, `created_at`. Deve ser **idempotente** por `external_ref`.

### 3.2 Documentos (Invoice, Packing List, Certificado de Origem)
- `POST /v1/export-processes/{id}/documents` — enviar/gerar documento (multipart ou base64 + metadados
  `type` ∈ `INVOICE | PACKING_LIST | CERT_ORIGEM`).
- `GET /v1/export-processes/{id}/documents` — listar com `status` (`PENDENTE|EMITIDO|ASSINADO|APROVADO|REJEITADO`) e `url` de download.
- Webhook `customs.document.updated` a cada mudança de status.

> Mapeia para o nosso `WorkflowDocument` (etapa `ENTRADA_REDEX`).

### 3.3 DU-E (Declaração Única de Exportação) — **crítico**
- `POST /v1/export-processes/{id}/due` — solicitar emissão da DU-E.
  - Corpo: itens fiscais, enquadramento, NCM, peso, valor, RUC (se aplicável).
  - Header `Idempotency-Key` obrigatório.
- `GET /v1/due/{due_number}` — consultar estado:
```json
{
  "due_number": "26BR0000123456",
  "status": "REGISTRADA",                 // REGISTRADA|CONFERIDA|LIBERADA|EMBARCADA|AVERBADA
  "channel": "VERDE",                     // VERDE|AMARELO|VERMELHO|CINZA
  "ruc": "6BR12345678000190...",
  "last_update": "2026-07-06T12:00:00Z"
}
```
- Webhook `customs.due.status_changed` a cada transição de `status` **e** de `channel`.

> Mapeia para `SiscomexStatus` e para o `WorkflowDocument` tipo `DUE` (etapa `ENTRADA_SISCOMEX_DUE`).

### 3.4 SISCOMEX — status & canal de conferência
Caso a consulta ao canal não venha junto da DU-E:
- `GET /v1/siscomex/{due_number}/status` — `status`, `channel`, pendências, exigências fiscais.
- Webhook `customs.status.changed` — **essencial**, pois a mudança de canal (ex.: VERMELHO) bloqueia o
  workflow e precisa de ação. Deve incluir motivo/exigência quando canal ≠ VERDE.

### 3.5 Fiscalização MAPA & Certificado Fitossanitário (coordenação)
O despachante frequentemente coordena a agenda do MAPA e o laudo laboratorial. Precisamos de:
- `GET /v1/export-processes/{id}/inspections` — agenda/situação da fiscalização MAPA
  (`AGENDADA|EM_ANALISE|APROVADA|REPROVADA`) e vínculo com o **laudo de aflatoxina**.
- `GET .../phytosanitary-certificate` — situação e `url` do Certificado Fitossanitário (sinal verde MAPA).
- Webhooks correspondentes (`customs.inspection.updated`, `customs.phyto.issued`).

> Mapeia para etapas `FISCALIZACAO_MAPA` e `CERTIFICADO_FITOSSANITARIO` e ao `DocumentType`
> `LAUDO_LAB` / `CERT_FITOSSANITARIO`.

### 3.6 Honorários / cotação (opcional, mas desejável)
- `GET /v1/export-processes/{id}/fees` ou `POST /v1/quotes` — honorários fixos/variáveis do despacho,
  para exibirmos custo estimado ao exportador.

---

## 4. Companhia de Navegação — endpoints necessários

### 4.1 Agenda de navios / cotação de frete
- `GET /v1/schedules?origin=BRBEL&destination=DEHAM&from=2026-07-10` — sailings disponíveis, com
  `vessel`, `voyage`, `etd`, `eta`, `transit_time_days`, `service`.
- `POST /v1/quotes` — cotação de frete por rota/tipo de contêiner (opcional).

### 4.2 Booking (reserva de praça) — **crítico**
- `POST /v1/bookings`
```json
{
  "external_ref": "wf_5567",                 // nosso workflow_id (idempotência)
  "origin_port": "BRBEL",
  "destination_port": "DEHAM",
  "incoterm": "FOB",
  "cargo": { "commodity": "Brazil nuts", "weight_kg": 15000, "packages": "600 sacks" },
  "containers": [{ "type": "20DV", "quantity": 1 }],
  "requested_etd": "2026-07-20"
}
```
Retorno: `booking_number`, `status`, `vessel`, `voyage`, `etd`, `eta`, `cutoff_dates` (deadline de gate-in/documental).
- `GET /v1/bookings/{booking_number}` — estado atual.
- Webhook `shipping.booking.updated` (confirmado, alterado, cancelado, roll-over de navio).

### 4.3 Contêiner — alocação, liberação e estufagem
- `GET /v1/bookings/{booking_number}/containers` — número do contêiner, lacre (`seal`), status de liberação
  para retirada/estufagem no terminal (etapa `TERMINAL_PESAGEM_ESTUFAGEM`).
- Webhook `shipping.container.released` quando o armador libera o contêiner ao terminal.

### 4.4 Bill of Lading (Draft e Original) — **crítico**
- `GET /v1/bookings/{booking_number}/bl/draft` — **Draft BL** (conferência) com `url` do PDF.
- `POST /v1/bookings/{booking_number}/bl/approve` — aprovação do draft pelo exportador (via plataforma).
- `POST /v1/bookings/{booking_number}/bl/release` — solicitar **liberação do BL original**
  (tipicamente **condicionada à confirmação de pagamento** — ver liquidação FOB).
- `GET .../bl` — estado do BL (`DRAFT|APPROVED|RELEASED|SURRENDERED`) + `url`.
- Webhooks: `shipping.bl.drafted`, `shipping.bl.released`.

> Mapeia para `WorkflowDocument` tipo `BL` (etapa `EMBARQUE_NAVIO_BL`) e destrava a liquidação FOB
> (`LiquidationFOBStatus: BL_LIBERADO`).

### 4.5 Rastreamento de contêiner (tracking de eventos) — **crítico**
Fonte da verdade para o avanço das etapas 8 e 9.
- `GET /v1/tracking/{container_or_bl}` — timeline de eventos:
```json
{
  "container": "HLCU1234567",
  "events": [
    { "code": "GATE_IN",   "location": "BRBEL", "at": "2026-07-19T10:00:00Z" },
    { "code": "LOADED",     "location": "BRBEL", "at": "2026-07-20T22:00:00Z" },
    { "code": "VESSEL_DEPARTURE", "location": "BRBEL", "at": "2026-07-21T02:00:00Z" },
    { "code": "VESSEL_ARRIVAL",   "location": "DEHAM", "at": "2026-08-14T06:00:00Z", "estimated": false }
  ]
}
```
- Códigos de evento esperados (mínimo): `GATE_IN`, `STUFFED`, `LOADED`, `VESSEL_DEPARTURE`,
  `TRANSSHIPMENT`, `VESSEL_ARRIVAL`, `DISCHARGED`, `GATE_OUT`.
- Webhook `shipping.container.event` para **cada** evento novo, com `estimated: true|false` para ETA/ETD.

> `VESSEL_DEPARTURE` conclui a etapa 8; `VESSEL_ARRIVAL` avança a etapa 9 (`CHEGADA_PORTO_DESTINO`).

---

## 5. Modelo de dados & mapeamento (de/para)

| Campo externo (exemplo)                     | Tipo interno            | Campo interno |
|---------------------------------------------|-------------------------|---------------|
| `export_process.external_ref`               | `Order`                 | `Order.id` |
| `due.due_number` / `.status` / `.channel`   | `SiscomexStatus`        | `due_number` / `status` / `channel` |
| documento `{type,status,url}`               | `WorkflowDocument`      | `type` / `status` / `url` / `emitted_at` |
| `booking.etd` / `.eta`                      | `WorkflowStep`          | `planned_date` / `actual_date` |
| evento de tracking `{code, at}`             | `WorkflowStep.status`   | transição `EM_ANDAMENTO`→`CONCLUIDO` |
| `bl.status = RELEASED`                      | `LiquidationFOB`        | `payment_status: BL_LIBERADO` |

Portos em **UN/LOCODE** (ex.: `BRBEL`, `BRSSZ`, `DEHAM`, `NLRTM`); a plataforma mantém um de/para para
os nomes exibidos (ex.: "Porto de Belém (PA)").

---

## 6. Segurança & compliance
- **LGPD**: dados de exportador/importador trafegam apenas sob TLS 1.2+; minimização de dados pessoais.
- **Retenção & auditoria**: log imutável de emissões (DU-E, BL) com carimbo de tempo e `request_id`.
- **Assinatura de documentos**: quando aplicável, suportar/registrar assinatura (Gov.br) e retornar o
  documento assinado.
- **Controle de acesso**: escopos distintos para leitura vs. emissão/liberação; princípio do menor privilégio.
- **Webhooks assinados** (HMAC) + verificação de origem (IP allowlist opcional).

## 7. Checklist de integração (antes do go-live)
- [ ] Credenciais de **sandbox** e **produção** entregues, com escopos separados (leitura/escrita).
- [ ] Coleção de exemplos (Postman/OpenAPI) de **todos** os endpoints da seção 3 e 4.
- [ ] Registro de **webhooks** + secret HMAC + documentação do envelope e da lista de `event_type`.
- [ ] Endpoints de **polling de fallback** (`.../status`) para cada recurso crítico (DU-E, booking, BL, tracking).
- [ ] Suporte a **idempotência** (`Idempotency-Key`) comprovado em DU-E e booking.
- [ ] Mapeamento de **códigos de erro** de negócio (lista estável).
- [ ] Catálogo de **códigos de evento** de tracking e de status de DU-E/SISCOMEX/BL.
- [ ] SLA formalizado (disponibilidade, latência de webhook, suporte).
- [ ] Teste ponta-a-ponta em sandbox: pedido → DU-E → canal → booking → Draft BL → BL liberado →
      eventos de tracking → chegada.

---

### Anexo A — Enumerações de referência (lado da plataforma)
- **DU-E status**: `REGISTRADA | CONFERIDA | LIBERADA | EMBARCADA | AVERBADA`
- **Canal SISCOMEX**: `VERDE | AMARELO | VERMELHO | CINZA`
- **DocumentType**: `NF | INVOICE | PACKING_LIST | CERT_ORIGEM | CERT_FITOSSANITARIO | CERT_HIGIENICO | BL | DUE | LAUDO_LAB | SWIFT | OUTROS`
- **Etapas do workflow**: ver seção 1.1.
