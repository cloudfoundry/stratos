import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      name: 'unit',
      environment: 'jsdom',
      include: ['tests/**/*.test.ts'],
      exclude: ['tests/integration/**'],
    },
  },
  {
    extends: './vite.config.ts',
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts'],
      browser: {
        enabled: true,
        provider: 'playwright',
        name: 'chromium',
        headless: true,
      },
    },
  },
]);
