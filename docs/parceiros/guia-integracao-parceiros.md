# Guia de integração com parceiros

_Amazon Trade · gerado em 2026-11-05 a partir do código (registro de requisitos, etapas e contratos)_

## 1. Como usar este guia

Este documento é para **quem vai conversar com os parceiros** (despachante, transportadoras, câmbio, seguro) e definir, junto com eles, o que cada lado precisa enviar e receber. O código da plataforma já está pronto para receber qualquer parceiro; falta combinar **canal, formato, status e preço** — é isso que o guia organiza.

- **Seções 2–4**: visão do fluxo, modos de integração e o checklist comum a todos os parceiros.
- **Seções 5–9**: uma seção por parceiro, com os dados que enviamos (gerados do código), o que precisamos deles, perguntas e testes de aceite.
- **Seções 10–13**: contrato técnico que oferecemos (webhook, link de resposta, retentativas), privacidade/LGPD, roteiro de reunião e quadro de acompanhamento.

> **Como acompanhar** — Todo item com ☐ é uma pendência a fechar. Ao concluir um parceiro, o time técnico configura a integração no backoffice (Parceiros → Configurar) — nenhuma mudança de código é necessária se o parceiro seguir o contrato canônico; se tiver API própria, o time implementa um adapter.

## 2. Visão geral do fluxo

O importador simula o custo, faz o pedido e o exportador confirma. A confirmação cria o embarque e **dispara automaticamente** os pedidos aos parceiros da etapa NEGÓCIO. A partir daí, cada tarefa de cada etapa é concluída pelo parceiro (por API, webhook, link de resposta) ou manualmente pela operação; quando todas as tarefas obrigatórias terminam, a etapa avança sozinha.

1. Importador simula (preço por **tabela** ou **API do parceiro**, conforme a chave por serviço).
2. Importador faz o pedido; o contrato-lite congela os termos.
3. Exportador confirma → embarque criado.
4. Plataforma envia as solicitações da etapa NEGÓCIO (seguro, câmbio, despacho, booking, transporte terrestre).
5. Parceiros respondem; a plataforma atualiza status, rastreio e documentos; etapas avançam até PAGAMENTO.
6. Exceções: NÃO PAGAMENTO e MERCADORIA RECUSADA acionam seguro (sinistro) e análise jurídica.

### 2.1 Etapas, tarefas e quem é responsável

Tabela gerada do código — as chaves (`taskKey`) são as que o parceiro/webhook usa para dizer "esta tarefa terminou".

| Etapa | Tarefa | Responsável | Operação disparada | Chave (taskKey) |
| --- | --- | --- | --- | --- |
| Negócio | Contratos aceitos pelas partes | Plataforma | automática | `CONTRACTS_ACCEPTED` |
| Negócio | Seguro emitido | Seguro | REQUEST_INSURANCE | `INSURANCE_ISSUED` |
| Negócio | Operação de câmbio aberta | Câmbio | REQUEST_FX_CONTRACT | `FX_CONTRACT_OPENED` |
| Negócio | Processo de despacho aberto | Despachante aduaneiro | CREATE_CUSTOMS_PROCESS | `CUSTOMS_PROCESS_OPENED` |
| Negócio | Booking marítimo confirmado | Transportadora marítima | CREATE_BOOKING | `MARITIME_BOOKING_CONFIRMED` |
| Negócio | Transporte terrestre agendado | Transportadora terrestre | REQUEST_LAND_TRANSPORT | `LAND_TRANSPORT_SCHEDULED` |
| Mercadoria pronta | Nota fiscal emitida | Exportador | — | `INVOICE_ISSUED` |
| Mercadoria pronta | Carga coletada | Transportadora terrestre | — | `CARGO_PICKED_UP` |
| Mercadoria pronta | Carga entregue no porto/terminal | Transportadora terrestre | — | `CARGO_DELIVERED_TO_PORT` |
| Mercadoria pronta | Documentos de exportação preparados | Despachante aduaneiro | — | `EXPORT_DOCS_PREPARED` |
| Mercadoria pronta | Conferência da carga antes do lacre | Despachante aduaneiro | — | `PRE_SEAL_INSPECTION` |
| Mercadoria no porto | Fiscalização MAPA solicitada/realizada | Despachante aduaneiro | — | `MAPA_INSPECTION` |
| Mercadoria no porto | Laudo de aflatoxina aprovado | Despachante aduaneiro | — | `AFLATOXIN_LAB_REPORT` |
| Mercadoria no porto | Certificado fitossanitário emitido | Despachante aduaneiro | — | `PHYTOSANITARY_CERTIFICATE` |
| Mercadoria no porto | DU-E registrada e desembaraçada | Despachante aduaneiro | — | `EXPORT_DECLARATION_REGISTERED` |
| Mercadoria no porto | Espaço no navio confirmado | Transportadora marítima | — | `VESSEL_SPACE_CONFIRMED` |
| Mercadoria liberada | Carga embarcada no navio | Transportadora marítima | — | `CARGO_LOADED` |
| Mercadoria liberada | BL emitido | Transportadora marítima | — | `BL_ISSUED` |
| Mercadoria liberada | Contrato de câmbio fechado | Câmbio | — | `FX_CONTRACT_SIGNED` |
| Mercadoria liberada | Liberação do pagamento autorizada | Câmbio | — | `PAYMENT_RELEASE_AUTHORIZED` |
| Pagamento | Pagamento recebido pelo exportador | Câmbio | — | `PAYMENT_RECEIVED` |
| Pagamento | Embarque encerrado | Plataforma | automática | `SHIPMENT_CLOSED` |
| Não pagamento (exceção) | Sinistro aberto na seguradora | Seguro | REQUEST_INSURANCE | `INSURANCE_CLAIM_OPENED` |
| Não pagamento (exceção) | Análise jurídica | Plataforma | — | `LEGAL_REVIEW` |
| Mercadoria recusada (exceção) | Sinistro aberto na seguradora | Seguro | REQUEST_INSURANCE | `INSURANCE_CLAIM_OPENED` |
| Mercadoria recusada (exceção) | Análise jurídica | Plataforma | — | `LEGAL_REVIEW` |

### 2.2 Rede de parceiros

| Parceiro | Papel | Nível de integração hoje | Modo inicial |
| --- | --- | --- | --- |
| Despachante aduaneiro | Abre o processo de despacho, registra a DU-E no Siscomex, solicita fiscalização do MAPA e certificados, acompanha liberação. | Integração por API | API |
| Transportadora marítima | Booking, confirmação de espaço, embarque, emissão do BL e rastreio do navio/contêiner até o destino. | Integração por API | API |
| Transportadora terrestre | Coleta a carga no exportador e entrega no porto/terminal de embarque. | A definir (começa por notificação/link) | EMAIL |
| Câmbio | Contrato de câmbio, recebimento do pagamento do importador e liberação ao exportador. | A definir (começa por notificação/link) | EMAIL |
| Seguro | Cotação e emissão do seguro da mercadoria (e, futuramente, de crédito/pagamento e safra). | Notificação (e-mail/WhatsApp) + link de resposta | EMAIL |

Parceiros de fase 2 já previstos no sistema (sem fluxo próprio ainda): laboratório credenciado, certificadora e terminal alfandegário.

## 3. Modos de integração

Cada parceiro é configurado em **um** destes modos por ambiente (sandbox/produção). Dá para começar simples (e-mail + link) e migrar para API sem mudar o resto.

| Modo | Como funciona | Quando usar | O parceiro precisa de |
| --- | --- | --- | --- |
| API | Chamamos a API do parceiro (booking, processo...). Recebemos status por webhook ou consulta periódica. | Despachante e transporte marítimo (alvo do projeto). | API documentada + sandbox + credenciais. |
| WEBHOOK_ONLY | O parceiro nos envia eventos; nós não chamamos nada. | Parceiro que já tem sistema próprio e só nos informa o andamento. | Segredo de webhook (nós geramos). |
| EMAIL | E-mail com todos os dados + links de documentos + **link de resposta (portal-lite)**. | Seguro, terrestre, câmbio no início. | Um e-mail de recebimento. |
| WHATSAPP | Mensagem via gateway configurável + link de resposta. | Parceiros que operam por WhatsApp. | Número e gateway (ex.: provedor oficial). |
| MANUAL | Aviso na fila da operação; a equipe atualiza o status à mão. | Parceiros sem nenhum canal digital. | Nada. |
| SFTP | Reservado para troca de arquivos (não implementado ainda). | Parceiros legados. | — |

