import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { join } from 'node:path';

export default defineConfig({
  plugins: [angular()],
  test: {
    name: 'kubernetes',
    root: join(__dirname),
    globals: false, // Recommended for Angular 20 + Vitest 4 (avoid global namespace pollution)
    environment: 'happy-dom',
    // Fork pool with single-fork mode for complete test isolation and Angular TestBed stability
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Single process: ensures TestBed state reset between test files
        isolate: false, // Isolate environments for complete cleanup
      },
    },
    server: {
      deps: {
        inline: [
          '@angular/compiler', // Required for Angular compilation in worker processes
          '@analogjs/vitest-angular/setup-snapshots', // AnalogJS snapshot support
        ],
      },
    },
    setupFiles: [
      join(__dirname, '../../vitest.workspace.setup.ts'), // Workspace-level platform init
      join(__dirname, 'src/test-setup.mts'), // Package-specific setup
    ],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'out-tsc', '**/test-e2e/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: join(__dirname, '../../coverage/kubernetes'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.mts', 'src/**/*.d.ts'],
    },
    reporters: ['default'], // '../../../../build/vitest-stratos-reporter.ts' - disabled for Vitest 4 compatibility
    testTimeout: 15000, // Increased for Angular TestBed initialization with zoneless detection
    hookTimeout: 15000, // Increased for beforeAll/afterAll hooks
  },
  resolve: {
    alias: {
      '@stratosui/core': join(__dirname, '../core/src/public-api.ts'),
      '@stratosui/store/testing': join(__dirname, '../store/testing'),
      '@stratosui/store': join(__dirname, '../store/src/public-api.ts'),
      '@stratosui/shared': join(__dirname, '../shared/src/public-api.ts'),
      '@stratosui/cloud-foundry': join(__dirname, '../cloud-foundry/src/public_api.ts'),
      '@stratosui/cf-autoscaler': join(__dirname, '../cf-autoscaler/src/public_api.ts'),
      '@stratosui/kubernetes': join(__dirname, 'src/public-api.ts'),
      '@stratosui/git': join(__dirname, '../git/src/public_api.ts'),
      '@test-framework': join(__dirname, 'test-framework'),
    },
  },
});
