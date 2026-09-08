import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { join } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    name: 'core',
    root: join(import.meta.dirname),
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
    include: ['src/**/*.spec.ts', '../theme/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'out-tsc', '**/test-e2e/**', '**/e2e/**'],
    // Fix for Angular 20 zoneless + Vitest circular dependency errors
    teardown: {
      destroyAfterEach: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: join(import.meta.dirname, '../../coverage/core'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/**/*.d.ts'],
    },
    reporters: ['default'], // '../../../../build/vitest-stratos-reporter.ts' - disabled for Vitest 4 compatibility
    testTimeout: 15000, // Increased for Angular TestBed initialization with zoneless detection
    hookTimeout: 15000, // Increased for beforeAll/afterAll hooks
  },
  resolve: {
    alias: {
      '@stratosui/core': join(import.meta.dirname, 'src/public-api.ts'),
      '@stratosui/store/testing': join(import.meta.dirname, '../store/testing/index.ts'),
      '@stratosui/store': join(import.meta.dirname, '../store/src/public-api.ts'),
      '@stratosui/shared': join(import.meta.dirname, '../shared/src/public-api.ts'),
      '@stratosui/theme': join(import.meta.dirname, '../theme/index.ts'),
      '@stratosui/cloud-foundry': join(import.meta.dirname, '../cloud-foundry/src/public_api.ts'),
      '@stratosui/cf-autoscaler': join(import.meta.dirname, '../cf-autoscaler/src/public_api.ts'),
      '@stratosui/kubernetes': join(import.meta.dirname, '../kubernetes/src/public-api.ts'),
      '@stratosui/git': join(import.meta.dirname, '../git/src/public_api.ts'),
      '@test-framework': join(import.meta.dirname, 'test-framework'),
      '@test-framework/core-test.helper': join(import.meta.dirname, 'test-framework/core-test.helper.ts'),
      '@test-framework/core-test.modules': join(import.meta.dirname, 'test-framework/core-test.modules.ts'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  ssr: {
    noExternal: ['@angular/**', '@analogjs/**', 'ng2-charts']
  },
});