### 3.1 Link de resposta (portal-lite)

Para parceiros **sem API**: cada solicitação por e-mail/WhatsApp inclui um link único (validade de 14 dias; só o hash fica salvo). Sem criar conta, o parceiro pode **aceitar/recusar**, **marcar a tarefa como concluída**, informar a referência (apólice, protocolo) e **enviar documentos** (PDF/JPG/PNG até 15 MB). Ele só vê os dados necessários para a tarefa — nunca dados cadastrais. Se a operação gerar outro link para o mesmo envio, o anterior é revogado.

### 3.2 Chave tabela × API (preços)

Na simulação, cada serviço pode usar a **tabela interna** ou a **API do parceiro**, por uma chave no backoffice (Preços). Se a API do parceiro falhar, a opção de contingência usa a tabela e a linha da simulação aparece marcada. A tabela é o plano A recomendado até as APIs de cotação estarem estáveis.

## 4. Checklist comum a todos os parceiros

### 4.1 Comercial

- [ ] Escopo do serviço (rotas, portos, produtos, volumes) e exclusões.
- [ ] Tabela de preços com vigência e regra de reajuste (ver "Preço" em cada parceiro).
- [ ] Forma de cobrança (por embarque, por contêiner, mensal) e quem paga quem (a plataforma só repassa informação — não movimenta dinheiro).
- [ ] SLAs: prazo para aceitar, executar cada etapa e responder a exceções.
- [ ] Contato comercial e contato de operação (nome, e-mail, telefone/WhatsApp) + escalonamento fora do horário.

### 4.2 Jurídico e LGPD

- [ ] Contrato/aditivo de prestação de serviço e responsabilidades (inclusive avarias, atrasos e sinistros).
- [ ] Acordo de tratamento de dados (DPA): finalidade, base legal, retenção e eliminação.
- [ ] Lista dos dados pessoais envolvidos (representantes, sócios/UBO, contatos) e se há transferência internacional.
- [ ] Cláusula de confidencialidade e de segurança da informação; resposta a incidentes (prazo de notificação).
- [ ] Validade da apólice/licenças do parceiro (ex.: autorização do Banco Central no câmbio; habilitação do despachante).

### 4.3 Técnico

- [ ] Documentação da API (OpenAPI/PDF) e histórico de mudanças/versionamento.
- [ ] Sandbox e credenciais (e política de rotação).
- [ ] Autenticação (API key, OAuth2 client credentials, mTLS, HMAC) e IPs de origem a liberar (se houver).
- [ ] Rate limits e timeouts recomendados.
- [ ] Webhooks: eventos, formato, assinatura, reenvio e URL de callback aceita. Se não houver: frequência máxima de consulta.
- [ ] Formato e tamanho de documentos aceitos/devolvidos; como baixar (URL assinada, endpoint, payload).
- [ ] Identificadores: o parceiro aceita receber nossa referência (número do embarque) e a devolve em todos os eventos?
- [ ] Idempotência: reenviar a mesma solicitação não cria duplicidade (nós enviamos o cabeçalho `Idempotency-Key`).
- [ ] Janela de manutenção e canal de status do serviço.

### 4.4 Operacional

- [ ] Quem é o responsável do lado do parceiro por embarque e como é feita a passagem de turno.
- [ ] O que fazer em exceção (carga recusada, não pagamento, avaria): fluxo, prazos e documentos.
- [ ] Calendário de testes e data de entrada em produção; plano de contingência (modo MANUAL).

### 4.5 Aceite

- [ ] Teste ponta a ponta no sandbox com um embarque real simulado.
- [ ] Revisão do mapeamento de status e do quadro de dados compartilhados com o encarregado de dados (DPO).
- [ ] Aprovação da integração para produção (ver quadro de acompanhamento).

---

## 5. Despachante aduaneiro

> **Nota** — **Papel no fluxo:** Abre o processo de despacho, registra a DU-E no Siscomex, solicita fiscalização do MAPA e certificados, acompanha liberação.
> **Abordagem:** Integração por API: abrimos o processo de exportação, recebemos status, documentos (DU-E, certificados, laudos) e enviamos os documentos de apoio por link seguro.
> **Nível de integração hoje:** Integração por API · **modo inicial sugerido:** API

### 5.1 O que a plataforma faz com este parceiro

| Etapa | Tarefa | Chave | Como o parceiro participa |
| --- | --- | --- | --- |
| Negócio | Processo de despacho aberto | `CUSTOMS_PROCESS_OPENED` | Enviamos `CREATE_CUSTOMS_PROCESS` |
| Mercadoria pronta | Documentos de exportação preparados | `EXPORT_DOCS_PREPARED` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria pronta | Conferência da carga antes do lacre | `PRE_SEAL_INSPECTION` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria no porto | Fiscalização MAPA solicitada/realizada | `MAPA_INSPECTION` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria no porto | Laudo de aflatoxina aprovado | `AFLATOXIN_LAB_REPORT` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria no porto | Certificado fitossanitário emitido | `PHYTOSANITARY_CERTIFICATE` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria no porto | DU-E registrada e desembaraçada | `EXPORT_DECLARATION_REGISTERED` | Parceiro informa o andamento (webhook / link / consulta) |

Operações possíveis: `QUOTE`, `CREATE_CUSTOMS_PROCESS`, `SYNC_STATUS`, `SEND_DOCUMENT`, `CANCEL`. Alimenta o preço do serviço **Despachante** na simulação (tabela interna ou API do parceiro — a "chave" é configurada no backoffice).

### 5.2 O que enviamos (dados e documentos)

Aplicamos **minimização de dados**: só vai para o parceiro o que está marcado abaixo (alimentado automaticamente pelo código — este quadro é sempre a verdade atual). Cada envio fica registrado em "Dados compartilhados" no backoffice.

