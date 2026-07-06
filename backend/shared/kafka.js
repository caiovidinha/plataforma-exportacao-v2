// Helper Kafka compartilhado (kafkajs). Producer/consumer + publish/subscribe
// com envelope de evento padrão (event_id, event_type, occurred_at, data).
const { Kafka } = require('kafkajs')
const crypto = require('crypto')
const { EVENT_TOPIC } = require('./events')

function createKafka(clientId) {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
  return new Kafka({ clientId, brokers, retry: { retries: 8 } })
}

async function makeProducer(clientId) {
  const producer = createKafka(clientId).producer()
  await producer.connect()
  return {
    /** Publica um evento no tópico correto conforme EVENT_TOPIC. */
    async publish(eventType, data, key) {
      const topic = EVENT_TOPIC[eventType]
      if (!topic) throw new Error(`Tópico desconhecido para evento ${eventType}`)
      const envelope = {
        event_id: `evt_${crypto.randomUUID()}`,
        event_type: eventType,
        occurred_at: new Date().toISOString(),
        data,
      }
      await producer.send({
        topic,
        messages: [{ key: key || envelope.event_id, value: JSON.stringify(envelope) }],
      })
      console.log(`[${clientId}] → ${eventType}`)
      return envelope
    },
    disconnect: () => producer.disconnect(),
  }
}

/**
 * Assina um tópico e chama handler(eventType, data, envelope) para cada mensagem.
 * groupId garante que cada serviço receba o evento uma vez (consumer group).
 */
async function subscribe(clientId, groupId, topics, handler) {
  const consumer = createKafka(clientId).consumer({ groupId })
  await consumer.connect()
  for (const t of topics) await consumer.subscribe({ topic: t, fromBeginning: false })
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const env = JSON.parse(message.value.toString())
        await handler(env.event_type, env.data, env)
      } catch (err) {
        console.error(`[${clientId}] erro ao processar evento:`, err.message)
      }
    },
  })
  return consumer
}

module.exports = { makeProducer, subscribe }
