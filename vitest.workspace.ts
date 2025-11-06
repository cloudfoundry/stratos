import { defineWorkspace } from 'vitest/config';
import { join } from 'path';

// Workspace configuration with E2E test exclusion at workspace level
// This prevents Playwright E2E test files from being discovered during unit test runs
export default defineWorkspace([
  'src/frontend/packages/core/vitest.config.ts',
  'src/frontend/packages/store/vitest.config.mts',
  'src/frontend/packages/cloud-foundry/vitest.config.mts',
  'src/frontend/packages/kubernetes/vitest.config.ts',
  'src/frontend/packages/cf-autoscaler/vitest.config.mts',
  'src/frontend/packages/git/vitest.config.ts',
  'src/frontend/packages/shared/vitest.config.ts',
  'src/frontend/packages/extension/vitest.config.ts',
],
{
  // Global test configuration to exclude E2E and Playwright files
  // Prevent discovery of E2E tests that would cause Vitest conflicts
  test: {
    include: ['src/frontend/packages/**/src/**/*.spec.ts'],
    exclude: ['e2e/**', '**/e2e/**', '**/*.e2e.spec.ts', '**/playwright/**', 'node_modules', 'dist', 'dist-devkit', 'out-tsc'],
  },
  resolve: {
    alias: {
      '@stratosui/core': join(__dirname, 'src/frontend/packages/core/src/public-api.ts'),
      '@stratosui/store': join(__dirname, 'src/frontend/packages/store/src/public-api.ts'),
      '@stratosui/store/testing': join(__dirname, 'src/frontend/packages/store/testing/index.ts'),
      '@stratosui/shared': join(__dirname, 'src/frontend/packages/shared/src/public-api.ts'),
      '@stratosui/cloud-foundry': join(__dirname, 'src/frontend/packages/cloud-foundry/src/public_api.ts'),
      '@stratosui/kubernetes': join(__dirname, 'src/frontend/packages/kubernetes/src/public-api.ts'),
      '@stratosui/extension': join(__dirname, 'src/frontend/packages/extension/src/public-api.ts'),
      '@stratosui/git': join(__dirname, 'src/frontend/packages/git/src/public_api.ts'),
      '@stratosui/cf-autoscaler': join(__dirname, 'src/frontend/packages/cf-autoscaler/src/public_api.ts'),
    },
  },
  ssr: {
    noExternal: [/@stratosui/],
  },
},
);
