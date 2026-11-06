import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { join } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    root: join(import.meta.dirname),
    name: 'store',
    globals: false, // Recommended for Angular 20 + Vitest 4 (avoid global namespace pollution)
    environment: 'happy-dom',
    // Fork pool with single worker + no isolation for Angular TestBed stability (vitest 4 syntax)
    pool: 'forks',
    maxWorkers: 3, // Three parallel fork workers for speed; forks have independent memory
    isolate: true, // Fresh VM context per test file — prevents state pollution between specs
    server: {
      deps: {
        inline: [
          /^@angular\//,  // Force all Angular packages through vitest's transform pipeline
          /^@analogjs\//,
          'ng2-charts',   // Angular-dependent library — must share Angular core instance
        ],
      },
    },
    setupFiles: [
      join(import.meta.dirname, '../../vitest.workspace.setup.ts'), // Workspace-level platform init
      join(import.meta.dirname, 'src/test-setup.ts'), // Package-specific setup
    ],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'out-tsc', '**/test-e2e/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: join(import.meta.dirname, '../../coverage/store'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/**/*.d.ts'],
    },
    reporters: ['default'], // join(import.meta.dirname, '../../../../build/vitest-stratos-reporter.ts')],
    testTimeout: 15000, // Increased for Angular TestBed initialization with zoneless detection
    hookTimeout: 15000, // Increased for beforeAll/afterAll hooks
  },
  resolve: {
    alias: {
      '@stratosui/theme': join(import.meta.dirname, '../theme/index.ts'),
      '@stratosui/core': join(import.meta.dirname, '../core/src/public-api.ts'),
      '@stratosui/store/testing': join(import.meta.dirname, 'testing'),
      '@stratosui/store': join(import.meta.dirname, 'src/public-api.ts'),
      '@stratosui/shared': join(import.meta.dirname, '../shared/src/public-api.ts'),
      '@stratosui/cloud-foundry': join(import.meta.dirname, '../cloud-foundry/src/public_api.ts'),
      '@stratosui/kubernetes': join(import.meta.dirname, '../kubernetes/src/public-api.ts'),
      '@test-framework': join(import.meta.dirname, 'test-framework'),
    },
  },
  ssr: {
    noExternal: ['@angular/**', '@analogjs/**', 'ng2-charts']
  },
});
