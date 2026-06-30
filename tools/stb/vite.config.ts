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
  // Pre-bundle runtime deps the browser tests import. Without this, Vite
  // discovers and optimizes them mid-run (e.g. "new dependencies optimized:
  // jszip"), forces a reload, and in-flight test files fail to import
  // ("runner is undefined" / "Importing a module script failed") — a flake
  // that hits different browsers on different runs. Listing them here bundles
  // them before the run starts. See vitest browser-mode reload warning.
  optimizeDeps: {
    include: [
      'jszip',
      'codemirror',
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/commands',
      '@codemirror/lang-css',
    ],
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
          name: 'integration-node',
          environment: 'node',
          include: ['tests/integration/login-projection.test.ts', 'tests/integration/login-branding-e2e.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration-chromium',
          include: ['tests/integration/**/*.test.ts'],
          exclude: ['tests/integration/login-projection.test.ts', 'tests/integration/login-branding-e2e.test.ts'],
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
          exclude: ['tests/integration/login-projection.test.ts', 'tests/integration/login-branding-e2e.test.ts'],
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
          exclude: ['tests/integration/login-projection.test.ts', 'tests/integration/login-branding-e2e.test.ts'],
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
