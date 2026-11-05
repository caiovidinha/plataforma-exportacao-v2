import {
  CORE_PARTNER_TYPES,
  INTEGRATION_MODES,
  PARTNER_EVENT_TYPES,
  PARTNER_META,
  REQUIREMENT_REGISTRY,
  STAGE_DEFS,
  TARIFF_SCHEMAS,
  TASK_STATUSES,
  getStageDef,
  sectionsFor,
  type PartnerType,
  type PricingService,
} from '@amazon-trade/shared'
import { callout, checklist, code, h1, h2, h3, ol, p, pagebreak, table, ul, type Block } from './blocks'
import { PARTNER_GUIDES } from './partner-content'

const GENERATED = new Date().toISOString().slice(0, 10)
const who = (t: 'EXPORTER' | 'IMPORTER') => (t === 'EXPORTER' ? 'Exportador' : 'Importador')
const sectionTitle = (t: 'EXPORTER' | 'IMPORTER', key: string | null) => (key ? sectionsFor(t).find((s) => s.key === key)?.title.pt ?? key : 'Documento')
const level = { API: 'Integração por API', NOTIFY: 'Notificação (e-mail/WhatsApp) + link de resposta', TO_BE_DEFINED: 'A definir (começa por notificação/link)' }

const SERVICE_NAME: Record<PricingService, string> = {
  FREIGHT_MARITIME: 'Frete marítimo',
  FREIGHT_LAND: 'Frete terrestre',
  INSURANCE: 'Seguro',
  FX: 'Câmbio',
  CUSTOMS_BROKER: 'Despachante',
  ORIGIN_HANDLING: 'Terminal / laudos na origem',
  IMPORT_CHARGES: 'Tributos de importação (estimativa)',
  PLATFORM_FEE: 'Taxa da plataforma',
}
const shapeKeys = (schema: unknown) => Object.keys(((schema as { shape?: Record<string, unknown> }).shape ?? {}) as Record<string, unknown>)

function dataMatrix(partner: PartnerType): Block[] {
  const rows = REQUIREMENT_REGISTRY.filter((r) => r.partners.includes(partner))
  if (!rows.length) return [p('Nenhum dado cadastral é exigido deste tipo de parceiro nesta versão — ele recebe apenas os dados da operação (embarque, carga, rota).')]
  const sorted = [...rows].sort((a, b) => a.companyType.localeCompare(b.companyType) || a.kind.localeCompare(b.kind) || (a.section ?? '').localeCompare(b.section ?? ''))
  return [
    table(
      ['Origem', 'Bloco / seção', 'Item', 'Tipo', 'Obrigatório no cadastro'],
      sorted.map((r) => [who(r.companyType), sectionTitle(r.companyType, r.section), r.label.pt + (r.repeatable ? ' (por item da lista)' : ''), r.kind === 'field' ? 'Campo' : 'Documento', r.required ? 'Sim' : 'Não']),
      [1.1, 2.2, 3, 1, 1.4],
    ),
  ]
}

function stagesTable(): Block[] {
  const rows: string[][] = []
  for (const s of STAGE_DEFS) {
    for (const t of s.tasks) {
      rows.push([s.title.pt + (s.order === null ? ' (exceção)' : ''), t.title.pt, t.actor === 'PARTNER' ? PARTNER_META[t.partner!].label.pt : t.actor === 'EXPORTER' ? 'Exportador' : t.actor === 'IMPORTER' ? 'Importador' : 'Plataforma', t.operation ?? (t.auto ? 'automática' : '—'), `\`${t.key}\``])
    }
  }
  return [table(['Etapa', 'Tarefa', 'Responsável', 'Operação disparada', 'Chave (taskKey)'], rows, [2, 3.2, 2, 2.2, 3])]
}

function partnerTasks(partner: PartnerType): string[][] {
  const rows: string[][] = []
  for (const s of STAGE_DEFS) for (const t of s.tasks) if (t.partner === partner) rows.push([s.title.pt, t.title.pt, `\`${t.key}\``, t.operation ? `Enviamos \`${t.operation}\`` : 'Parceiro informa o andamento (webhook / link / consulta)'])
  return rows
}

