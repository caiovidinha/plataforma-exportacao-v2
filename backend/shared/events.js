// Contrato de eventos compartilhado entre os microsserviços.
// Fonte única da verdade para nomes de tópicos e tipos de evento Kafka.

const TOPICS = {
  ORDERS: 'orders',
  WORKFLOWS: 'workflows',
  DOCUMENTS: 'documents',
  CUSTOMS: 'customs',   // eventos vindos da API do despachante
  SHIPPING: 'shipping', // eventos vindos da API da navegação
}

const EVENTS = {
  // order-service
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_REJECTED: 'order.rejected',
  // workflow-service
  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_STEP_COMPLETED: 'workflow.step.completed',
  WORKFLOW_BLOCKED: 'workflow.blocked',
  // document-service (fase futura)
  DOCUMENT_EMITTED: 'document.emitted',
  DOCUMENT_SIGNED: 'document.signed',
  // integração despachante (ver docs/api-despachante-navegacao.md)
  CUSTOMS_DUE_REGISTERED: 'customs.due.registered',
  CUSTOMS_STATUS_CHANGED: 'customs.status.changed',
  // integração navegação
  SHIPPING_BOOKED: 'shipping.booked',
  SHIPPING_BL_DRAFTED: 'shipping.bl.drafted',
  SHIPPING_BL_RELEASED: 'shipping.bl.released',
  SHIPPING_CONTAINER_EVENT: 'shipping.container.event',
  SHIPPING_ARRIVED: 'shipping.arrived',
}

// Mapeia cada tipo de evento ao tópico onde é publicado.
const EVENT_TOPIC = {
  [EVENTS.ORDER_CREATED]: TOPICS.ORDERS,
  [EVENTS.ORDER_CONFIRMED]: TOPICS.ORDERS,
  [EVENTS.ORDER_REJECTED]: TOPICS.ORDERS,
  [EVENTS.WORKFLOW_STARTED]: TOPICS.WORKFLOWS,
  [EVENTS.WORKFLOW_STEP_COMPLETED]: TOPICS.WORKFLOWS,
  [EVENTS.WORKFLOW_BLOCKED]: TOPICS.WORKFLOWS,
  [EVENTS.DOCUMENT_EMITTED]: TOPICS.DOCUMENTS,
  [EVENTS.DOCUMENT_SIGNED]: TOPICS.DOCUMENTS,
  [EVENTS.CUSTOMS_DUE_REGISTERED]: TOPICS.CUSTOMS,
  [EVENTS.CUSTOMS_STATUS_CHANGED]: TOPICS.CUSTOMS,
  [EVENTS.SHIPPING_BOOKED]: TOPICS.SHIPPING,
  [EVENTS.SHIPPING_BL_DRAFTED]: TOPICS.SHIPPING,
  [EVENTS.SHIPPING_BL_RELEASED]: TOPICS.SHIPPING,
  [EVENTS.SHIPPING_CONTAINER_EVENT]: TOPICS.SHIPPING,
  [EVENTS.SHIPPING_ARRIVED]: TOPICS.SHIPPING,
}

module.exports = { TOPICS, EVENTS, EVENT_TOPIC }
