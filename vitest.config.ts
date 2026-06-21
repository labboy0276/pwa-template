import { defineConfig } from 'vitest/config'

// A standalone Vitest config (kept separate from vite.config.ts so the PWA
// plugin doesn't run during tests). jsdom gives tests a DOM + localStorage,
// which the store relies on.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
