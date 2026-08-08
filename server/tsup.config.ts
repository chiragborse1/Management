import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  splitting: false,
  minify: false,
  // Bundle the shared workspace package so imports of @shared/* are inlined
  // (monorepo-friendly — avoids rootDir constraints and runtime resolution issues)
  noExternal: ['@shared'],
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
      '@shared': './../shared/src',
    }
  },
})
