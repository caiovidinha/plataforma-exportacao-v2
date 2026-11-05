import type { Config } from './config'
import type { Db } from './db/client'
import type { Mailer } from './lib/mail'
import type { StorageAdapter } from './lib/storage'
import type { AdapterRegistry } from './modules/integrations/registry'

/** Dependências compartilhadas por serviços e rotas (injeção simples, fácil de trocar em testes). */
export interface AppContext {
  config: Config
  db: Db
  mailer: Mailer
  storage: StorageAdapter
  adapters: AdapterRegistry
  now: () => Date
}