function partnerSection(partner: PartnerType, n: number): Block[] {
  const meta = PARTNER_META[partner]
  const g = PARTNER_GUIDES[partner]!
  return [
    pagebreak(),
    h1(`${n}. ${meta.label.pt}`),
    callout(`**Papel no fluxo:** ${meta.role.pt}\n**Abordagem:** ${g.approach}\n**Nível de integração hoje:** ${level[meta.level]} · **modo inicial sugerido:** ${meta.defaultMode}`),
    h2(`${n}.1 O que a plataforma faz com este parceiro`),
    table(['Etapa', 'Tarefa', 'Chave', 'Como o parceiro participa'], partnerTasks(partner), [2, 3, 3, 3.4]),
    p(`Operações possíveis: ${meta.operations.map((o) => `\`${o}\``).join(', ')}.${meta.pricingService ? ` Alimenta o preço do serviço **${SERVICE_NAME[meta.pricingService]}** na simulação (tabela interna ou API do parceiro — a "chave" é configurada no backoffice).` : ''}`),
    h2(`${n}.2 O que enviamos (dados e documentos)`),
    p('Aplicamos **minimização de dados**: só vai para o parceiro o que está marcado abaixo (alimentado automaticamente pelo código — este quadro é sempre a verdade atual). Cada envio fica registrado em "Dados compartilhados" no backoffice.'),
    ...dataMatrix(partner),
    p('Além do cadastro, sempre enviamos os dados da operação: número do embarque e do pedido, incoterm, quantidade, valor da fatura, contêineres e tipo, portos de origem/destino, data pretendida de embarque e dados do produto (nome, NCM, embalagem, safra). Documentos aprovados pelo compliance seguem como **links de download assinados, válidos por 24 horas**.'),
    h2(`${n}.3 O que o parceiro devolve`),
    ul(g.returns),
    h2(`${n}.4 O que precisamos do parceiro (checklist)`),
    checklist(g.need),
    h2(`${n}.5 Mapeamento de status (proposta a validar)`),
    p('O parceiro fala os status dele; nós traduzimos para o status canônico da tarefa (`IN_PROGRESS`, `DONE`, `BLOCKED`). Preencha a coluna do parceiro na reunião e registre o resultado no campo `statusMap` da integração.'),
    table(['Status do parceiro (exemplo)', 'Status canônico', 'Efeito'], g.statusMap.map((r) => [...r]), [2.6, 1.6, 4]),
    h2(`${n}.6 Perguntas para a primeira reunião`),
    ol(g.questions),
    h2(`${n}.7 Testes de aceite (antes de ligar em produção)`),
    checklist(g.acceptance),
    h2(`${n}.8 Decisões em aberto`),
    ul(g.decisions),
    ...(meta.pricingService ? [h2(`${n}.9 Preço: o que pedir para a tabela`), ...pricingBlock(meta.pricingService)] : []),
  ]
}

function pricingBlock(service: PricingService): Block[] {
  const s = TARIFF_SCHEMAS[service]
  return [
    p(`Para o serviço **${SERVICE_NAME[service]}** a tabela de tarifas precisa de:`),
    table(['Chave de busca (match)', 'Valores (pricing)'], [[shapeKeys(s.match).map((k) => `\`${k}\``).join(', ') || '— (única)', shapeKeys(s.pricing).map((k) => `\`${k}\``).join(', ')]], [3, 5]),
    p('Mais **vigência** (início e fim). Tarifas cadastradas como "amostra" aparecem sinalizadas na simulação até serem substituídas pelas negociadas.'),
  ]
}

const WEBHOOK_EXAMPLE = `POST {PUBLIC_API_URL}/webhooks/{partnerKey}
Content-Type: application/json
x-at-timestamp: 1767225600
x-at-signature: sha256=<hex>

{
  "eventId": "evt_2026_000123",
  "events": [
    {
      "type": "TASK_STATUS",
      "shipmentRef": "SH-2026-000001",
      "taskKey": "EXPORT_DECLARATION_REGISTERED",
      "partnerStatus": "DESEMBARACADO",
      "message": "DU-E desembaraçada",
      "occurredAt": "2026-03-14T13:05:00Z"
    },
    {
      "type": "DOCUMENT_AVAILABLE",
      "shipmentRef": "SH-2026-000001",
      "message": "DU-E averbada",
      "document": { "type": "DU_E", "fileName": "due-averbada.pdf", "url": "https://api.parceiro.com/docs/123" }
    },
    {
      "type": "TRACKING_UPDATE",
      "shipmentRef": "SH-2026-000001",
      "message": "Navio zarpou",
      "tracking": { "vesselName": "MV EXEMPLO", "voyage": "012E", "containerNumbers": ["ABCU1234567"], "blNumber": "BL123", "etd": "2026-03-20", "eta": "2026-04-12", "status": "SAILING" }
    }
  ]
}`

