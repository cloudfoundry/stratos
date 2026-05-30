import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'node:path';

/**
 * Base Vite config (dev/build) plus Vitest 4 `test.projects`.
 *
 * Migrated from the deprecated `vitest.workspace.ts` (`defineWorkspace`
 * was removed in Vitest 4). Each project uses `extends: true` to inherit
 * this file's root config (notably the `@` alias). Browser projects use
 * the Vitest 4 `browser.instances` API in place of the old `browser.name`.
 */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/integration/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration-chromium',
          include: ['tests/integration/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'integration-firefox',
          include: ['tests/integration/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'firefox' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'integration-webkit',
          include: ['tests/integration/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'webkit' }],
          },
        },
      },
    ],
  },
});
