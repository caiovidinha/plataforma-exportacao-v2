import type { PartnerType } from '@amazon-trade/shared'

/**
 * Conteúdo editorial por parceiro (o que perguntar, o que pedir, como aceitar).
 * Os DADOS que enviamos e as TAREFAS/ETAPAS são gerados do código (registro de requisitos e etapas),
 * então só o que depende de decisão/negociação fica aqui.
 */
export interface PartnerGuide {
  /** Em uma frase: como pretendemos integrar. */
  approach: string
  /** Tipos de documento que o parceiro devolve para o embarque. */
  returns: string[]
  /** O que precisamos receber do parceiro (documentação, credenciais, acordos). */
  need: string[]
  /** Perguntas abertas para a primeira reunião. */
  questions: string[]
  /** Exemplos de status do parceiro → status canônico (a validar com o parceiro). */
  statusMap: [partner: string, canonical: string, note: string][]
  /** Testes de aceite antes de ligar em produção. */
  acceptance: string[]
  /** Decisões que ainda dependem de negócio/jurídico. */
  decisions: string[]
}

export const PARTNER_GUIDES: Partial<Record<PartnerType, PartnerGuide>> = {
  DESPACHANTE: {
    approach: 'Integração por API: abrimos o processo de exportação, recebemos status, documentos (DU-E, certificados, laudos) e enviamos os documentos de apoio por link seguro.',
    returns: ['DU-E (declaração única de exportação)', 'Certificado fitossanitário', 'Laudo de aflatoxina', 'Certificado de origem', 'Comprovantes de fiscalização do MAPA'],
    need: [
      'Documentação da API (OpenAPI/Swagger ou PDF) e ambiente de testes (sandbox) com credenciais.',
      'Método de autenticação (API key, OAuth2 client credentials, mTLS, HMAC) e política de rotação de credenciais.',
      'Lista oficial de status do processo (abertura, conferência, MAPA, DU-E registrada, desembaraçada, averbada...) para montarmos o mapeamento.',
      'Como baixar documentos (URL assinada, endpoint autenticado ou envio no webhook) e formatos aceitos.',
      'Como o parceiro prefere receber nossos documentos (nós enviamos links de download válidos por 24 h).',
      'Webhooks: eventos disponíveis, formato, assinatura e política de reenvio. Se não houver, a frequência máxima de consulta (polling).',
      'Tabela de preços (valor fixo + percentual sobre o valor, por porto) e vigência.',
      'SLAs (tempo para aceitar o processo, para registrar a DU-E) e contatos de escalonamento.',
    ],
    questions: [
      'Vocês têm API aberta hoje? Qual a previsão de sandbox? Já integram com outros clientes?',
      'Qual é o identificador do processo no sistema de vocês (e podemos enviar o nosso número de embarque como referência)?',
      'O que acontece quando o MAPA reprova a amostra / aflatoxina fora do limite? Como isso aparece no status?',
      'Documentos são devolvidos assinados/carimbados? Em qual formato (PDF, XML)?',
      'Atendem todos os portos de origem que usaremos (Belém, Vila do Conde, Manaus, Santos...)?',
      'Como é a cobrança: por processo, por contêiner, mensal? Há taxas extras (armazenagem, retificação de DU-E)?',
      'Quais dados do exportador vocês exigem além dos que listamos na matriz de dados deste guia?',
    ],
    statusMap: [
      ['ABERTO / EM_CONFERENCIA', 'IN_PROGRESS', 'Processo recebido e em análise documental'],
      ['MAPA_AGENDADO', 'IN_PROGRESS', 'Fiscalização solicitada'],
      ['DUE_REGISTRADA', 'IN_PROGRESS', 'DU-E registrada, aguardando desembaraço'],
      ['DESEMBARACADO / AVERBADO', 'DONE', 'Libera a tarefa EXPORT_DECLARATION_REGISTERED'],
      ['PENDENCIA / EXIGENCIA', 'BLOCKED', 'Gera alerta para a operação'],
    ],
    acceptance: [
      'Abrir processo no sandbox com o payload real de um embarque e receber a referência do parceiro.',
      'Receber evento de mudança de status (webhook ou polling) refletido na timeline do embarque.',
      'Receber e baixar a DU-E e o certificado fitossanitário e vê-los na aba de documentos.',
      'Simular indisponibilidade do parceiro: o job deve entrar em retentativa e, ao voltar, concluir sem duplicar o processo (idempotência).',
      'Simular exigência/pendência: a tarefa deve ficar BLOQUEADA e a equipe de operações ser avisada.',
    ],
    decisions: ['Parceiro único ou um despachante por porto?', 'Quem responde pelo custo de retificação de DU-E?', 'Prazo máximo (SLA) aceitável para cada etapa.'],
  },
  TRANSPORTE_MARITIMO: {
    approach: 'Integração por API: cotação opcional para a simulação, booking, confirmação de espaço, emissão do BL e rastreio contínuo (navio, viagem, contêineres, ETD/ETA, posição).',
    returns: ['Confirmação de booking', 'Bill of Lading (BL)', 'Avisos de chegada / atualização de ETA'],
    need: [
      'Documentação da API de booking, tracking e documentos; sandbox e credenciais.',
      'Escopo: armador próprio ou NVOCC? Quais rotas (origem→destino), tipos de contêiner (20DC, 40DC, 40HC) e frequência de saídas.',
      'Tabela de frete por rota e tipo de contêiner (valor por contêiner, sobretaxas, validade) — usada na simulação se o modo for TABELA; ou endpoint de cotação se for API.',
      'Modelo de eventos de rastreio (gate-in, carregado, zarpou, transbordo, chegada) e como mapear para os nossos status.',
      'Como o BL é emitido e entregue (original, telex release, sea waybill) e quem aprova a minuta.',
      'Webhook de tracking (ou frequência máxima de polling) e política de retentativa.',
      'Política de cancelamento / roll-over e custos associados.',
    ],
    questions: [
      'Há cotação em tempo real por API (necessária para a simulação instantânea) ou só tabela com validade?',
      'Qual o prazo de resposta da cotação? (nossa simulação espera poucos segundos antes de usar a tabela de contingência)',
      'Como identificamos o booking: número do armador, referência do cliente? Podemos enviar o nosso número de embarque?',
      'Como recebemos o número dos contêineres e o selo antes do embarque?',
      'Quais documentos o armador exige do exportador/importador (shipping instruction, VGM, consignee/notify)?',
      'Como tratam mercadoria recusada no destino (devolução, abandono) e quem cobra?',
    ],
    statusMap: [
      ['BOOKING_REQUESTED', 'IN_PROGRESS', 'Solicitação recebida'],
      ['BOOKING_CONFIRMED', 'DONE', 'Libera MARITIME_BOOKING_CONFIRMED (e envia vessel/voyage/ETD)'],
      ['SPACE_CONFIRMED', 'DONE', 'Libera VESSEL_SPACE_CONFIRMED'],
      ['LOADED', 'DONE', 'Libera CARGO_LOADED'],
      ['BL_ISSUED', 'DONE', 'Libera BL_ISSUED; anexar o BL'],
      ['ROLLED / CANCELLED', 'BLOCKED', 'Gera alerta; operação decide'],
    ],
    acceptance: [
      'Criar booking no sandbox com dados reais de um embarque e receber a referência.',
      'Receber evento de tracking e ver navio/viagem/ETA atualizados no card de rastreio.',
      'Receber o BL e baixá-lo; a tarefa BL_ISSUED fecha sozinha.',
      'Cotação por API: simular com a chave em PARTNER_API e conferir fallback para a tabela quando o parceiro demora.',
    ],
    decisions: ['Cotação por API ou tabela com validade mensal?', 'Quem emite o BL e em que formato (original/telex)?', 'Política de roll-over.'],
  },
  TRANSPORTE_TERRESTRE: {
    approach: 'A plataforma repassa todas as informações; a integração é a definir. Começamos por e-mail/WhatsApp com link de resposta (portal-lite) e evoluímos para API se houver.',
    returns: ['Confirmação de coleta agendada', 'CT-e / comprovante de entrega no porto', 'Fotos / canhoto (opcional)'],
    need: [
      'Quais rotas atendem (UF/município de coleta → porto de embarque) e os tipos de veículo/carga.',
      'Tabela de preços (valor por tonelada, mínimo por viagem, pedágio/adicionais) com vigência — usada na simulação.',
      'Canal de recebimento das solicitações (e-mail, WhatsApp Business, sistema próprio/API) e responsável por turno.',
      'Prazo para confirmar a coleta e janela de coleta/entrega.',
      'Dados que precisam para a coleta (contato no exportador, endereço, janela, restrições de acesso, documentos do motorista/placa).',
      'Como informam: coleta realizada, entregue no porto, ocorrência (avaria, atraso).',
    ],
    questions: [
      'Preferem receber por e-mail, WhatsApp ou ter acesso a um portal? Aceitam responder pelo nosso link (sem cadastro)?',
      'Possuem API ou integração com TMS? Qual?',
      'Como lidam com carga paletizada/big bag e janela de recebimento no terminal?',
      'Há cobertura de seguro de transporte (RCTR-C) e responsabilidade em caso de avaria?',
    ],
    statusMap: [
      ['COLETA_AGENDADA', 'DONE', 'Libera LAND_TRANSPORT_SCHEDULED'],
      ['COLETADO', 'DONE', 'Libera CARGO_PICKED_UP'],
      ['ENTREGUE_NO_PORTO', 'DONE', 'Libera CARGO_DELIVERED_TO_PORT'],
      ['OCORRENCIA', 'BLOCKED', 'Alerta para operação'],
    ],
    acceptance: [
      'Receber e-mail/WhatsApp com o resumo da operação e o link de resposta.',
      'Responder pelo link (aceite, coleta, entrega) e ver a timeline atualizada.',
      'Link expirado/substituído deve ser recusado.',
    ],
    decisions: ['Canal definitivo (e-mail, WhatsApp ou API)?', 'Tabela por UF→porto ou por faixa de distância?', 'Quem contrata o seguro de transporte?'],
  },
  CAMBIO: {
    approach: 'A plataforma repassa as informações e acompanha o status; a plataforma NÃO movimenta dinheiro. Integração a definir (e-mail/portal-lite primeiro, API se houver).',
    returns: ['Contrato de câmbio', 'Comprovante SWIFT / confirmação de recebimento', 'Liquidação do câmbio'],
    need: [
      'Instituição autorizada pelo Banco Central a operar câmbio de exportação, produtos (ACC/ACE, câmbio pronto, antecipação) e documentação exigida.',
      'Lista de documentos e dados de KYC do exportador e do importador que a instituição exige (ver matriz de dados).',
      'Tabela de custos: spread (%) e tarifa fixa por operação, por moeda (USD/EUR/BRL), com vigência.',
      'Fluxo e prazos: abertura da operação, assinatura do contrato, recebimento do pagamento, liquidação.',
      'Canal de recebimento (e-mail, portal, API) e como informam cada marco.',
      'Contato de compliance/PLD e política de sanções.',
    ],
    questions: [
      'Em quais modalidades operam e qual é o limite/valor mínimo por operação?',
      'Quais comprovantes do importador são necessários antes de abrir a operação?',
      'Como informam o recebimento do pagamento (e quando liberam os recursos ao exportador)?',
      'Há API (cotação, abertura de operação, status)? Se sim, sandbox?',
      'Quem assina o contrato de câmbio e como (certificado digital, assinatura eletrônica)?',
    ],
    statusMap: [
      ['OPERACAO_ABERTA', 'DONE', 'Libera FX_CONTRACT_OPENED'],
      ['CONTRATO_ASSINADO', 'DONE', 'Libera FX_CONTRACT_SIGNED'],
      ['PAGAMENTO_AUTORIZADO', 'DONE', 'Libera PAYMENT_RELEASE_AUTHORIZED'],
      ['PAGAMENTO_RECEBIDO / LIQUIDADO', 'DONE', 'Libera PAYMENT_RECEIVED e encerra o embarque'],
      ['PENDENCIA_COMPLIANCE', 'BLOCKED', 'Alerta para operação'],
    ],
    acceptance: [
      'Receber a solicitação com os dados mínimos e confirmar o aceite (portal-lite ou API).',
      'Registrar o contrato de câmbio (documento) e a data de liquidação.',
      'Disparar o fluxo de NÃO PAGAMENTO e ver a notificação ao câmbio/seguro.',
    ],
    decisions: ['Modalidade de câmbio padrão?', 'Responsável pelo risco de crédito do importador?', 'Política para operações em EUR.'],
  },
  SEGURO: {
    approach: 'A princípio por e-mail/WhatsApp para o responsável pelo seguro, com link de resposta (portal-lite); o objetivo é chegar a um preço TABELADO (taxa % com prêmio mínimo) para a simulação não depender de cotação manual.',
    returns: ['Apólice / certificado de seguro', 'Endosso (se houver)', 'Comunicação de sinistro (NÃO PAGAMENTO / MERCADORIA RECUSADA)'],
    need: [
      'Produto e coberturas oferecidas (all risks, riscos nomeados), exclusões, franquias e limites por embarque.',
      'Tabela de preços: taxa (% do valor segurado), prêmio mínimo, adicional sobre o valor (usamos 110% = CIF + 10%), por rota/moeda/commodity, com vigência.',
      'Dados exigidos para emitir a apólice (valor segurado, descrição da carga, embalagem, trânsito, navio, data do embarque).',
      'Prazo para emitir a apólice após o pedido e canal oficial (e-mail/WhatsApp/portal/API).',
      'Processo de sinistro: documentos, prazo, contato; cobertura de crédito/não pagamento (se oferecida) e de mercadoria recusada.',
      'Existe API de cotação/emissão? Sandbox?',
    ],
    questions: [
      'Podem fornecer uma tabela fixa por rota para a simulação? Qual validade e frequência de reajuste?',
      'A apólice é por embarque ou aberta (averbações)? Como averbamos?',
      'Cobrem a rota Amazônia → Europa/EUA/Ásia? Há restrições para castanha (umidade, mofo, contaminação)?',
      'Como funciona o sinistro quando o importador não paga ou recusa a carga?',
    ],
    statusMap: [
      ['SOLICITACAO_RECEBIDA', 'IN_PROGRESS', 'Parceiro aceitou a solicitação'],
      ['APOLICE_EMITIDA', 'DONE', 'Libera INSURANCE_ISSUED; anexar a apólice'],
      ['SINISTRO_ABERTO', 'DONE', 'Libera INSURANCE_CLAIM_OPENED nos ramos de exceção'],
      ['RECUSADO / PENDENTE_DADOS', 'BLOCKED', 'Alerta para operação'],
    ],
    acceptance: [
      'Receber o e-mail/WhatsApp com todos os dados e os links de documentos válidos por 24 h.',
      'Responder pelo link: aceitar, enviar a apólice (PDF) e marcar como emitida.',
      'Sinistro: ao declarar NÃO PAGAMENTO, o seguro recebe a solicitação com o dossiê.',
    ],
    decisions: ['Tabela fixa ou cotação por operação?', 'Apólice por embarque ou aberta?', 'Cobertura de crédito entra agora ou fase 2?'],
  },
}
