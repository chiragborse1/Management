import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Each integration suite boots its own in-memory MongoDB. Fork per file so
    // Mongoose's global model registry is never re-evaluated across suites
    // (OverwriteModelError otherwise).
    pool: 'forks',
    poolOptions: { forks: { singleFork: false } },
  },
});
