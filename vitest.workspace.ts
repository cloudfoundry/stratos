import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'src/frontend/packages/core/vitest.config.ts',
  'src/frontend/packages/store/vitest.config.ts',
  'src/frontend/packages/cloud-foundry/vitest.config.ts',
  'src/frontend/packages/kubernetes/vitest.config.ts',
  'src/frontend/packages/cf-autoscaler/vitest.config.ts',
  'src/frontend/packages/git/vitest.config.ts',
  'src/frontend/packages/shared/vitest.config.ts',
  'src/frontend/packages/extension/vitest.config.ts',
]);
