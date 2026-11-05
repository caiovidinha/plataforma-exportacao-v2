import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Config } from '../config'

/** Contrato de armazenamento. Trocar por S3/GCS = nova implementação desta interface. */
export interface StorageAdapter {
  put(key: string, data: Buffer): Promise<void>
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
}

class LocalStorage implements StorageAdapter {
  constructor(private root: string) {}
  private resolve(key: string) {
    const full = path.resolve(this.root, key)
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error('invalid_storage_key')
    return full
  }
  async put(key: string, data: Buffer) {
    const full = this.resolve(key)
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, data)
  }
  get(key: string) {
    return readFile(this.resolve(key))
  }
  async delete(key: string) {
    await rm(this.resolve(key), { force: true })
  }
}

export class MemoryStorage implements StorageAdapter {
  private files = new Map<string, Buffer>()
  async put(key: string, data: Buffer) {
    this.files.set(key, data)
  }
  async get(key: string) {
    const f = this.files.get(key)
    if (!f) throw new Error('not_found')
    return f
  }
  async delete(key: string) {
    this.files.delete(key)
  }
}

export function createStorage(cfg: Pick<Config, 'STORAGE_DRIVER' | 'STORAGE_LOCAL_DIR'>): StorageAdapter {
  return new LocalStorage(path.resolve(cfg.STORAGE_LOCAL_DIR))
}
