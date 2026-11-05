# Amazon Trade

Plataforma de exportação de castanha-do-brasil: **cadastro (KYC) extenso**, **catálogo**, **simulação de custo** (por tabela ou por API de parceiro), **pedido → confirmação**, **embarque com etapas/tarefas** e **integração com parceiros** (despachante, transporte marítimo e terrestre, câmbio, seguro).

## Estrutura

```
apps/api         API Fastify + Drizzle (PostgreSQL ou PGlite embarcado)
apps/web         Next.js 14 (landing verde #1b6145 · app neutro) — consome a API, sem mocks
packages/shared  Enums, schemas zod, definição do cadastro, registro de requisitos, etapas, preços
tools/docs       Gerador do guia de parceiros (Markdown + .docx)
docs/            Guia de parceiros, arquitetura de integrações, OpenAPI
```

## Rodando localmente

Requisitos: Node 20+. (Docker é opcional.)

```bash
npm install
cp .env.example .env            # ajuste se quiser
npm run db:seed -w @amazon-trade/api -- --demo   # tarifas de AMOSTRA, parceiros sandbox, contas e produtos de demonstração
npm run dev                     # API em :4000 e web em :3000
```

- **Banco:** por padrão PGlite (arquivos em `apps/api/.data`). Para PostgreSQL: `docker compose up -d` e `DB_DRIVER=pg` + `DATABASE_URL` no `.env`.
- **Web → API:** o Next reescreve `/api/*` para `API_INTERNAL_URL` (cookies httpOnly no mesmo domínio).
- **E-mails** (verificação, convites, parceiros) saem no console do servidor (`MAIL_DRIVER=console`); use `smtp` + `SMTP_URL` para enviar de verdade.
- **Documentação interativa da API:** http://localhost:4000/docs (e `docs/openapi.json`).

### Contas de desenvolvimento (criadas só fora de produção)

Senha de todas: a definida em `apps/api/src/db/seed.ts` (`DEV_PASSWORD`).

| Perfil | E-mail |
|---|---|
| Administrador da plataforma | `admin@amazontrade.local` |
| Operações / Compliance | `ops@amazontrade.local` · `compliance@amazontrade.local` |
| Exportador demo (aprovado) | `exportador@demo.local` |
| Importador demo (aprovado) | `importador@demo.local` |

Em produção o seed só cria o administrador se `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` estiverem definidos.

## Fluxo para experimentar

1. Entre como **importador**, abra um produto, **simule** o custo e faça o **pedido**.
2. Entre como **exportador** e **aceite** o pedido → o embarque é criado e os parceiros (sandbox) são acionados pelo worker.
3. No **backoffice** (`/admin/shipments/:id`) use *Simular parceiros (sandbox)* para avançar etapas; veja a fila, os logs e os dados compartilhados.
4. Crie uma conta nova para ver o **cadastro extenso**, enviar para análise e aprovar em *Compliance*.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Tipos em shared, api e web |
| `npm test` | Testes (vitest + PGlite em memória) |
| `npm run docs:generate` | Gera `docs/parceiros/guia-integracao-parceiros.{md,docx}` |
| `npm run openapi -w @amazon-trade/api` | Atualiza `docs/openapi.json` |
| `npm run db:generate -w @amazon-trade/api` | Nova migration após mudar `db/schema.ts` |

## Configuração

Todas as variáveis estão em [`.env.example`](.env.example). Em produção troque `JWT_SECRET` e `SECRETS_MASTER_KEY` (`openssl rand -base64 32`), use `DB_DRIVER=pg`, `COOKIE_SECURE` e `WEB_ORIGIN`/`PUBLIC_API_URL` reais.

## O que ainda depende de decisão externa

- **Endpoints reais dos parceiros:** os adapters de despachante e marítimo têm mapeamento *provisório*; a documentação de cada parceiro define o definitivo (ver guia).
- **Tarifas:** as tabelas semeadas são **amostras** (sinalizadas na simulação e no backoffice) até serem substituídas pelas negociadas.
- **Fora de escopo:** PDF/assinatura Gov.br do contrato, movimentação financeira, app mobile e o logo oficial (há uma marca provisória em SVG).

Mais detalhes: [`docs/arquitetura-integracoes.md`](docs/arquitetura-integracoes.md) · [`docs/parceiros/guia-integracao-parceiros.md`](docs/parceiros/guia-integracao-parceiros.md).