| Origem | Bloco / seção | Item | Tipo | Obrigatório no cadastro |
| --- | --- | --- | --- | --- |
| Exportador | Documento | Cartão CNPJ | Documento | Sim |
| Exportador | Documento | Contrato social e última alteração consolidada | Documento | Sim |
| Exportador | Documento | Certidão negativa de débitos federais (CND) | Documento | Sim |
| Exportador | Documento | Comprovante de inscrição estadual | Documento | Sim |
| Exportador | Documento | Comprovante de habilitação no RADAR/Siscomex | Documento | Sim |
| Exportador | Documento | Registro / cadastro no MAPA | Documento | Sim |
| Exportador | Documento | Documento de identificação dos representantes (RG/CNH + CPF) | Documento | Sim |
| Exportador | Documento | Procuração ao despachante aduaneiro | Documento | Sim |
| Exportador | Endereços | Logradouro (por item da lista) | Campo | Sim |
| Exportador | Dados da empresa | Razão social | Campo | Sim |
| Exportador | Dados da empresa | Nome fantasia | Campo | Não |
| Exportador | Dados da empresa | CNPJ | Campo | Sim |
| Exportador | Dados da empresa | Inscrição estadual | Campo | Sim |
| Exportador | Dados da empresa | CNAE principal | Campo | Sim |
| Exportador | Dados da empresa | Regime tributário | Campo | Sim |
| Exportador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Exportador | Operação e produtos | Principais produtos | Campo | Sim |
| Exportador | Operação e produtos | NCM dos produtos | Campo | Sim |
| Exportador | Operação e produtos | Portos de embarque preferenciais | Campo | Sim |
| Exportador | Representantes legais e signatários | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | CPF (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | RG (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | Data de nascimento (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | E-mail (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | Poder de assinatura (por item da lista) | Campo | Sim |
| Exportador | Habilitações e registros de exportação | Habilitação no RADAR (Siscomex) | Campo | Sim |
| Exportador | Habilitações e registros de exportação | Data da habilitação | Campo | Não |
| Exportador | Habilitações e registros de exportação | Registro / cadastro no MAPA (exportador) | Campo | Sim |
| Exportador | Habilitações e registros de exportação | Validade do registro MAPA | Campo | Não |
| Exportador | Habilitações e registros de exportação | Despachante aduaneiro atual (se houver) | Campo | Não |
| Importador | Documento | Extrato do registro comercial (certificate of incorporation) | Documento | Sim |
| Importador | Documento | Comprovante de Tax ID / VAT | Documento | Sim |
| Importador | Documento | Licença / registro de importação | Documento | Sim |
| Importador | Documento | Registro sanitário / segurança alimentar | Documento | Sim |
| Importador | Documento | Procuração ao corretor aduaneiro no destino | Documento | Não |
| Importador | Endereços | Endereço (por item da lista) | Campo | Sim |
| Importador | Endereços | Cidade (por item da lista) | Campo | Sim |
| Importador | Endereços | Código postal (por item da lista) | Campo | Sim |
| Importador | Endereços | País (por item da lista) | Campo | Sim |
| Importador | Dados da empresa | Razão social | Campo | Sim |
| Importador | Dados da empresa | Nome fantasia | Campo | Não |
| Importador | Dados da empresa | País de registro | Campo | Sim |
| Importador | Dados da empresa | Tax ID / VAT | Campo | Sim |
| Importador | Dados da empresa | EORI (UE/Reino Unido) | Campo | Não |
| Importador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Importador | Importação, consignee e notify | Licença / registro de importação | Campo | Sim |
| Importador | Importação, consignee e notify | Validade da licença | Campo | Não |
| Importador | Importação, consignee e notify | Registro sanitário/segurança alimentar (ex.: FDA FFR, UE FBO) | Campo | Sim |
| Importador | Importação, consignee e notify | Consignee (nome no BL) | Campo | Sim |
| Importador | Importação, consignee e notify | Tax ID do consignee | Campo | Sim |
| Importador | Importação, consignee e notify | Endereço do consignee | Campo | Sim |
| Importador | Importação, consignee e notify | Despachante/corretor aduaneiro no destino | Campo | Sim |
| Importador | Importação, consignee e notify | Contato do corretor (e-mail/telefone) | Campo | Sim |
| Importador | Signatários autorizados | Nome completo (por item da lista) | Campo | Sim |

Além do cadastro, sempre enviamos os dados da operação: número do embarque e do pedido, incoterm, quantidade, valor da fatura, contêineres e tipo, portos de origem/destino, data pretendida de embarque e dados do produto (nome, NCM, embalagem, safra). Documentos aprovados pelo compliance seguem como **links de download assinados, válidos por 24 horas**.

### 5.3 O que o parceiro devolve

- DU-E (declaração única de exportação)
- Certificado fitossanitário
- Laudo de aflatoxina
- Certificado de origem
- Comprovantes de fiscalização do MAPA

### 5.4 O que precisamos do parceiro (checklist)

- [ ] Documentação da API (OpenAPI/Swagger ou PDF) e ambiente de testes (sandbox) com credenciais.
- [ ] Método de autenticação (API key, OAuth2 client credentials, mTLS, HMAC) e política de rotação de credenciais.
- [ ] Lista oficial de status do processo (abertura, conferência, MAPA, DU-E registrada, desembaraçada, averbada...) para montarmos o mapeamento.
- [ ] Como baixar documentos (URL assinada, endpoint autenticado ou envio no webhook) e formatos aceitos.
- [ ] Como o parceiro prefere receber nossos documentos (nós enviamos links de download válidos por 24 h).
- [ ] Webhooks: eventos disponíveis, formato, assinatura e política de reenvio. Se não houver, a frequência máxima de consulta (polling).
- [ ] Tabela de preços (valor fixo + percentual sobre o valor, por porto) e vigência.
- [ ] SLAs (tempo para aceitar o processo, para registrar a DU-E) e contatos de escalonamento.

### 5.5 Mapeamento de status (proposta a validar)

O parceiro fala os status dele; nós traduzimos para o status canônico da tarefa (`IN_PROGRESS`, `DONE`, `BLOCKED`). Preencha a coluna do parceiro na reunião e registre o resultado no campo `statusMap` da integração.

| Status do parceiro (exemplo) | Status canônico | Efeito |
| --- | --- | --- |
| ABERTO / EM_CONFERENCIA | IN_PROGRESS | Processo recebido e em análise documental |
| MAPA_AGENDADO | IN_PROGRESS | Fiscalização solicitada |
| DUE_REGISTRADA | IN_PROGRESS | DU-E registrada, aguardando desembaraço |
| DESEMBARACADO / AVERBADO | DONE | Libera a tarefa EXPORT_DECLARATION_REGISTERED |
| PENDENCIA / EXIGENCIA | BLOCKED | Gera alerta para a operação |

### 5.6 Perguntas para a primeira reunião

1. Vocês têm API aberta hoje? Qual a previsão de sandbox? Já integram com outros clientes?
2. Qual é o identificador do processo no sistema de vocês (e podemos enviar o nosso número de embarque como referência)?
3. O que acontece quando o MAPA reprova a amostra / aflatoxina fora do limite? Como isso aparece no status?
4. Documentos são devolvidos assinados/carimbados? Em qual formato (PDF, XML)?
5. Atendem todos os portos de origem que usaremos (Belém, Vila do Conde, Manaus, Santos...)?
6. Como é a cobrança: por processo, por contêiner, mensal? Há taxas extras (armazenagem, retificação de DU-E)?
7. Quais dados do exportador vocês exigem além dos que listamos na matriz de dados deste guia?

### 5.7 Testes de aceite (antes de ligar em produção)

- [ ] Abrir processo no sandbox com o payload real de um embarque e receber a referência do parceiro.
- [ ] Receber evento de mudança de status (webhook ou polling) refletido na timeline do embarque.
- [ ] Receber e baixar a DU-E e o certificado fitossanitário e vê-los na aba de documentos.
- [ ] Simular indisponibilidade do parceiro: o job deve entrar em retentativa e, ao voltar, concluir sem duplicar o processo (idempotência).
- [ ] Simular exigência/pendência: a tarefa deve ficar BLOQUEADA e a equipe de operações ser avisada.

### 5.8 Decisões em aberto

- Parceiro único ou um despachante por porto?
- Quem responde pelo custo de retificação de DU-E?
- Prazo máximo (SLA) aceitável para cada etapa.

### 5.9 Preço: o que pedir para a tabela

Para o serviço **Despachante** a tabela de tarifas precisa de:

| Chave de busca (match) | Valores (pricing) |
| --- | --- |
| `originPort` | `fixedFee`, `pctOfValue`, `currency` |

Mais **vigência** (início e fim). Tarifas cadastradas como "amostra" aparecem sinalizadas na simulação até serem substituídas pelas negociadas.

---

## 6. Transportadora marítima

> **Nota** — **Papel no fluxo:** Booking, confirmação de espaço, embarque, emissão do BL e rastreio do navio/contêiner até o destino.
> **Abordagem:** Integração por API: cotação opcional para a simulação, booking, confirmação de espaço, emissão do BL e rastreio contínuo (navio, viagem, contêineres, ETD/ETA, posição).
> **Nível de integração hoje:** Integração por API · **modo inicial sugerido:** API

### 6.1 O que a plataforma faz com este parceiro

| Etapa | Tarefa | Chave | Como o parceiro participa |
| --- | --- | --- | --- |
| Negócio | Booking marítimo confirmado | `MARITIME_BOOKING_CONFIRMED` | Enviamos `CREATE_BOOKING` |
| Mercadoria no porto | Espaço no navio confirmado | `VESSEL_SPACE_CONFIRMED` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria liberada | Carga embarcada no navio | `CARGO_LOADED` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria liberada | BL emitido | `BL_ISSUED` | Parceiro informa o andamento (webhook / link / consulta) |

Operações possíveis: `QUOTE`, `CREATE_BOOKING`, `SYNC_STATUS`, `SEND_DOCUMENT`, `CANCEL`. Alimenta o preço do serviço **Frete marítimo** na simulação (tabela interna ou API do parceiro — a "chave" é configurada no backoffice).

### 6.2 O que enviamos (dados e documentos)

Aplicamos **minimização de dados**: só vai para o parceiro o que está marcado abaixo (alimentado automaticamente pelo código — este quadro é sempre a verdade atual). Cada envio fica registrado em "Dados compartilhados" no backoffice.

| Origem | Bloco / seção | Item | Tipo | Obrigatório no cadastro |
| --- | --- | --- | --- | --- |
| Exportador | Endereços | Logradouro (por item da lista) | Campo | Sim |
| Exportador | Dados da empresa | Razão social | Campo | Sim |
| Exportador | Dados da empresa | Nome fantasia | Campo | Não |
| Exportador | Dados da empresa | CNPJ | Campo | Sim |
| Exportador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Exportador | Operação e produtos | Portos de embarque preferenciais | Campo | Sim |
| Exportador | Operação e produtos | Embalagens oferecidas | Campo | Não |
| Exportador | Representantes legais e signatários | Nome completo (por item da lista) | Campo | Sim |
| Importador | Documento | Certificado AEO (se houver) | Documento | Não |
| Importador | Endereços | Endereço (por item da lista) | Campo | Sim |
| Importador | Endereços | Cidade (por item da lista) | Campo | Sim |
| Importador | Endereços | Código postal (por item da lista) | Campo | Sim |
| Importador | Endereços | País (por item da lista) | Campo | Sim |
| Importador | Dados da empresa | Razão social | Campo | Sim |
| Importador | Dados da empresa | Nome fantasia | Campo | Não |
| Importador | Dados da empresa | País de registro | Campo | Sim |
| Importador | Dados da empresa | Tax ID / VAT | Campo | Sim |
| Importador | Dados da empresa | EORI (UE/Reino Unido) | Campo | Não |
| Importador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Importador | Importação, consignee e notify | Portos de destino preferenciais | Campo | Sim |
| Importador | Importação, consignee e notify | Consignee (nome no BL) | Campo | Sim |
| Importador | Importação, consignee e notify | Tax ID do consignee | Campo | Sim |
| Importador | Importação, consignee e notify | Endereço do consignee | Campo | Sim |
| Importador | Importação, consignee e notify | Notify party (nome) | Campo | Não |
| Importador | Importação, consignee e notify | Notify party (endereço) | Campo | Não |

Além do cadastro, sempre enviamos os dados da operação: número do embarque e do pedido, incoterm, quantidade, valor da fatura, contêineres e tipo, portos de origem/destino, data pretendida de embarque e dados do produto (nome, NCM, embalagem, safra). Documentos aprovados pelo compliance seguem como **links de download assinados, válidos por 24 horas**.

### 6.3 O que o parceiro devolve

- Confirmação de booking
- Bill of Lading (BL)
- Avisos de chegada / atualização de ETA

### 6.4 O que precisamos do parceiro (checklist)

- [ ] Documentação da API de booking, tracking e documentos; sandbox e credenciais.
- [ ] Escopo: armador próprio ou NVOCC? Quais rotas (origem→destino), tipos de contêiner (20DC, 40DC, 40HC) e frequência de saídas.
- [ ] Tabela de frete por rota e tipo de contêiner (valor por contêiner, sobretaxas, validade) — usada na simulação se o modo for TABELA; ou endpoint de cotação se for API.
- [ ] Modelo de eventos de rastreio (gate-in, carregado, zarpou, transbordo, chegada) e como mapear para os nossos status.
- [ ] Como o BL é emitido e entregue (original, telex release, sea waybill) e quem aprova a minuta.
- [ ] Webhook de tracking (ou frequência máxima de polling) e política de retentativa.
- [ ] Política de cancelamento / roll-over e custos associados.

### 6.5 Mapeamento de status (proposta a validar)

O parceiro fala os status dele; nós traduzimos para o status canônico da tarefa (`IN_PROGRESS`, `DONE`, `BLOCKED`). Preencha a coluna do parceiro na reunião e registre o resultado no campo `statusMap` da integração.

| Status do parceiro (exemplo) | Status canônico | Efeito |
| --- | --- | --- |
| BOOKING_REQUESTED | IN_PROGRESS | Solicitação recebida |
| BOOKING_CONFIRMED | DONE | Libera MARITIME_BOOKING_CONFIRMED (e envia vessel/voyage/ETD) |
| SPACE_CONFIRMED | DONE | Libera VESSEL_SPACE_CONFIRMED |
| LOADED | DONE | Libera CARGO_LOADED |
| BL_ISSUED | DONE | Libera BL_ISSUED; anexar o BL |
| ROLLED / CANCELLED | BLOCKED | Gera alerta; operação decide |

### 6.6 Perguntas para a primeira reunião

1. Há cotação em tempo real por API (necessária para a simulação instantânea) ou só tabela com validade?
2. Qual o prazo de resposta da cotação? (nossa simulação espera poucos segundos antes de usar a tabela de contingência)
3. Como identificamos o booking: número do armador, referência do cliente? Podemos enviar o nosso número de embarque?
4. Como recebemos o número dos contêineres e o selo antes do embarque?
5. Quais documentos o armador exige do exportador/importador (shipping instruction, VGM, consignee/notify)?
6. Como tratam mercadoria recusada no destino (devolução, abandono) e quem cobra?

### 6.7 Testes de aceite (antes de ligar em produção)

- [ ] Criar booking no sandbox com dados reais de um embarque e receber a referência.
- [ ] Receber evento de tracking e ver navio/viagem/ETA atualizados no card de rastreio.
- [ ] Receber o BL e baixá-lo; a tarefa BL_ISSUED fecha sozinha.
- [ ] Cotação por API: simular com a chave em PARTNER_API e conferir fallback para a tabela quando o parceiro demora.

### 6.8 Decisões em aberto

- Cotação por API ou tabela com validade mensal?
- Quem emite o BL e em que formato (original/telex)?
- Política de roll-over.

### 6.9 Preço: o que pedir para a tabela

Para o serviço **Frete marítimo** a tabela de tarifas precisa de:

| Chave de busca (match) | Valores (pricing) |
| --- | --- |
| `originPort`, `destinationPort`, `containerType` | `ratePerContainer`, `currency`, `transitDays`, `maxKgPerContainer`, `surchargePerContainer` |

Mais **vigência** (início e fim). Tarifas cadastradas como "amostra" aparecem sinalizadas na simulação até serem substituídas pelas negociadas.

---

## 7. Transportadora terrestre

> **Nota** — **Papel no fluxo:** Coleta a carga no exportador e entrega no porto/terminal de embarque.
> **Abordagem:** A plataforma repassa todas as informações; a integração é a definir. Começamos por e-mail/WhatsApp com link de resposta (portal-lite) e evoluímos para API se houver.
> **Nível de integração hoje:** A definir (começa por notificação/link) · **modo inicial sugerido:** EMAIL

### 7.1 O que a plataforma faz com este parceiro

| Etapa | Tarefa | Chave | Como o parceiro participa |
| --- | --- | --- | --- |
| Negócio | Transporte terrestre agendado | `LAND_TRANSPORT_SCHEDULED` | Enviamos `REQUEST_LAND_TRANSPORT` |
| Mercadoria pronta | Carga coletada | `CARGO_PICKED_UP` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria pronta | Carga entregue no porto/terminal | `CARGO_DELIVERED_TO_PORT` | Parceiro informa o andamento (webhook / link / consulta) |

Operações possíveis: `QUOTE`, `REQUEST_LAND_TRANSPORT`, `SYNC_STATUS`, `CANCEL`. Alimenta o preço do serviço **Frete terrestre** na simulação (tabela interna ou API do parceiro — a "chave" é configurada no backoffice).

### 7.2 O que enviamos (dados e documentos)

Aplicamos **minimização de dados**: só vai para o parceiro o que está marcado abaixo (alimentado automaticamente pelo código — este quadro é sempre a verdade atual). Cada envio fica registrado em "Dados compartilhados" no backoffice.

| Origem | Bloco / seção | Item | Tipo | Obrigatório no cadastro |
| --- | --- | --- | --- | --- |
| Exportador | Endereços | CEP (por item da lista) | Campo | Sim |
| Exportador | Endereços | Logradouro (por item da lista) | Campo | Sim |
| Exportador | Endereços | Número (por item da lista) | Campo | Sim |
| Exportador | Endereços | Bairro (por item da lista) | Campo | Não |
| Exportador | Endereços | Cidade (por item da lista) | Campo | Sim |
| Exportador | Endereços | UF (por item da lista) | Campo | Sim |
| Exportador | Endereços | É local de coleta da carga? (por item da lista) | Campo | Não |
| Exportador | Endereços | Horário de funcionamento / coleta (por item da lista) | Campo | Não |
| Exportador | Endereços | Estrutura de carga (doca, empilhadeira, balança...) (por item da lista) | Campo | Não |
| Exportador | Dados da empresa | Razão social | Campo | Sim |
| Exportador | Dados da empresa | Nome fantasia | Campo | Não |
| Exportador | Dados da empresa | CNPJ | Campo | Sim |
| Exportador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | WhatsApp (por item da lista) | Campo | Não |
| Exportador | Operação e produtos | Portos de embarque preferenciais | Campo | Sim |
| Exportador | Operação e produtos | Regiões de produção/extrativismo | Campo | Não |
| Exportador | Operação e produtos | Capacidade de armazenagem (ton) | Campo | Não |
| Exportador | Operação e produtos | Embalagens oferecidas | Campo | Não |
| Exportador | Operação e produtos | Prazo p/ ficar pronto após pedido (dias) | Campo | Sim |
| Exportador | Representantes legais e signatários | Nome completo (por item da lista) | Campo | Sim |
| Importador | Endereços | Endereço (por item da lista) | Campo | Sim |
| Importador | Endereços | Cidade (por item da lista) | Campo | Sim |
| Importador | Endereços | Código postal (por item da lista) | Campo | Sim |
| Importador | Endereços | País (por item da lista) | Campo | Sim |
| Importador | Dados da empresa | Razão social | Campo | Sim |
| Importador | Dados da empresa | Nome fantasia | Campo | Não |
| Importador | Dados da empresa | País de registro | Campo | Sim |
| Importador | Dados da empresa | Tax ID / VAT | Campo | Sim |
| Importador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |

Além do cadastro, sempre enviamos os dados da operação: número do embarque e do pedido, incoterm, quantidade, valor da fatura, contêineres e tipo, portos de origem/destino, data pretendida de embarque e dados do produto (nome, NCM, embalagem, safra). Documentos aprovados pelo compliance seguem como **links de download assinados, válidos por 24 horas**.

### 7.3 O que o parceiro devolve

- Confirmação de coleta agendada
- CT-e / comprovante de entrega no porto
- Fotos / canhoto (opcional)

### 7.4 O que precisamos do parceiro (checklist)

- [ ] Quais rotas atendem (UF/município de coleta → porto de embarque) e os tipos de veículo/carga.
- [ ] Tabela de preços (valor por tonelada, mínimo por viagem, pedágio/adicionais) com vigência — usada na simulação.
- [ ] Canal de recebimento das solicitações (e-mail, WhatsApp Business, sistema próprio/API) e responsável por turno.
- [ ] Prazo para confirmar a coleta e janela de coleta/entrega.
- [ ] Dados que precisam para a coleta (contato no exportador, endereço, janela, restrições de acesso, documentos do motorista/placa).
- [ ] Como informam: coleta realizada, entregue no porto, ocorrência (avaria, atraso).

### 7.5 Mapeamento de status (proposta a validar)

O parceiro fala os status dele; nós traduzimos para o status canônico da tarefa (`IN_PROGRESS`, `DONE`, `BLOCKED`). Preencha a coluna do parceiro na reunião e registre o resultado no campo `statusMap` da integração.

| Status do parceiro (exemplo) | Status canônico | Efeito |
| --- | --- | --- |
| COLETA_AGENDADA | DONE | Libera LAND_TRANSPORT_SCHEDULED |
| COLETADO | DONE | Libera CARGO_PICKED_UP |
| ENTREGUE_NO_PORTO | DONE | Libera CARGO_DELIVERED_TO_PORT |
| OCORRENCIA | BLOCKED | Alerta para operação |

### 7.6 Perguntas para a primeira reunião

1. Preferem receber por e-mail, WhatsApp ou ter acesso a um portal? Aceitam responder pelo nosso link (sem cadastro)?
2. Possuem API ou integração com TMS? Qual?
3. Como lidam com carga paletizada/big bag e janela de recebimento no terminal?
4. Há cobertura de seguro de transporte (RCTR-C) e responsabilidade em caso de avaria?

### 7.7 Testes de aceite (antes de ligar em produção)

- [ ] Receber e-mail/WhatsApp com o resumo da operação e o link de resposta.
- [ ] Responder pelo link (aceite, coleta, entrega) e ver a timeline atualizada.
- [ ] Link expirado/substituído deve ser recusado.

### 7.8 Decisões em aberto

- Canal definitivo (e-mail, WhatsApp ou API)?
- Tabela por UF→porto ou por faixa de distância?
- Quem contrata o seguro de transporte?

### 7.9 Preço: o que pedir para a tabela

Para o serviço **Frete terrestre** a tabela de tarifas precisa de:

| Chave de busca (match) | Valores (pricing) |
| --- | --- |
| `originState`, `destinationPort` | `ratePerTon`, `minCharge`, `currency`, `transitDays` |

Mais **vigência** (início e fim). Tarifas cadastradas como "amostra" aparecem sinalizadas na simulação até serem substituídas pelas negociadas.

---

## 8. Câmbio

> **Nota** — **Papel no fluxo:** Contrato de câmbio, recebimento do pagamento do importador e liberação ao exportador.
> **Abordagem:** A plataforma repassa as informações e acompanha o status; a plataforma NÃO movimenta dinheiro. Integração a definir (e-mail/portal-lite primeiro, API se houver).
> **Nível de integração hoje:** A definir (começa por notificação/link) · **modo inicial sugerido:** EMAIL

### 8.1 O que a plataforma faz com este parceiro

| Etapa | Tarefa | Chave | Como o parceiro participa |
| --- | --- | --- | --- |
| Negócio | Operação de câmbio aberta | `FX_CONTRACT_OPENED` | Enviamos `REQUEST_FX_CONTRACT` |
| Mercadoria liberada | Contrato de câmbio fechado | `FX_CONTRACT_SIGNED` | Parceiro informa o andamento (webhook / link / consulta) |
| Mercadoria liberada | Liberação do pagamento autorizada | `PAYMENT_RELEASE_AUTHORIZED` | Parceiro informa o andamento (webhook / link / consulta) |
| Pagamento | Pagamento recebido pelo exportador | `PAYMENT_RECEIVED` | Parceiro informa o andamento (webhook / link / consulta) |

Operações possíveis: `QUOTE`, `REQUEST_FX_CONTRACT`, `SYNC_STATUS`, `SEND_DOCUMENT`, `CANCEL`. Alimenta o preço do serviço **Câmbio** na simulação (tabela interna ou API do parceiro — a "chave" é configurada no backoffice).

### 8.2 O que enviamos (dados e documentos)

Aplicamos **minimização de dados**: só vai para o parceiro o que está marcado abaixo (alimentado automaticamente pelo código — este quadro é sempre a verdade atual). Cada envio fica registrado em "Dados compartilhados" no backoffice.

| Origem | Bloco / seção | Item | Tipo | Obrigatório no cadastro |
| --- | --- | --- | --- | --- |
| Exportador | Documento | Cartão CNPJ | Documento | Sim |
| Exportador | Documento | Contrato social e última alteração consolidada | Documento | Sim |
| Exportador | Documento | Certidão negativa de débitos federais (CND) | Documento | Sim |
| Exportador | Documento | Documento de identificação dos representantes (RG/CNH + CPF) | Documento | Sim |
| Exportador | Documento | Comprovante de endereço da sede | Documento | Sim |
| Exportador | Documento | Comprovante de dados bancários | Documento | Sim |
| Exportador | Documento | Procuração/autorização para operações de câmbio | Documento | Não |
| Exportador | Documento | Demonstrações financeiras (último exercício) | Documento | Não |
| Exportador | Endereços | Logradouro (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | Moeda (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | Banco (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | Código do banco (COMPE) (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | Agência (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | Conta (com dígito) (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | Tipo de conta (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | SWIFT/BIC do banco (por item da lista) | Campo | Não |
| Exportador | Dados bancários (recebimento do câmbio) | IBAN (se houver) (por item da lista) | Campo | Não |
| Exportador | Dados bancários (recebimento do câmbio) | Titular (por item da lista) | Campo | Sim |
| Exportador | Dados bancários (recebimento do câmbio) | CNPJ do titular (por item da lista) | Campo | Sim |
| Exportador | Dados da empresa | Razão social | Campo | Sim |
| Exportador | Dados da empresa | Nome fantasia | Campo | Não |
| Exportador | Dados da empresa | CNPJ | Campo | Sim |
| Exportador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | WhatsApp (por item da lista) | Campo | Não |
| Exportador | Operação e produtos | Valor médio por embarque (USD) | Campo | Sim |
| Exportador | Operação e produtos | Condições de pagamento aceitas | Campo | Sim |
| Exportador | Representantes legais e signatários | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | CPF (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | Data de nascimento (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | Poder de assinatura (por item da lista) | Campo | Sim |
| Exportador | Representantes legais e signatários | É pessoa politicamente exposta (PEP)? (por item da lista) | Campo | Sim |
| Exportador | Quadro societário e beneficiários finais | Nome / razão social (por item da lista) | Campo | Sim |
| Exportador | Quadro societário e beneficiários finais | CPF / CNPJ (por item da lista) | Campo | Sim |
| Exportador | Quadro societário e beneficiários finais | Participação (%) (por item da lista) | Campo | Sim |
| Exportador | Quadro societário e beneficiários finais | É beneficiário final? (por item da lista) | Campo | Sim |
| Exportador | Quadro societário e beneficiários finais | É PEP? (por item da lista) | Campo | Sim |
| Importador | Documento | Extrato do registro comercial (certificate of incorporation) | Documento | Sim |
| Importador | Documento | Comprovante de Tax ID / VAT | Documento | Sim |
| Importador | Documento | Estatuto / contrato social | Documento | Sim |
| Importador | Documento | Passaporte/ID dos signatários | Documento | Sim |
| Importador | Documento | Declaração de beneficiários finais (UBO) assinada | Documento | Sim |
| Importador | Documento | Comprovante de endereço | Documento | Sim |
| Importador | Documento | Carta de referência bancária | Documento | Sim |
| Importador | Documento | Demonstrações financeiras (último exercício) | Documento | Não |
| Importador | Endereços | Endereço (por item da lista) | Campo | Sim |
| Importador | Endereços | Cidade (por item da lista) | Campo | Sim |
| Importador | Endereços | Código postal (por item da lista) | Campo | Sim |
| Importador | Endereços | País (por item da lista) | Campo | Sim |
| Importador | Dados bancários (pagamento) | Moeda (por item da lista) | Campo | Sim |
| Importador | Dados bancários (pagamento) | Banco (por item da lista) | Campo | Sim |
| Importador | Dados bancários (pagamento) | País do banco (por item da lista) | Campo | Sim |
| Importador | Dados bancários (pagamento) | SWIFT/BIC (por item da lista) | Campo | Sim |
| Importador | Dados bancários (pagamento) | IBAN / nº da conta (por item da lista) | Campo | Não |
| Importador | Dados bancários (pagamento) | Nº da conta (se não houver IBAN) (por item da lista) | Campo | Não |
| Importador | Dados bancários (pagamento) | Titular (por item da lista) | Campo | Sim |
| Importador | Dados da empresa | Razão social | Campo | Sim |
| Importador | Dados da empresa | Nome fantasia | Campo | Não |
| Importador | Dados da empresa | País de registro | Campo | Sim |
| Importador | Dados da empresa | Tax ID / VAT | Campo | Sim |
| Importador | Dados da empresa | Nº do registro comercial | Campo | Sim |
| Importador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | WhatsApp (por item da lista) | Campo | Não |
| Importador | Informações financeiras e crédito | Faturamento anual (USD) | Campo | Sim |
| Importador | Informações financeiras e crédito | Já teve atraso/inadimplência com fornecedores nos últimos 3 anos? | Campo | Sim |
| Importador | Perfil de compra | Valor médio por pedido (USD) | Campo | Sim |
| Importador | Perfil de compra | Condições de pagamento aceitas | Campo | Sim |
| Importador | Signatários autorizados | Nome completo (por item da lista) | Campo | Sim |
| Importador | Signatários autorizados | Nacionalidade (por item da lista) | Campo | Sim |
| Importador | Signatários autorizados | Data de nascimento (por item da lista) | Campo | Sim |
| Importador | Signatários autorizados | Nº do passaporte / ID (por item da lista) | Campo | Sim |
| Importador | Signatários autorizados | É pessoa politicamente exposta (PEP)? (por item da lista) | Campo | Sim |
| Importador | Beneficiários finais (UBO) | Nome / razão social (por item da lista) | Campo | Sim |
| Importador | Beneficiários finais (UBO) | Participação (%) (por item da lista) | Campo | Sim |
| Importador | Beneficiários finais (UBO) | É PEP? (por item da lista) | Campo | Sim |

Além do cadastro, sempre enviamos os dados da operação: número do embarque e do pedido, incoterm, quantidade, valor da fatura, contêineres e tipo, portos de origem/destino, data pretendida de embarque e dados do produto (nome, NCM, embalagem, safra). Documentos aprovados pelo compliance seguem como **links de download assinados, válidos por 24 horas**.

### 8.3 O que o parceiro devolve

- Contrato de câmbio
- Comprovante SWIFT / confirmação de recebimento
- Liquidação do câmbio

### 8.4 O que precisamos do parceiro (checklist)

- [ ] Instituição autorizada pelo Banco Central a operar câmbio de exportação, produtos (ACC/ACE, câmbio pronto, antecipação) e documentação exigida.
- [ ] Lista de documentos e dados de KYC do exportador e do importador que a instituição exige (ver matriz de dados).
- [ ] Tabela de custos: spread (%) e tarifa fixa por operação, por moeda (USD/EUR/BRL), com vigência.
- [ ] Fluxo e prazos: abertura da operação, assinatura do contrato, recebimento do pagamento, liquidação.
- [ ] Canal de recebimento (e-mail, portal, API) e como informam cada marco.
- [ ] Contato de compliance/PLD e política de sanções.

### 8.5 Mapeamento de status (proposta a validar)

O parceiro fala os status dele; nós traduzimos para o status canônico da tarefa (`IN_PROGRESS`, `DONE`, `BLOCKED`). Preencha a coluna do parceiro na reunião e registre o resultado no campo `statusMap` da integração.

| Status do parceiro (exemplo) | Status canônico | Efeito |
| --- | --- | --- |
| OPERACAO_ABERTA | DONE | Libera FX_CONTRACT_OPENED |
| CONTRATO_ASSINADO | DONE | Libera FX_CONTRACT_SIGNED |
| PAGAMENTO_AUTORIZADO | DONE | Libera PAYMENT_RELEASE_AUTHORIZED |
| PAGAMENTO_RECEBIDO / LIQUIDADO | DONE | Libera PAYMENT_RECEIVED e encerra o embarque |
| PENDENCIA_COMPLIANCE | BLOCKED | Alerta para operação |

### 8.6 Perguntas para a primeira reunião

1. Em quais modalidades operam e qual é o limite/valor mínimo por operação?
2. Quais comprovantes do importador são necessários antes de abrir a operação?
3. Como informam o recebimento do pagamento (e quando liberam os recursos ao exportador)?
4. Há API (cotação, abertura de operação, status)? Se sim, sandbox?
5. Quem assina o contrato de câmbio e como (certificado digital, assinatura eletrônica)?

### 8.7 Testes de aceite (antes de ligar em produção)

- [ ] Receber a solicitação com os dados mínimos e confirmar o aceite (portal-lite ou API).
- [ ] Registrar o contrato de câmbio (documento) e a data de liquidação.
- [ ] Disparar o fluxo de NÃO PAGAMENTO e ver a notificação ao câmbio/seguro.

### 8.8 Decisões em aberto

- Modalidade de câmbio padrão?
- Responsável pelo risco de crédito do importador?
- Política para operações em EUR.

### 8.9 Preço: o que pedir para a tabela

Para o serviço **Câmbio** a tabela de tarifas precisa de:

| Chave de busca (match) | Valores (pricing) |
| --- | --- |
| `currency` | `spreadPct`, `fixedFee`, `currency` |

Mais **vigência** (início e fim). Tarifas cadastradas como "amostra" aparecem sinalizadas na simulação até serem substituídas pelas negociadas.

---

## 9. Seguro

> **Nota** — **Papel no fluxo:** Cotação e emissão do seguro da mercadoria (e, futuramente, de crédito/pagamento e safra).
> **Abordagem:** A princípio por e-mail/WhatsApp para o responsável pelo seguro, com link de resposta (portal-lite); o objetivo é chegar a um preço TABELADO (taxa % com prêmio mínimo) para a simulação não depender de cotação manual.
> **Nível de integração hoje:** Notificação (e-mail/WhatsApp) + link de resposta · **modo inicial sugerido:** EMAIL

### 9.1 O que a plataforma faz com este parceiro

| Etapa | Tarefa | Chave | Como o parceiro participa |
| --- | --- | --- | --- |
| Negócio | Seguro emitido | `INSURANCE_ISSUED` | Enviamos `REQUEST_INSURANCE` |
| Não pagamento | Sinistro aberto na seguradora | `INSURANCE_CLAIM_OPENED` | Enviamos `REQUEST_INSURANCE` |
| Mercadoria recusada | Sinistro aberto na seguradora | `INSURANCE_CLAIM_OPENED` | Enviamos `REQUEST_INSURANCE` |

Operações possíveis: `QUOTE`, `REQUEST_INSURANCE`, `SEND_DOCUMENT`. Alimenta o preço do serviço **Seguro** na simulação (tabela interna ou API do parceiro — a "chave" é configurada no backoffice).

### 9.2 O que enviamos (dados e documentos)

Aplicamos **minimização de dados**: só vai para o parceiro o que está marcado abaixo (alimentado automaticamente pelo código — este quadro é sempre a verdade atual). Cada envio fica registrado em "Dados compartilhados" no backoffice.

| Origem | Bloco / seção | Item | Tipo | Obrigatório no cadastro |
| --- | --- | --- | --- | --- |
| Exportador | Documento | Cartão CNPJ | Documento | Sim |
| Exportador | Documento | Demonstrações financeiras (último exercício) | Documento | Não |
| Exportador | Documento | Apólice de seguro vigente (se houver) | Documento | Não |
| Exportador | Endereços | Logradouro (por item da lista) | Campo | Sim |
| Exportador | Dados da empresa | Razão social | Campo | Sim |
| Exportador | Dados da empresa | Nome fantasia | Campo | Não |
| Exportador | Dados da empresa | CNPJ | Campo | Sim |
| Exportador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Exportador | Contatos operacionais | WhatsApp (por item da lista) | Campo | Não |
| Exportador | Seguros e histórico de risco | Possui seguro de carga? | Campo | Sim |
| Exportador | Seguros e histórico de risco | Seguradora atual | Campo | Não |
| Exportador | Seguros e histórico de risco | Possui seguro de crédito à exportação? | Campo | Sim |
| Exportador | Seguros e histórico de risco | Sinistros nos últimos 3 anos | Campo | Sim |
| Exportador | Seguros e histórico de risco | Descreva os sinistros | Campo | Não |
| Exportador | Operação e produtos | Principais produtos | Campo | Sim |
| Exportador | Operação e produtos | Valor médio por embarque (USD) | Campo | Sim |
| Exportador | Representantes legais e signatários | Nome completo (por item da lista) | Campo | Sim |
| Exportador | Quadro societário e beneficiários finais | Nome / razão social (por item da lista) | Campo | Sim |
| Exportador | Quadro societário e beneficiários finais | CPF / CNPJ (por item da lista) | Campo | Sim |
| Importador | Documento | Demonstrações financeiras (último exercício) | Documento | Não |
| Importador | Documento | Cartas de referência comercial | Documento | Não |
| Importador | Endereços | Endereço (por item da lista) | Campo | Sim |
| Importador | Endereços | Cidade (por item da lista) | Campo | Sim |
| Importador | Endereços | Código postal (por item da lista) | Campo | Sim |
| Importador | Endereços | País (por item da lista) | Campo | Sim |
| Importador | Dados da empresa | Razão social | Campo | Sim |
| Importador | Dados da empresa | Nome fantasia | Campo | Não |
| Importador | Dados da empresa | País de registro | Campo | Sim |
| Importador | Dados da empresa | Tax ID / VAT | Campo | Sim |
| Importador | Contatos operacionais | Nome completo (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | E-mail (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | Telefone (por item da lista) | Campo | Sim |
| Importador | Contatos operacionais | WhatsApp (por item da lista) | Campo | Não |
| Importador | Informações financeiras e crédito | Faturamento anual (USD) | Campo | Sim |
| Importador | Informações financeiras e crédito | Rating de crédito (Dun & Bradstreet, Creditsafe...) | Campo | Não |
| Importador | Informações financeiras e crédito | Número D-U-N-S | Campo | Não |
| Importador | Informações financeiras e crédito | Já teve atraso/inadimplência com fornecedores nos últimos 3 anos? | Campo | Sim |
| Importador | Perfil de compra | Valor médio por pedido (USD) | Campo | Sim |
| Importador | Perfil de compra | Exige seguro da mercadoria? | Campo | Sim |
| Importador | Beneficiários finais (UBO) | Nome / razão social (por item da lista) | Campo | Sim |

Além do cadastro, sempre enviamos os dados da operação: número do embarque e do pedido, incoterm, quantidade, valor da fatura, contêineres e tipo, portos de origem/destino, data pretendida de embarque e dados do produto (nome, NCM, embalagem, safra). Documentos aprovados pelo compliance seguem como **links de download assinados, válidos por 24 horas**.

### 9.3 O que o parceiro devolve

- Apólice / certificado de seguro
- Endosso (se houver)
- Comunicação de sinistro (NÃO PAGAMENTO / MERCADORIA RECUSADA)

### 9.4 O que precisamos do parceiro (checklist)

- [ ] Produto e coberturas oferecidas (all risks, riscos nomeados), exclusões, franquias e limites por embarque.
- [ ] Tabela de preços: taxa (% do valor segurado), prêmio mínimo, adicional sobre o valor (usamos 110% = CIF + 10%), por rota/moeda/commodity, com vigência.
- [ ] Dados exigidos para emitir a apólice (valor segurado, descrição da carga, embalagem, trânsito, navio, data do embarque).
- [ ] Prazo para emitir a apólice após o pedido e canal oficial (e-mail/WhatsApp/portal/API).
- [ ] Processo de sinistro: documentos, prazo, contato; cobertura de crédito/não pagamento (se oferecida) e de mercadoria recusada.
- [ ] Existe API de cotação/emissão? Sandbox?

### 9.5 Mapeamento de status (proposta a validar)

O parceiro fala os status dele; nós traduzimos para o status canônico da tarefa (`IN_PROGRESS`, `DONE`, `BLOCKED`). Preencha a coluna do parceiro na reunião e registre o resultado no campo `statusMap` da integração.

| Status do parceiro (exemplo) | Status canônico | Efeito |
| --- | --- | --- |
| SOLICITACAO_RECEBIDA | IN_PROGRESS | Parceiro aceitou a solicitação |
| APOLICE_EMITIDA | DONE | Libera INSURANCE_ISSUED; anexar a apólice |
| SINISTRO_ABERTO | DONE | Libera INSURANCE_CLAIM_OPENED nos ramos de exceção |
| RECUSADO / PENDENTE_DADOS | BLOCKED | Alerta para operação |

### 9.6 Perguntas para a primeira reunião

1. Podem fornecer uma tabela fixa por rota para a simulação? Qual validade e frequência de reajuste?
2. A apólice é por embarque ou aberta (averbações)? Como averbamos?
3. Cobrem a rota Amazônia → Europa/EUA/Ásia? Há restrições para castanha (umidade, mofo, contaminação)?
4. Como funciona o sinistro quando o importador não paga ou recusa a carga?

### 9.7 Testes de aceite (antes de ligar em produção)

- [ ] Receber o e-mail/WhatsApp com todos os dados e os links de documentos válidos por 24 h.
- [ ] Responder pelo link: aceitar, enviar a apólice (PDF) e marcar como emitida.
- [ ] Sinistro: ao declarar NÃO PAGAMENTO, o seguro recebe a solicitação com o dossiê.

### 9.8 Decisões em aberto

- Tabela fixa ou cotação por operação?
- Apólice por embarque ou aberta?
- Cobertura de crédito entra agora ou fase 2?

### 9.9 Preço: o que pedir para a tabela

Para o serviço **Seguro** a tabela de tarifas precisa de:

| Chave de busca (match) | Valores (pricing) |
| --- | --- |
| `coverage` | `ratePct`, `minPremium`, `currency`, `insuredValueMarkupPct` |

Mais **vigência** (início e fim). Tarifas cadastradas como "amostra" aparecem sinalizadas na simulação até serem substituídas pelas negociadas.

---

## 10. Contrato técnico que oferecemos

### 10.1 Webhook de entrada (parceiro → plataforma)

Qualquer parceiro pode nos enviar eventos neste formato canônico, sem trabalho adicional de código nosso. Se o parceiro tiver formato próprio, o time implementa um adapter que traduz para os mesmos eventos.

- **Endpoint:** `POST {PUBLIC_API_URL}/webhooks/{partnerKey}` (a `partnerKey` aparece no backoffice, em Parceiros).
- **Assinatura:** cabeçalhos `x-at-timestamp` (epoch em segundos) e `x-at-signature: sha256=<hex>` = HMAC-SHA256 do texto `"<timestamp>.<corpo bruto>"` com o **segredo de webhook** (gerado no backoffice; entregue ao parceiro uma única vez).
- **Tolerância de relógio:** 5 minutos. Fora disso → 401.
- **Idempotência / anti-replay:** `eventId` único por entrega; reenvio do mesmo `eventId` é ignorado (200 com `duplicate: true`).
- **Respostas:** 200 aplicado · 401 assinatura inválida · 400 payload inválido · 404 parceiro desconhecido/desabilitado · 422 nada foi aplicado (ex.: embarque desconhecido) — nesse caso o parceiro **pode reenviar** o mesmo `eventId` depois.
- **Tipos de evento:** `REQUEST_ACCEPTED`, `REQUEST_REJECTED`, `TASK_STATUS`, `TRACKING_UPDATE`, `DOCUMENT_AVAILABLE`, `QUOTE_RECEIVED`, `ISSUE_REPORTED`.
- **Status canônicos de tarefa:** `PENDING`, `IN_PROGRESS`, `DONE`, `BLOCKED`, `SKIPPED`. Se o parceiro envia o status dele em `partnerStatus`, traduzimos pelo `statusMap` configurado.
- **Identificação:** `shipmentRef` (nosso número SH-…), `externalRef` (referência do parceiro) e/ou `taskKey`. Um parceiro só consegue atualizar tarefas do **seu** tipo.
- **Documentos:** `document.contentBase64` ou `document.url` (o host da URL precisa estar liberado na configuração da integração — `baseUrl` ou `documentHosts`).
- Eventos tardios ou duplicados **nunca reabrem** uma tarefa já concluída.

```http

POST {PUBLIC_API_URL}/webhooks/{partnerKey}
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
}

```

```js

// Node.js — assinatura do corpo bruto (string exata enviada)
import { createHmac } from 'node:crypto'
const ts = Math.floor(Date.now() / 1000)
const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(`${ts}.${rawBody}`).digest('hex')
// headers: x-at-timestamp: ts   x-at-signature: signature

```

### 10.2 Chamada de saída (plataforma → parceiro com API)

O adapter HTTP genérico envia o contrato abaixo; os adapters de despachante e marítimo reutilizam o mesmo corpo com um envelope próprio (**mapeamento provisório até recebermos a documentação real de cada parceiro**). Tudo é configurável por integração: `baseUrl`, `endpoints`, `auth`, `headers`, `statusMap`.

```http

POST {baseUrl}{endpoints.dispatch.path}      (padrão: /requests no adapter http-generic)
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
Consulta de status:      GET {baseUrl}/requests/{externalRef}  →  { "status": "CONFIRMED" }  ou  { "events": [ … ] }

```

### 10.3 Confiabilidade

- Toda chamada passa por uma **fila persistente (outbox)** com chave de idempotência — nada é perdido se o parceiro estiver fora do ar.
- **Retentativas** com espera exponencial e variação aleatória: 30 s, 1 min, 2 min, 4 min… (teto de 6 h). Padrão: 6 tentativas; ao esgotar, o job vira **falha definitiva**, a tarefa fica bloqueada e a operação é notificada. Erros 4xx (exceto 408/425/429) não são repetidos.
- **Timeout** padrão de 15 s por chamada (configurável por integração).
- Operações pode **reprocessar** jobs, **cancelar** ou gerar um **novo link de resposta** direto no backoffice (Fila de integrações).
- **Logs de integração** guardam requisição/resposta com dados sensíveis mascarados, tempo e correlação.

### 10.4 Cotação por API (opcional)

Se o parceiro oferecer cotação, enviamos `service`, portos, UF de origem, quantidade, nº/tipo de contêineres, valor da mercadoria (USD) e moeda, e esperamos `{ amount, currency, validUntil?, transitDays? }` em poucos segundos. Acima do tempo-limite a simulação usa a tabela de contingência (se habilitada).

## 11. Privacidade e minimização de dados (LGPD)

- Cada parceiro recebe **somente** os campos e documentos marcados para o tipo dele (quadros das seções 5–9).
- Documentos vão como **links assinados com validade de 24 h**; nunca anexos permanentes.
- Cada envio é registrado em **Dados compartilhados** (quem, o quê, quando e para qual finalidade) — base para atender titulares e auditorias.
- Segredos de integração são **criptografados** em repouso (AES-256-GCM) e nunca voltam para a tela.
- O ambiente de **produção nunca usa o parceiro simulado (sandbox)**.

> **Atenção** — Revisar com o jurídico/DPO: base legal por parceiro, retenção após o fim do embarque e eventual transferência internacional (importador e transportadora marítima).

## 12. Reunião de kickoff e modelo de e-mail

### 12.1 Roteiro (45–60 min)

1. Apresentar o fluxo da plataforma e onde o parceiro entra (seção 2).
2. Entender como o parceiro opera hoje e o que já automatiza.
3. Definir o **modo de integração** (seção 3) e o plano de evolução.
4. Revisar o quadro "o que enviamos" e ajustar dados/documentos.
5. Mapear status do parceiro → status canônicos.
6. Alinhar documentação, sandbox, credenciais e cronograma.
7. Preço: tabela × API; vigência e reajuste.
8. Definir SLAs, contatos, exceções e próximos passos com datas.

### 12.2 Modelo de e-mail de abertura

```text

Assunto: Amazon Trade × {Parceiro} — alinhamento de integração

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
{Seu nome} — Amazon Trade

```

## 13. Quadro de acompanhamento

Preencha uma linha por parceiro e atualize a cada reunião.

| Parceiro | Contato | Modo definido | Docs/sandbox | Mapa de status | Tabela de preço | DPA assinado | Teste de aceite | Produção |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Despachante aduaneiro | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Transportadora marítima | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Transportadora terrestre | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Câmbio | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Seguro | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

### 13.1 Planilha de tarifas a pedir (resumo)

| Serviço | Chave de busca | Valores |
| --- | --- | --- |
| Frete marítimo | `originPort`, `destinationPort`, `containerType` | `ratePerContainer`, `currency`, `transitDays`, `maxKgPerContainer`, `surchargePerContainer` |
| Frete terrestre | `originState`, `destinationPort` | `ratePerTon`, `minCharge`, `currency`, `transitDays` |
| Seguro | `coverage` | `ratePct`, `minPremium`, `currency`, `insuredValueMarkupPct` |
| Câmbio | `currency` | `spreadPct`, `fixedFee`, `currency` |
| Despachante | `originPort` | `fixedFee`, `pctOfValue`, `currency` |
| Terminal / laudos na origem | `originPort` | `perContainer`, `currency` |
| Tributos de importação (estimativa) | `country` | `dutyPct`, `vatPct`, `otherPct` |
| Taxa da plataforma | — | `pct`, `minFee`, `currency` |

### 13.2 Glossário

| Termo | Significado |
| --- | --- |
| Embarque (SH-…) | Operação de exportação criada quando o exportador confirma um pedido. |
| Etapa / tarefa | Fase do embarque e passos dentro dela; avançam quando as tarefas obrigatórias terminam. |
| taskKey | Identificador estável da tarefa (ex.: `BL_ISSUED`) usado em webhooks e links. |
| externalRef | Referência do parceiro (booking, processo, apólice) guardada na tarefa. |
| Outbox / job | Fila persistente de chamadas a parceiros, com retentativas. |
| Adapter | Peça de código que sabe falar com um tipo de parceiro/modo. |
| portal-lite | Link único para parceiro sem API responder sem criar conta. |
| Chave tabela × API | Configuração por serviço que define a origem do preço na simulação. |
| Incoterm | Regra de quem paga frete/seguro: FOB, CFR ou CIF. |

### 13.3 Referências no repositório

- `docs/arquitetura-integracoes.md` — política e estrutura técnica das integrações.
- `docs/openapi.json` — contrato completo da API da plataforma.
- `packages/shared/src/requirements.ts` — registro que liga cada campo/documento aos parceiros.
- `packages/shared/src/stages.ts` — etapas e tarefas do embarque.
