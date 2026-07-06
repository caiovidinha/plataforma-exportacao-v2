# Backend — Plataforma de Exportação (microsserviços + Kafka)

Backend assíncrono que substitui o mock do frontend. Arquitetura orientada a eventos:
o frontend Next.js fala **apenas** com o **API Gateway/BFF** (REST); os serviços se coordenam
por **eventos Kafka**. O frontend não conhece Kafka.

```
[ Next.js ]  →  [ gateway (REST :4000) ]  →  serviços REST
                                             ↕ eventos
                                          [ Kafka :9092 ]
```

## Serviços (Fase 1 — caminho crítico)

| Serviço            | Porta | Responsabilidade                                            |
|--------------------|-------|-------------------------------------------------------------|
| `gateway`          | 4000  | BFF REST consumido pelo frontend; encaminha aos serviços    |
| `identity-service` | 4001  | Contas de exportador/importador, auth (stub Gov.br)         |
| `catalog-service`  | 4002  | Produtos + ofertas, busca/filtros                           |
| `order-service`    | 4003  | Pedidos; emite `order.created`, `order.confirmed/rejected`  |
| `workflow-service` | 4004  | Consome `order.confirmed` → cria workflow, emite `workflow.*`; integra despachante/navegação |
| `partner-service`  | 4005  | Parceiros **fixos** (despachante, navegação, terminal, ...) — seed |

Serviços de fases seguintes (não neste scaffold): `document-service`, `liquidation-service`,
`notification-service`.

## Fluxo de eventos mínimo (o "coração" da Fase 1)

```
POST /orders (gateway → order-service)
      └─▶ order.created ──────────────▶ (auditoria / notificação futura)

POST /orders/:id/confirm (exportador)
      └─▶ order.confirmed ────────────▶ workflow-service
                                             └─▶ cria ExportWorkflow
                                             └─▶ workflow.started
```

Tópicos: ver [`shared/events.js`](shared/events.js) (`TOPICS`, `EVENTS`).

## Como rodar

```bash
cd backend
cp .env.example .env
docker compose up --build
# Kafka em :9092, gateway em :4000
```

Teste o fluxo crítico:

```bash
# cria pedido
curl -s -XPOST localhost:4000/orders -H 'content-type: application/json' \
  -d '{"offer_id":"off_003","importer_id":"imp_002","quantity_kg":25000}'
# confirma (exportador) → dispara workflow
curl -s -XPOST localhost:4000/orders/ord_123/confirm
# consulta workflows criados por evento
curl -s localhost:4000/workflows
```

## Migração do frontend

O frontend já está pronto para alternar mock ↔ backend real pela flag `NEXT_PUBLIC_USE_MOCK_DATA`
(ver `src/lib/feature-flags.ts`). Os endpoints do `gateway` seguem os paths que `src/lib/api.ts`
espera no ramo "não-mock" (`/offers`, `/orders`, `/workflows`, ...), preservando os shapes de `src/types`.
