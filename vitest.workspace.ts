import { defineWorkspace } from 'vitest/config';
import { join } from 'path';

/**
 * Vitest Workspace Configuration
 *
 * CRITICAL: This workspace explicitly excludes E2E tests to prevent them from
 * being run by Vitest. E2E tests use Playwright and must be run separately.
 *
 * The exclusion patterns are particularly important for Bun 1.3.x compatibility,
 * which changed test file discovery behavior and may ignore package-level excludes.
 */
export default defineWorkspace([
  {
    extends: 'src/frontend/packages/core/vitest.config.ts',
    test: {
      name: 'core',
      exclude: [
        // E2E tests (Playwright) - must NOT be run by Vitest
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        // Build outputs and dependencies
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
  {
    extends: 'src/frontend/packages/store/vitest.config.mts',
    test: {
      name: 'store',
      exclude: [
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
  {
    extends: 'src/frontend/packages/cloud-foundry/vitest.config.mts',
    test: {
      name: 'cloud-foundry',
      exclude: [
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
  {
    extends: 'src/frontend/packages/kubernetes/vitest.config.ts',
    test: {
      name: 'kubernetes',
      exclude: [
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
  {
    extends: 'src/frontend/packages/cf-autoscaler/vitest.config.mts',
    test: {
      name: 'cf-autoscaler',
      exclude: [
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
  {
    extends: 'src/frontend/packages/git/vitest.config.ts',
    test: {
      name: 'git',
      exclude: [
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
  {
    extends: 'src/frontend/packages/shared/vitest.config.ts',
    test: {
      name: 'shared',
      exclude: [
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
  {
    extends: 'src/frontend/packages/extension/vitest.config.ts',
    test: {
      name: 'extension',
      exclude: [
        'e2e/**',
        '**/e2e/**',
        '**/*.e2e.spec.ts',
        '**/*.e2e-spec.ts',
        '**/playwright/**',
        'playwright.config.ts',
        'node_modules/**',
        'dist/**',
        'dist-devkit/**',
        'out-tsc/**',
        'coverage/**',
      ],
    },
  },
]);
