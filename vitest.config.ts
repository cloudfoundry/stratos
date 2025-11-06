import { defineConfig } from 'vitest/config';

// Root-level Vitest configuration
// Explicitly exclude E2E tests from discovery and delegate to workspace
export default defineConfig({
  test: {
    // Explicitly exclude E2E and Playwright tests at root level
    exclude: [
      'e2e/**',
      '**/e2e/**',
      '**/*.e2e.spec.ts',
      '**/playwright/**',
      'node_modules/**',
      'dist/**',
      'out-tsc/**',
      'dist-devkit/**',
    ],
    // No include pattern - let workspace handle discovery
    include: [],
  },
});