const SIGN_EXAMPLE = `// Node.js — assinatura do corpo bruto (string exata enviada)
import { createHmac } from 'node:crypto'
const ts = Math.floor(Date.now() / 1000)
const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(\`\${ts}.\${rawBody}\`).digest('hex')
// headers: x-at-timestamp: ts   x-at-signature: signature`

const DISPATCH_EXAMPLE = `POST {baseUrl}{endpoints.dispatch.path}      (padrão: /requests no adapter http-generic)
Idempotency-Key: <shipmentId>:<OPERATION>:<taskKey>
Authorization / x-api-key / HMAC: conforme "auth" configurado

{
  "operation": "CREATE_BOOKING",
  "idempotencyKey": "…",
  "reference": "SH-2026-000001",
  "callbackUrl": "{PUBLIC_API_URL}/webhooks/{partnerKey}",
  "shipment": { "number": "SH-2026-000001", "incoterm": "CIF", "quantityKg": 20000, "invoiceValueUsd": 100000,
                "containers": 1, "containerType": "40HC",
                "originPort": { "code": "BRBEL", "name": "Belém (PA)" }, "destinationPort": { "code": "NLRTM", "name": "Rotterdam" },
                "requestedShipDate": "2026-04-01", "product": { "name": "Castanha-do-Brasil", "ncm": "08012100", "packaging": "Sacos 25 kg" } },
  "exporter": { "name": "…", "country": "BR", "...campos da matriz de dados..." },
  "importer": { "name": "…", "country": "NL", "...campos da matriz de dados..." },
  "documents": [ { "type": "COMMERCIAL_INVOICE", "fileName": "invoice.pdf", "url": "https://…/files/signed/<token>" } ],
  "actionUrl": "https://…/partner/<token>"      // só em modos EMAIL/WHATSAPP/MANUAL ou portalLite=true
}

Resposta esperada (200): { "accepted": true, "externalRef": "BKG-998877", "events": [ …opcional… ] }
Consulta de status:      GET {baseUrl}/requests/{externalRef}  →  { "status": "CONFIRMED" }  ou  { "events": [ … ] }`

