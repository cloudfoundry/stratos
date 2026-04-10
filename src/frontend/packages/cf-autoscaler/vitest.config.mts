import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { join } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    root: join(__dirname),
    name: 'cf-autoscaler',
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
          /^@ngrx\//,     // Same for NgRx — prevents split module instances of _not_found-chunk
          /^@analogjs\//,
          'ng2-charts',   // Angular-dependent library — must share Angular core instance
        ],
      },
    },
    setupFiles: [
      join(__dirname, '../../vitest.workspace.setup.ts'), // Workspace-level platform init
      join(__dirname, 'src/test-setup.ts'), // Package-specific setup
    ],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'out-tsc', '**/test-e2e/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: join(__dirname, '../../coverage/cf-autoscaler'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/**/*.d.ts'],
    },
    reporters: ['default'], // '../../../../build/vitest-stratos-reporter.ts' - disabled for Vitest 4 compatibility
    testTimeout: 15000, // Increased for Angular TestBed initialization with zoneless detection
    hookTimeout: 15000, // Increased for beforeAll/afterAll hooks
  },
  resolve: {
    alias: {
      '@stratosui/theme': join(__dirname, '../theme/index.ts'),
      '@stratosui/core': join(__dirname, '../core/src/public-api.ts'),
      '@stratosui/store/testing': join(__dirname, '../store/testing'),
      '@stratosui/store': join(__dirname, '../store/src/public-api.ts'),
      '@stratosui/shared': join(__dirname, '../shared/src/public-api.ts'),
      '@stratosui/cloud-foundry': join(__dirname, '../cloud-foundry/src/public_api.ts'),
      '@stratosui/cf-autoscaler': join(__dirname, 'src/public_api.ts'),
      '@stratosui/kubernetes': join(__dirname, '../kubernetes/src/public-api.ts'),
      '@stratosui/git': join(__dirname, '../git/src/public_api.ts'),
      '@test-framework/cf-autoscaler-test.helper': join(__dirname, 'test-framework/cf-autoscaler-test.helper.ts'),
      '@test-framework/cf': join(__dirname, '../cloud-foundry/test-framework'),
      '@test-framework': join(__dirname, '../core/test-framework'),
    },
  },
  ssr: {
    noExternal: ['@angular/**', '@analogjs/**', '@ngrx/**', 'ng2-charts']
  },
});
