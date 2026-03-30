import { test, expect } from '../../fixtures/test-base';

/**
 * Visual inspection — screenshot key pages to verify no regressions
 * after ESLint accessibility/template fixes.
 *
 * Run: STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca npx playwright test visual-inspection
 */

const pages = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'about-diagnostics', path: '/about/diagnostics' },
  { name: 'endpoints', path: '/endpoints' },
  { name: 'applications', path: '/applications' },
  { name: 'marketplace', path: '/marketplace' },
  { name: 'services', path: '/services' },
  { name: 'cf-summary', path: '/cloud-foundry' },
  { name: 'cf-orgs', path: '/cloud-foundry/organizations' },
  { name: 'cf-users', path: '/cloud-foundry/users' },
  { name: 'cf-routes', path: '/cloud-foundry/routes' },
  { name: 'cf-events', path: '/cloud-foundry/events' },
  { name: 'cf-feature-flags', path: '/cloud-foundry/feature-flags' },
  { name: 'cf-build-packs', path: '/cloud-foundry/build-packs' },
  { name: 'cf-stacks', path: '/cloud-foundry/stacks' },
  { name: 'cf-security-groups', path: '/cloud-foundry/security-groups' },
];

test.describe('Visual Inspection', () => {
  for (const { name, path } of pages) {
    test(`screenshot ${name}`, async ({ adminPage }) => {
      await adminPage.goto(path);
      // Wait for content to settle
      await adminPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      // Extra settle time for async data
      await adminPage.waitForTimeout(2000);
      await adminPage.screenshot({
        path: `e2e-screenshots/visual-inspection/${name}.png`,
        fullPage: true,
      });
    });
  }

  test('screenshot events multi-select', async ({ adminPage }) => {
    // Navigate to a CF endpoint's events page
    await adminPage.goto('/cloud-foundry');
    await adminPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Find the CF GUID from the URL redirect
    await adminPage.waitForTimeout(2000);
    const url = adminPage.url();
    const cfGuidMatch = url.match(/cloud-foundry\/([^/]+)/);
    if (!cfGuidMatch) {
      test.skip(true, 'Could not determine CF GUID');
      return;
    }

    await adminPage.goto(`${url}/events`);
    await adminPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await adminPage.waitForTimeout(3000);

    // Screenshot initial state
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/events-initial.png',
      fullPage: true,
    });

    // Open the type dropdown and screenshot
    const typeSelect = adminPage.locator('app-select[name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await adminPage.waitForTimeout(500);
      await adminPage.screenshot({
        path: 'e2e-screenshots/visual-inspection/events-dropdown-open.png',
        fullPage: true,
      });

      // Select first option
      const firstOption = adminPage.locator('app-option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await adminPage.waitForTimeout(1000);
        await adminPage.screenshot({
          path: 'e2e-screenshots/visual-inspection/events-one-selected.png',
          fullPage: true,
        });
      }
    }
  });

  test('screenshot dark mode', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await adminPage.waitForTimeout(2000);

    // Toggle dark mode
    const darkToggle = adminPage.locator('button, a, div').filter({ hasText: /dark/i }).first();
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
      await adminPage.waitForTimeout(1000);
    }

    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/home-dark.png',
      fullPage: true,
    });

    // Applications in dark mode
    await adminPage.goto('/applications');
    await adminPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/applications-dark.png',
      fullPage: true,
    });

    // Marketplace in dark mode (has boolean indicators)
    await adminPage.goto('/marketplace');
    await adminPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/marketplace-dark.png',
      fullPage: true,
    });
  });
});
