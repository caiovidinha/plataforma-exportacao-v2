import { loadConfig, type Config } from './config'
import type { AppContext } from './context'
import { createDb } from './db/client'
import { createMailer } from './lib/mail'
import { createStorage } from './lib/storage'
import { registerDefaultAdapters } from './modules/integrations/adapters'
import { AdapterRegistry } from './modules/integrations/registry'

/** Monta o contexto da aplicação (db, mail, storage, adapters). */
export async function createContext(overrides: Partial<Config> = {}, parts: Partial<AppContext> = {}): Promise<AppContext & { close: () => Promise<void> }> {
  const config = { ...loadConfig(), ...overrides }
  const handle = parts.db ? null : await createDb(config)
  if (handle) await handle.migrate()
  const ctx: AppContext = {
    config,
    db: parts.db ?? handle!.db,
    mailer: parts.mailer ?? createMailer(config),
    storage: parts.storage ?? createStorage(config),
    adapters: parts.adapters ?? new AdapterRegistry(),
    now: parts.now ?? (() => new Date()),
  }
  if (!parts.adapters) registerDefaultAdapters(ctx)
  return Object.assign(ctx, { close: async () => void (await handle?.close()) })
}
