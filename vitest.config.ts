import { defineConfig } from 'vitest/config';

/**
 * Root Vitest configuration with projects (vitest 4 syntax)
 *
 * Migrated from vitest.workspace.ts (deprecated in vitest 4) — the
 * `projects` field below replaces `defineWorkspace`. E2E tests are
 * explicitly excluded from every project to keep them on Playwright.
 */
const COMMON_EXCLUDE = [
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
];

export default defineConfig({
  test: {
    exclude: COMMON_EXCLUDE,
    include: [],
    projects: [
      {
        extends: 'src/frontend/packages/core/vitest.config.ts',
        test: { name: 'core', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/store/vitest.config.mts',
        test: { name: 'store', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/cloud-foundry/vitest.config.mts',
        test: { name: 'cloud-foundry', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/kubernetes/vitest.config.ts',
        test: { name: 'kubernetes', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/cf-autoscaler/vitest.config.mts',
        test: { name: 'cf-autoscaler', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/git/vitest.config.ts',
        test: { name: 'git', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/shared/vitest.config.ts',
        test: { name: 'shared', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/extension/vitest.config.ts',
        test: { name: 'extension', exclude: COMMON_EXCLUDE },
      },
    ],
  },
});