export function buildGuide(): Block[] {
  const core = CORE_PARTNER_TYPES
  const b: Block[] = []
  b.push({ kind: 'title', text: 'Guia de integração com parceiros', subtitle: `Amazon Trade · gerado em ${GENERATED} a partir do código (registro de requisitos, etapas e contratos)` })

  // ---------------------------------------------------------------- 0
  b.push(
    h1('1. Como usar este guia'),
    p('Este documento é para **quem vai conversar com os parceiros** (despachante, transportadoras, câmbio, seguro) e definir, junto com eles, o que cada lado precisa enviar e receber. O código da plataforma já está pronto para receber qualquer parceiro; falta combinar **canal, formato, status e preço** — é isso que o guia organiza.'),
    ul([
      '**Seções 2–4**: visão do fluxo, modos de integração e o checklist comum a todos os parceiros.',
      '**Seções 5–9**: uma seção por parceiro, com os dados que enviamos (gerados do código), o que precisamos deles, perguntas e testes de aceite.',
      '**Seções 10–13**: contrato técnico que oferecemos (webhook, link de resposta, retentativas), privacidade/LGPD, roteiro de reunião e quadro de acompanhamento.',
    ]),
    callout('Todo item com ☐ é uma pendência a fechar. Ao concluir um parceiro, o time técnico configura a integração no backoffice (Parceiros → Configurar) — nenhuma mudança de código é necessária se o parceiro seguir o contrato canônico; se tiver API própria, o time implementa um adapter.', 'info', 'Como acompanhar'),
  )

  // ---------------------------------------------------------------- 2
  b.push(
    h1('2. Visão geral do fluxo'),
    p('O importador simula o custo, faz o pedido e o exportador confirma. A confirmação cria o embarque e **dispara automaticamente** os pedidos aos parceiros da etapa NEGÓCIO. A partir daí, cada tarefa de cada etapa é concluída pelo parceiro (por API, webhook, link de resposta) ou manualmente pela operação; quando todas as tarefas obrigatórias terminam, a etapa avança sozinha.'),
    ol(['Importador simula (preço por **tabela** ou **API do parceiro**, conforme a chave por serviço).', 'Importador faz o pedido; o contrato-lite congela os termos.', 'Exportador confirma → embarque criado.', 'Plataforma envia as solicitações da etapa NEGÓCIO (seguro, câmbio, despacho, booking, transporte terrestre).', 'Parceiros respondem; a plataforma atualiza status, rastreio e documentos; etapas avançam até PAGAMENTO.', 'Exceções: NÃO PAGAMENTO e MERCADORIA RECUSADA acionam seguro (sinistro) e análise jurídica.']),
    h2('2.1 Etapas, tarefas e quem é responsável'),
    p('Tabela gerada do código — as chaves (`taskKey`) são as que o parceiro/webhook usa para dizer "esta tarefa terminou".'),
    ...stagesTable(),
    h2('2.2 Rede de parceiros'),
    table(
      ['Parceiro', 'Papel', 'Nível de integração hoje', 'Modo inicial'],
      core.map((t) => [PARTNER_META[t].label.pt, PARTNER_META[t].role.pt, level[PARTNER_META[t].level], PARTNER_META[t].defaultMode]),
      [2, 4.5, 2.5, 1.3],
    ),
    p('Parceiros de fase 2 já previstos no sistema (sem fluxo próprio ainda): laboratório credenciado, certificadora e terminal alfandegário.'),
  )

  // ---------------------------------------------------------------- 3
  b.push(
    h1('3. Modos de integração'),
    p('Cada parceiro é configurado em **um** destes modos por ambiente (sandbox/produção). Dá para começar simples (e-mail + link) e migrar para API sem mudar o resto.'),
    table(
      ['Modo', 'Como funciona', 'Quando usar', 'O parceiro precisa de'],
      [
        ['API', 'Chamamos a API do parceiro (booking, processo...). Recebemos status por webhook ou consulta periódica.', 'Despachante e transporte marítimo (alvo do projeto).', 'API documentada + sandbox + credenciais.'],
        ['WEBHOOK_ONLY', 'O parceiro nos envia eventos; nós não chamamos nada.', 'Parceiro que já tem sistema próprio e só nos informa o andamento.', 'Segredo de webhook (nós geramos).'],
        ['EMAIL', 'E-mail com todos os dados + links de documentos + **link de resposta (portal-lite)**.', 'Seguro, terrestre, câmbio no início.', 'Um e-mail de recebimento.'],
        ['WHATSAPP', 'Mensagem via gateway configurável + link de resposta.', 'Parceiros que operam por WhatsApp.', 'Número e gateway (ex.: provedor oficial).'],
        ['MANUAL', 'Aviso na fila da operação; a equipe atualiza o status à mão.', 'Parceiros sem nenhum canal digital.', 'Nada.'],
        ['SFTP', 'Reservado para troca de arquivos (não implementado ainda).', 'Parceiros legados.', '—'],
      ],
      [1.2, 3.5, 2.6, 2.2],
    ),
    h2('3.1 Link de resposta (portal-lite)'),
    p('Para parceiros **sem API**: cada solicitação por e-mail/WhatsApp inclui um link único (validade de 14 dias; só o hash fica salvo). Sem criar conta, o parceiro pode **aceitar/recusar**, **marcar a tarefa como concluída**, informar a referência (apólice, protocolo) e **enviar documentos** (PDF/JPG/PNG até 15 MB). Ele só vê os dados necessários para a tarefa — nunca dados cadastrais. Se a operação gerar outro link para o mesmo envio, o anterior é revogado.'),
    h2('3.2 Chave tabela × API (preços)'),
    p('Na simulação, cada serviço pode usar a **tabela interna** ou a **API do parceiro**, por uma chave no backoffice (Preços). Se a API do parceiro falhar, a opção de contingência usa a tabela e a linha da simulação aparece marcada. A tabela é o plano A recomendado até as APIs de cotação estarem estáveis.'),
  )

  // ---------------------------------------------------------------- 4
  b.push(
    h1('4. Checklist comum a todos os parceiros'),
    h2('4.1 Comercial'),
    checklist(['Escopo do serviço (rotas, portos, produtos, volumes) e exclusões.', 'Tabela de preços com vigência e regra de reajuste (ver "Preço" em cada parceiro).', 'Forma de cobrança (por embarque, por contêiner, mensal) e quem paga quem (a plataforma só repassa informação — não movimenta dinheiro).', 'SLAs: prazo para aceitar, executar cada etapa e responder a exceções.', 'Contato comercial e contato de operação (nome, e-mail, telefone/WhatsApp) + escalonamento fora do horário.']),
    h2('4.2 Jurídico e LGPD'),
    checklist(['Contrato/aditivo de prestação de serviço e responsabilidades (inclusive avarias, atrasos e sinistros).', 'Acordo de tratamento de dados (DPA): finalidade, base legal, retenção e eliminação.', 'Lista dos dados pessoais envolvidos (representantes, sócios/UBO, contatos) e se há transferência internacional.', 'Cláusula de confidencialidade e de segurança da informação; resposta a incidentes (prazo de notificação).', 'Validade da apólice/licenças do parceiro (ex.: autorização do Banco Central no câmbio; habilitação do despachante).']),
    h2('4.3 Técnico'),
    checklist(['Documentação da API (OpenAPI/PDF) e histórico de mudanças/versionamento.', 'Sandbox e credenciais (e política de rotação).', 'Autenticação (API key, OAuth2 client credentials, mTLS, HMAC) e IPs de origem a liberar (se houver).', 'Rate limits e timeouts recomendados.', 'Webhooks: eventos, formato, assinatura, reenvio e URL de callback aceita. Se não houver: frequência máxima de consulta.', 'Formato e tamanho de documentos aceitos/devolvidos; como baixar (URL assinada, endpoint, payload).', 'Identificadores: o parceiro aceita receber nossa referência (número do embarque) e a devolve em todos os eventos?', 'Idempotência: reenviar a mesma solicitação não cria duplicidade (nós enviamos o cabeçalho `Idempotency-Key`).', 'Janela de manutenção e canal de status do serviço.']),
    h2('4.4 Operacional'),
    checklist(['Quem é o responsável do lado do parceiro por embarque e como é feita a passagem de turno.', 'O que fazer em exceção (carga recusada, não pagamento, avaria): fluxo, prazos e documentos.', 'Calendário de testes e data de entrada em produção; plano de contingência (modo MANUAL).']),
    h2('4.5 Aceite'),
    checklist(['Teste ponta a ponta no sandbox com um embarque real simulado.', 'Revisão do mapeamento de status e do quadro de dados compartilhados com o encarregado de dados (DPO).', 'Aprovação da integração para produção (ver quadro de acompanhamento).']),
  )

  // ---------------------------------------------------------------- 5-9
  core.forEach((t, i) => b.push(...partnerSection(t, 5 + i)))

  // ---------------------------------------------------------------- 10
  b.push(
    pagebreak(),
    h1('10. Contrato técnico que oferecemos'),
    h2('10.1 Webhook de entrada (parceiro → plataforma)'),
    p('Qualquer parceiro pode nos enviar eventos neste formato canônico, sem trabalho adicional de código nosso. Se o parceiro tiver formato próprio, o time implementa um adapter que traduz para os mesmos eventos.'),
    ul([
      '**Endpoint:** `POST {PUBLIC_API_URL}/webhooks/{partnerKey}` (a `partnerKey` aparece no backoffice, em Parceiros).',
      '**Assinatura:** cabeçalhos `x-at-timestamp` (epoch em segundos) e `x-at-signature: sha256=<hex>` = HMAC-SHA256 do texto `"<timestamp>.<corpo bruto>"` com o **segredo de webhook** (gerado no backoffice; entregue ao parceiro uma única vez).',
      '**Tolerância de relógio:** 5 minutos. Fora disso → 401.',
      '**Idempotência / anti-replay:** `eventId` único por entrega; reenvio do mesmo `eventId` é ignorado (200 com `duplicate: true`).',
      '**Respostas:** 200 aplicado · 401 assinatura inválida · 400 payload inválido · 404 parceiro desconhecido/desabilitado · 422 nada foi aplicado (ex.: embarque desconhecido) — nesse caso o parceiro **pode reenviar** o mesmo `eventId` depois.',
      `**Tipos de evento:** ${PARTNER_EVENT_TYPES.map((x) => `\`${x}\``).join(', ')}.`,
      `**Status canônicos de tarefa:** ${TASK_STATUSES.map((x) => `\`${x}\``).join(', ')}. Se o parceiro envia o status dele em \`partnerStatus\`, traduzimos pelo \`statusMap\` configurado.`,
      '**Identificação:** `shipmentRef` (nosso número SH-…), `externalRef` (referência do parceiro) e/ou `taskKey`. Um parceiro só consegue atualizar tarefas do **seu** tipo.',
      '**Documentos:** `document.contentBase64` ou `document.url` (o host da URL precisa estar liberado na configuração da integração — `baseUrl` ou `documentHosts`).',
      'Eventos tardios ou duplicados **nunca reabrem** uma tarefa já concluída.',
    ]),
    code(WEBHOOK_EXAMPLE, 'http'),
    code(SIGN_EXAMPLE, 'js'),
    h2('10.2 Chamada de saída (plataforma → parceiro com API)'),
    p('O adapter HTTP genérico envia o contrato abaixo; os adapters de despachante e marítimo reutilizam o mesmo corpo com um envelope próprio (**mapeamento provisório até recebermos a documentação real de cada parceiro**). Tudo é configurável por integração: `baseUrl`, `endpoints`, `auth`, `headers`, `statusMap`.'),
    code(DISPATCH_EXAMPLE, 'http'),
    h2('10.3 Confiabilidade'),
    ul([
      'Toda chamada passa por uma **fila persistente (outbox)** com chave de idempotência — nada é perdido se o parceiro estiver fora do ar.',
      '**Retentativas** com espera exponencial e variação aleatória: 30 s, 1 min, 2 min, 4 min… (teto de 6 h). Padrão: 6 tentativas; ao esgotar, o job vira **falha definitiva**, a tarefa fica bloqueada e a operação é notificada. Erros 4xx (exceto 408/425/429) não são repetidos.',
      '**Timeout** padrão de 15 s por chamada (configurável por integração).',
      'Operações pode **reprocessar** jobs, **cancelar** ou gerar um **novo link de resposta** direto no backoffice (Fila de integrações).',
      '**Logs de integração** guardam requisição/resposta com dados sensíveis mascarados, tempo e correlação.',
    ]),
    h2('10.4 Cotação por API (opcional)'),
    p('Se o parceiro oferecer cotação, enviamos `service`, portos, UF de origem, quantidade, nº/tipo de contêineres, valor da mercadoria (USD) e moeda, e esperamos `{ amount, currency, validUntil?, transitDays? }` em poucos segundos. Acima do tempo-limite a simulação usa a tabela de contingência (se habilitada).'),
  )

  // ---------------------------------------------------------------- 11
  b.push(
    h1('11. Privacidade e minimização de dados (LGPD)'),
    ul([
      'Cada parceiro recebe **somente** os campos e documentos marcados para o tipo dele (quadros das seções 5–9).',
      'Documentos vão como **links assinados com validade de 24 h**; nunca anexos permanentes.',
      'Cada envio é registrado em **Dados compartilhados** (quem, o quê, quando e para qual finalidade) — base para atender titulares e auditorias.',
      'Segredos de integração são **criptografados** em repouso (AES-256-GCM) e nunca voltam para a tela.',
      'O ambiente de **produção nunca usa o parceiro simulado (sandbox)**.',
    ]),
    callout('Revisar com o jurídico/DPO: base legal por parceiro, retenção após o fim do embarque e eventual transferência internacional (importador e transportadora marítima).', 'warn'),
  )

  // ---------------------------------------------------------------- 12
  b.push(
    h1('12. Reunião de kickoff e modelo de e-mail'),
    h2('12.1 Roteiro (45–60 min)'),
    ol(['Apresentar o fluxo da plataforma e onde o parceiro entra (seção 2).', 'Entender como o parceiro opera hoje e o que já automatiza.', 'Definir o **modo de integração** (seção 3) e o plano de evolução.', 'Revisar o quadro "o que enviamos" e ajustar dados/documentos.', 'Mapear status do parceiro → status canônicos.', 'Alinhar documentação, sandbox, credenciais e cronograma.', 'Preço: tabela × API; vigência e reajuste.', 'Definir SLAs, contatos, exceções e próximos passos com datas.']),
    h2('12.2 Modelo de e-mail de abertura'),
    code(
      `Assunto: Amazon Trade × {Parceiro} — alinhamento de integração

Olá {Nome},

Somos a Amazon Trade, plataforma que conecta exportadores de castanha-do-brasil a importadores e à cadeia logística.
Gostaríamos de integrar {Parceiro} ({papel: despacho / frete marítimo / ...}) ao nosso fluxo: a cada pedido confirmado,
enviamos os dados da operação e recebemos status e documentos.

Para avançar, podemos agendar 45 min esta semana? Ajudaria muito se vocês pudessem compartilhar antes:
 1) documentação técnica (API/webhooks) e acesso a sandbox, se existirem;
 2) tabela de preços e vigência;
 3) lista de status/etapas do serviço de vocês;
 4) contatos de operação e escalonamento.

Podemos trabalhar inicialmente por e-mail/WhatsApp com um link de resposta e evoluir para API quando fizer sentido.

Obrigado,
{Seu nome} — Amazon Trade`,
      'text',
    ),
  )

  // ---------------------------------------------------------------- 13
  b.push(
    h1('13. Quadro de acompanhamento'),
    p('Preencha uma linha por parceiro e atualize a cada reunião.'),
    table(
      ['Parceiro', 'Contato', 'Modo definido', 'Docs/sandbox', 'Mapa de status', 'Tabela de preço', 'DPA assinado', 'Teste de aceite', 'Produção'],
      core.map((t) => [PARTNER_META[t].label.pt, '☐', '☐', '☐', '☐', '☐', '☐', '☐', '☐']),
      [2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2],
    ),
    h2('13.1 Planilha de tarifas a pedir (resumo)'),
    table(
      ['Serviço', 'Chave de busca', 'Valores'],
      (Object.keys(TARIFF_SCHEMAS) as PricingService[]).map((sv) => [SERVICE_NAME[sv], shapeKeys(TARIFF_SCHEMAS[sv].match).map((k) => `\`${k}\``).join(', ') || '—', shapeKeys(TARIFF_SCHEMAS[sv].pricing).map((k) => `\`${k}\``).join(', ')]),
      [2.5, 3, 5],
    ),
    h2('13.2 Glossário'),
    table(
      ['Termo', 'Significado'],
      [
        ['Embarque (SH-…)', 'Operação de exportação criada quando o exportador confirma um pedido.'],
        ['Etapa / tarefa', 'Fase do embarque e passos dentro dela; avançam quando as tarefas obrigatórias terminam.'],
        ['taskKey', 'Identificador estável da tarefa (ex.: `BL_ISSUED`) usado em webhooks e links.'],
        ['externalRef', 'Referência do parceiro (booking, processo, apólice) guardada na tarefa.'],
        ['Outbox / job', 'Fila persistente de chamadas a parceiros, com retentativas.'],
        ['Adapter', 'Peça de código que sabe falar com um tipo de parceiro/modo.'],
        ['portal-lite', 'Link único para parceiro sem API responder sem criar conta.'],
        ['Chave tabela × API', 'Configuração por serviço que define a origem do preço na simulação.'],
        ['Incoterm', 'Regra de quem paga frete/seguro: FOB, CFR ou CIF.'],
      ],
      [2, 7],
    ),
    h2('13.3 Referências no repositório'),
    ul(['`docs/arquitetura-integracoes.md` — política e estrutura técnica das integrações.', '`docs/openapi.json` — contrato completo da API da plataforma.', '`packages/shared/src/requirements.ts` — registro que liga cada campo/documento aos parceiros.', '`packages/shared/src/stages.ts` — etapas e tarefas do embarque.']),
  )

  void getStageDef
  void INTEGRATION_MODES
  return b
}
