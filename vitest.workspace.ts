import { defineWorkspace } from 'vitest/config';

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
    exclude: ['**/e2e/**', '**/*.e2e.spec.ts', '**/playwright/**', 'node_modules'],
    include: ['src/frontend/packages/**/src/**/*.spec.ts'],
  },
},
);
