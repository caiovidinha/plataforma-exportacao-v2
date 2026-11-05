import { loadConfig } from '../config'
import { createDb } from './client'

const cfg = loadConfig()
const handle = await createDb(cfg)
await handle.migrate()
console.log(`[db] migrations aplicadas (${handle.driver})`)
await handle.close()
