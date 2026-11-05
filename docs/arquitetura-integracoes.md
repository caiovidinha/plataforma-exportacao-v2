# Arquitetura e política de integrações

Este documento descreve **como a plataforma fala com parceiros** (despachante, transporte marítimo e terrestre, câmbio, seguro e futuros). A parte comercial/operacional está em [`parceiros/guia-integracao-parceiros.md`](parceiros/guia-integracao-parceiros.md).

## Princípios

1. **Nada chama parceiro direto** no ciclo da requisição. Toda chamada vira um *job* persistido (outbox) e é executada por um worker, com retentativas.
2. **Parceiros distintos, um contrato.** O núcleo só conhece `PartnerAdapter`; cada parceiro/modo é um adapter ou apenas *configuração* de um adapter existente.
3. **Eventos canônicos.** O que vem do parceiro (webhook, resposta, consulta, link de resposta) é normalizado para o mesmo conjunto de eventos antes de tocar no embarque.
4. **Minimização de dados.** O que é enviado a cada parceiro deriva do registro de requisitos (`packages/shared/src/requirements.ts`) e fica registrado (`data_shares`).
5. **Segredos nunca em claro:** AES-256-GCM em repouso (`SECRETS_MASTER_KEY`), mascarados nos logs, nunca devolvidos pela API.
6. **Produção nunca usa o sandbox.** O adapter `sandbox` é recusado quando `NODE_ENV=production`.

## Peças

| Peça | Onde | Função |
|---|---|---|
| `partners` / `partner_integrations` | `db/schema.ts` | Cadastro do parceiro e **uma integração por ambiente** (sandbox/produção): modo, config JSON, segredos cifrados, timeout, tentativas, versão do contrato, saúde |
| `PartnerAdapter` | `modules/integrations/types.ts` | Contrato com capacidades opcionais: `quote`, `dispatch`, `fetchStatus`, `cancel`, `parseWebhook`/`verifyWebhook`, `healthCheck` |
| `AdapterRegistry` | `integrations/registry.ts` | Resolve o adapter: `config.adapter` ou o padrão do (tipo, modo) |
| Adapters | `integrations/adapters/` | `http-generic`, `http-despachante`, `http-maritime` (HTTP configurável), `notify` (e-mail/WhatsApp), `manual`, `sandbox` |
| Outbox | `integrations/outbox.ts`, `worker.ts` | Fila `integration_jobs`, chave de idempotência, backoff exponencial com jitter, `DEAD` após N falhas, recuperação de jobs presos |
| Eventos | `integrations/events.ts` | Aplica eventos canônicos ao embarque (status, rastreio, documentos, problemas) com autorização por tipo de parceiro |
| Webhook de entrada | `integrations/public-routes.ts` | `POST /webhooks/:partnerKey`, HMAC + janela de tempo + anti-replay (`webhook_deliveries`) |
| Portal-lite | `integrations/portal.ts` | Links tokenizados (`partner_action_tokens`, só o hash fica salvo) |
| Observabilidade | `integration_logs`, `data_shares` | Chamadas (mascaradas) e o que foi compartilhado, com finalidade |
| Backoffice | `integrations/admin.ts`, `routes.ts` | Parceiros, integrações, testar conexão, girar segredo, fila, logs, dados compartilhados |

## Fluxo de uma solicitação

```
Exportador confirma pedido
  └─ createShipmentForOrder → enterStage(NEGOCIO)
       └─ para cada tarefa com `operation` e parceiro: enqueueJob(idempotencyKey = shipment:operation:task)
            └─ worker.claimDueJobs → processJob
                 ├─ resolve integração habilitada (produção ≻ sandbox; em prod só produção)
                 ├─ buildDispatchPayload  (minimiza dados + links assinados + registra data_shares)
                 ├─ [EMAIL|WHATSAPP|MANUAL] gera link do portal-lite
                 ├─ adapter.dispatch ─► parceiro
                 ├─ aplica eventos devolvidos (applyPartnerEvents)
                 └─ sucesso → SUCCEEDED · falha → FAILED (backoff) · esgotou/erro 4xx → DEAD + alerta
Parceiro responde (webhook | portal-lite | consulta de status)
  └─ eventos canônicos → updateTask / tracking / documentos → advanceIfComplete → próxima etapa
```

## Eventos canônicos

`REQUEST_ACCEPTED`, `REQUEST_REJECTED`, `TASK_STATUS`, `TRACKING_UPDATE`, `DOCUMENT_AVAILABLE`, `QUOTE_RECEIVED`, `ISSUE_REPORTED`. Regras:

- um parceiro só altera tarefas do **seu** tipo (`task_not_owned_by_partner`);
- evento de parceiro **nunca reabre** tarefa concluída;
- falha em um evento do lote não derruba os demais (resultado reporta `skipped`);
- documentos por URL só são baixados de hosts autorizados (`baseUrl` + `documentHosts`), com validação por assinatura de arquivo e limite de tamanho.

## Retentativas

`espera = 30 s × 2^(tentativa−1)` com ±25 % de jitter, teto de 6 h; `maxAttempts` por integração (padrão 6). Erros HTTP 4xx (exceto 408/425/429) são definitivos. Jobs `RUNNING` há mais de 5 min são recuperados. A operação pode reprocessar, cancelar ou gerar novo link no backoffice.

## Preço: chave TABELA × API

`pricing_config` guarda, por serviço, `mode (TABLE | PARTNER_API)` e `fallbackToTable`. O motor de simulação compõe as linhas por incoterm (FOB/CFR/CIF); cada linha informa a **origem** (Tabela, Parceiro, Sistema), se houve contingência e se a tarifa é de **amostra**. Com `PARTNER_API`, o adapter precisa implementar `quote`.

## Como adicionar um parceiro novo

1. **Sem código:** se o parceiro aceita nosso contrato canônico (corpo de saída e webhook), cadastre-o no backoffice com o adapter `http-generic` e preencha `baseUrl`, `endpoints`, `auth` e `statusMap`.
2. **Com e-mail/WhatsApp/manual:** escolha o modo; nenhum código.
3. **Formato próprio:** crie uma subclasse de `HttpPartnerAdapter` (ou um adapter novo) sobrescrevendo `buildDispatchBody`, `parseDispatchResponse`, `parseStatusResponse` e, se a assinatura for diferente, `verifyWebhook`; registre em `adapters/index.ts` e escreva os testes de aceite.
4. Atualize o `statusMap`, as tarifas e o quadro de acompanhamento do guia.

## Ambientes

- Dev/teste: `sandbox` (parceiro simulado) disponível; `POST /admin/shipments/:id/sandbox/simulate` conclui tarefas de parceiros sandbox.
- Produção: apenas integrações `PRODUCTION`; o sandbox é ignorado e o endpoint de simulação responde 409.

## Testes

`apps/api/src/modules/integrations/*.test.ts` cobrem: backoff/retentativa/DEAD, retry manual, recuperação de jobs presos, segredos cifrados, sandbox × produção, despacho aos parceiros (sandbox/e-mail/manual), minimização de dados, portal-lite (aceite, escopo, revogação), webhook (assinatura válida/inválida, janela de tempo, replay, escopo por parceiro) e o ciclo completo do embarque.
