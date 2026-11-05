import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import pg from 'pg'
import type { Config } from '../config'
import * as schema from './schema'

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>
/** Cliente de transação ou o próprio db (ambos aceitam as mesmas queries). */
export type DbOrTx = Pick<Db, 'select' | 'insert' | 'update' | 'delete' | 'execute' | 'transaction'>

export interface DbHandle {
  db: Db
  driver: 'pg' | 'pglite'
  migrate(): Promise<void>
  close(): Promise<void>
}

function migrationsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    process.env.MIGRATIONS_DIR,
    path.resolve(here, '../../drizzle'), // src/db -> apps/api/drizzle
    path.resolve(here, '../drizzle'), // dist -> apps/api/drizzle
    path.resolve(process.cwd(), 'drizzle'),
  ].filter(Boolean) as string[]
  const found = candidates.find((c) => existsSync(path.join(c, 'meta', '_journal.json')))
  if (!found) throw new Error(`Pasta de migrations não encontrada. Rode "npm run db:generate". Procurado em: ${candidates.join(', ')}`)
  return found
}

export async function createDb(cfg: Pick<Config, 'DB_DRIVER' | 'DATABASE_URL' | 'PGLITE_DATA_DIR'>): Promise<DbHandle> {
  if (cfg.DB_DRIVER === 'pg') {
    const pool = new pg.Pool({ connectionString: cfg.DATABASE_URL, max: 10 })
    const db = drizzlePg(pool, { schema })
    return {
      db: db as unknown as Db,
      driver: 'pg',
      migrate: () => migratePg(db, { migrationsFolder: migrationsDir() }),
      close: () => pool.end(),
    }
  }

  const dir = cfg.PGLITE_DATA_DIR
  const inMemory = dir.startsWith('memory://')
  if (!inMemory) mkdirSync(path.resolve(dir), { recursive: true })
  const client = new PGlite(inMemory ? undefined : path.resolve(dir))
  await client.waitReady
  const db = drizzlePglite(client, { schema })
  return {
    db: db as unknown as Db,
    driver: 'pglite',
    migrate: () => migratePglite(db, { migrationsFolder: migrationsDir() }),
    close: () => client.close(),
  }
}
