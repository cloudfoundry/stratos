import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { join } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    root: join(__dirname),
    name: 'cloud-foundry',
    globals: false, // Recommended for Angular 20 + Vitest 4 (avoid global namespace pollution)
    environment: 'jsdom',
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
      join(__dirname, 'src/test-setup.ts'), // Package-specific setup
    ],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'out-tsc', '**/test-e2e/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: join(__dirname, '../../coverage/cloud-foundry'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/**/*.d.ts'],
    },
    reporters: ['default'], // '../../../../build/vitest-stratos-reporter.ts' - disabled for Vitest 4 compatibility
    testTimeout: 15000, // Increased for Angular TestBed initialization with zoneless detection
    hookTimeout: 15000, // Increased for beforeAll/afterAll hooks
  },
  resolve: {
    alias: {
      '@stratosui/core': join(__dirname, '../core/src/public-api.ts'),
      '@stratosui/store': join(__dirname, '../store/src/public-api.ts'),
      '@stratosui/store/testing': join(__dirname, '../store/testing/index.ts'),
      '@stratosui/shared': join(__dirname, '../shared/src/public-api.ts'),
      '@stratosui/cloud-foundry': join(__dirname, 'src/public-api.ts'),
      '@stratosui/kubernetes': join(__dirname, '../kubernetes/src/public-api.ts'),
    },
  },
  ssr: {
    noExternal: ['@angular/**', '@analogjs/**']
  },
});
