import { defineWorkspace } from 'vitest/config';
import { join } from 'path';

// Workspace configuration with E2E test exclusion at workspace level
// This prevents Playwright E2E test files from being discovered during unit test runs
// Workspace configuration - only specify package configs, no global test patterns
// Each package config properly excludes E2E tests already
export default defineWorkspace([
  'src/frontend/packages/core/vitest.config.ts',
  'src/frontend/packages/store/vitest.config.mts',
  'src/frontend/packages/cloud-foundry/vitest.config.mts',
  'src/frontend/packages/kubernetes/vitest.config.ts',
  'src/frontend/packages/cf-autoscaler/vitest.config.mts',
  'src/frontend/packages/git/vitest.config.ts',
  'src/frontend/packages/shared/vitest.config.ts',
  'src/frontend/packages/extension/vitest.config.ts',
]);
