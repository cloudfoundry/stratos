import { defineConfig } from 'vitest/config';

/**
 * Root Vitest configuration with projects
 *
 * Migrated from vitest.workspace.ts (deprecated in vitest 4) — the
 * `projects` field below replaces `defineWorkspace`. E2E tests are
 * explicitly excluded from every project to keep them on Playwright.
 *
 * Each project sets its own `root`. Vitest 5 gives an inline project the
 * root of this file and ignores the `test.root` in the config it extends,
 * so without it every package's `src/**` include matches the whole tree
 * and the Angular plugin looks for tsconfig.spec.json in the repo root.
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
        extends: 'src/frontend/packages/core/vitest.config.mts',
        root: 'src/frontend/packages/core',
        test: { name: 'core', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/store/vitest.config.mts',
        root: 'src/frontend/packages/store',
        test: { name: 'store', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/cloud-foundry/vitest.config.mts',
        root: 'src/frontend/packages/cloud-foundry',
        test: { name: 'cloud-foundry', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/kubernetes/vitest.config.mts',
        root: 'src/frontend/packages/kubernetes',
        test: { name: 'kubernetes', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/cf-autoscaler/vitest.config.mts',
        root: 'src/frontend/packages/cf-autoscaler',
        test: { name: 'cf-autoscaler', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/git/vitest.config.mts',
        root: 'src/frontend/packages/git',
        test: { name: 'git', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/shared/vitest.config.mts',
        root: 'src/frontend/packages/shared',
        test: { name: 'shared', exclude: COMMON_EXCLUDE },
      },
      {
        extends: 'src/frontend/packages/extension/vitest.config.mts',
        root: 'src/frontend/packages/extension',
        test: { name: 'extension', exclude: COMMON_EXCLUDE },
      },
    ],
  },
});
