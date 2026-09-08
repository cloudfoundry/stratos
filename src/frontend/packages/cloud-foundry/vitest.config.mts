import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { join } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    root: join(import.meta.dirname),
    name: 'cloud-foundry',
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
      reportsDirectory: join(import.meta.dirname, '../../coverage/cloud-foundry'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/**/*.d.ts'],
    },
    reporters: ['default'], // '../../../../build/vitest-stratos-reporter.ts' - disabled for Vitest 4 compatibility
    testTimeout: 15000, // Increased for Angular TestBed initialization with zoneless detection
    hookTimeout: 15000, // Increased for beforeAll/afterAll hooks
  },
  resolve: {
    alias: [
      // Theme alias
      { find: '@stratosui/theme', replacement: join(import.meta.dirname, '../theme/index.ts') },

      // Test framework aliases (more specific first)
      { find: '@test-framework/application-service-helper', replacement: join(import.meta.dirname, 'test-framework/application-service-helper.ts') },
      { find: '@test-framework/cloud-foundry-endpoint-service.helper', replacement: join(import.meta.dirname, 'test-framework/cloud-foundry-endpoint-service.helper.ts') },
      { find: '@test-framework/cf-test-helper', replacement: join(import.meta.dirname, 'test-framework/cf-test-helper.ts') },
      { find: '@test-framework/cloud-foundry-organization.service.mock', replacement: join(import.meta.dirname, 'test-framework/cloud-foundry-organization.service.mock.ts') },
      { find: '@test-framework/cloud-foundry-space.service.mock', replacement: join(import.meta.dirname, 'test-framework/cloud-foundry-space.service.mock.ts') },
      { find: '@test-framework/entity-relations-spec-helper', replacement: join(import.meta.dirname, 'test-framework/entity-relations-spec-helper.ts') },
      { find: '@test-framework/user-service-helper', replacement: join(import.meta.dirname, 'test-framework/user-service-helper.ts') },
      { find: '@test-framework/cf', replacement: join(import.meta.dirname, 'test-framework/index.ts') },
      { find: '@test-framework', replacement: join(import.meta.dirname, '../core/test-framework/index.ts') },

      // Core package aliases (specific subpaths first, then general pattern)
      { find: '@stratosui/core/test-framework/core-test.helper', replacement: join(import.meta.dirname, '../core/test-framework/core-test.helper.ts') },
      { find: '@stratosui/core/test-framework', replacement: join(import.meta.dirname, '../core/test-framework/index.ts') },
      { find: '@stratosui/core/shared.module', replacement: join(import.meta.dirname, '../core/src/shared/shared.module.ts') },
      { find: '@stratosui/core/core.module', replacement: join(import.meta.dirname, '../core/src/core/core.module.ts') },
      { find: '@stratosui/core/entity.tokens', replacement: join(import.meta.dirname, '../core/src/shared/entity.tokens.ts') },
      { find: '@stratosui/core/tab-nav.service', replacement: join(import.meta.dirname, '../core/src/tab-nav.service.ts') },
      { find: /^@stratosui\/core\/(.+)/, replacement: join(import.meta.dirname, '../core/src/$1') },
      { find: '@stratosui/core', replacement: join(import.meta.dirname, '../core/src/public-api.ts') },

      // Store package aliases
      { find: '@stratosui/store/testing', replacement: join(import.meta.dirname, '../store/testing') },
      { find: '@stratosui/store', replacement: join(import.meta.dirname, '../store/src/public-api.ts') },

      // Other package aliases
      { find: '@stratosui/shared', replacement: join(import.meta.dirname, '../shared/src/public-api.ts') },
      { find: '@stratosui/cloud-foundry', replacement: join(import.meta.dirname, 'src/public_api.ts') },
      { find: '@stratosui/cf-autoscaler', replacement: join(import.meta.dirname, '../cf-autoscaler/src/public_api.ts') },
      { find: '@stratosui/kubernetes', replacement: join(import.meta.dirname, '../kubernetes/src/public-api.ts') },
      { find: '@stratosui/git', replacement: join(import.meta.dirname, '../git/src/public_api.ts') },
    ],
  },
  ssr: {
    noExternal: ['@angular/**', '@analogjs/**', 'ng2-charts']
  },
});
