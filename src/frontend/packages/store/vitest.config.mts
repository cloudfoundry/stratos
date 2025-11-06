import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { join } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    root: join(__dirname),
    name: 'store',
    globals: true,
    environment: 'jsdom',
    pool: 'forks', // Required for Angular 20 + Vitest 4 ESM module resolution
    setupFiles: [join(__dirname, 'src/test-setup.ts')],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'out-tsc', '**/test-e2e/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: join(__dirname, '../../coverage/store'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/**/*.d.ts'],
    },
    reporters: ['default'], // join(__dirname, '../../../../build/vitest-stratos-reporter.ts')],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@stratosui/core': join(__dirname, '../core/src/public-api.ts'),
      '@stratosui/store': join(__dirname, 'src/public-api.ts'),
      '@stratosui/store/testing': join(__dirname, '../testing/public-api.ts'),
      '@stratosui/shared': join(__dirname, '../shared/src/public-api.ts'),
      '@stratosui/cloud-foundry': join(__dirname, '../cloud-foundry/src/public_api.ts'),
      '@stratosui/kubernetes': join(__dirname, '../kubernetes/src/public-api.ts'),
    },
  },
});
