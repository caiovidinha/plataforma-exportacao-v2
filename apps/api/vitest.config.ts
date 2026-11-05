import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
      SECRETS_MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
      DB_DRIVER: 'pglite',
      PGLITE_DATA_DIR: 'memory://',
      MAIL_DRIVER: 'memory',
      INTEGRATION_WORKER_ENABLED: 'false',
      LOG_LEVEL: 'silent',
      WEB_ORIGIN: 'http://localhost:3000',
    },
  },
})
