// ============================================================
// Feature Flags — centraliza o controle em um único lugar.
// A flag NEXT_PUBLIC_USE_MOCK_DATA no .env.local controla tudo.
// ============================================================

export const featureFlags = {
  /**
   * Quando `true`, todos os serviços de dados usam o mock local
   * (src/mock/data.json) em vez de chamar a API real.
   * Alterne em .env.local: NEXT_PUBLIC_USE_MOCK_DATA=true|false
   */
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',

  /**
   * Ativa exibição de warnings de cadastro no MAPA.
   * Deve permanecer true em produção.
   */
  mapaRegistrationWarning: true,

  /**
   * Integração Gov.br para assinatura digital
   */
  govbrSignature: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true',

  /**
   * Sincronização com SISCOMEX
   */
  siscomexIntegration: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true',

  /**
   * Chat em tempo real (WebSocket)
   */
  realtimeChat: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true',
} as const

export type FeatureFlags = typeof featureFlags
