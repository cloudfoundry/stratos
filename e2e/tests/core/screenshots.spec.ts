import { test, expect } from '../../fixtures/test-base';
import { disableAnimations, WindowSize } from '../../helpers/test-utils';
import * as fs from 'fs';
import * as path from 'path';

const label = process.env.STRATOS_SCREENSHOT_LABEL
  || new URL(process.env.STRATOS_E2E_BASE_URL || 'https://localhost').hostname.split('.')[0];

const SCREENSHOT_DIR = path.resolve('e2e-screenshots');

let currentMode: 'light' | 'dark' = 'light';

async function capture(page: any, name: string) {
  const dir = path.join(SCREENSHOT_DIR, `${label}-${currentMode}`);
  fs.mkdirSync(dir, { recursive: true });
  await page.waitForLoadState('domcontentloaded');
  // Wait for loading indicators to disappear
  await page.locator('app-loading-page, .loading-page, text="Retrieving"').first()
    .waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000); // final settle
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

async function setThemeMode(page: any, mode: 'light' | 'dark') {
  currentMode = mode;
  await page.evaluate((m: string) => localStorage.setItem('stratos-theme-mode', m), mode);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}


async function captureAuthenticatedPages(page: any, cfGuid: string) {
  // Home
  await page.goto('/');
  await capture(page, '02-home');

  // Applications - cards view (use /applications — works on both v4 and v5)
  await page.goto('/applications');
  await page.locator('.app-card, .meta-card').first()
    .waitFor({ state: 'visible', timeout: 30000 }).catch(() => console.warn('App cards did not appear within 30s'));
  await page.waitForTimeout(1000);
  await capture(page, '03-applications-cards');

  // Applications - table view (find the list/table toggle icon)
  const tableIcon = page.locator('.list-component button.btn-icon span.material-icons').filter({ hasText: /view_list|list/ });
  if (await tableIcon.count() > 0) {
    await tableIcon.first().click();
    await page.waitForTimeout(1000);
    await capture(page, '04-applications-table');
  }

  // App summary - click the first app card title
  const appTitle = page.locator('.app-card .meta-card__title').first();
  if (await appTitle.count() > 0) {
    await appTitle.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    await capture(page, '05-app-summary');
  }

  // CF pages
  await page.goto(`/cloud-foundry/${cfGuid}/summary`);
  await capture(page, '06-cf-summary');

  // Discover org and space GUIDs via Stratos proxy API
  let orgGuid = '';
  let spaceGuid = '';
  try {
    const orgsResponse = await page.evaluate(async (cfGuid) => {
      const res = await fetch(`/pp/v1/proxy/v2/organizations?order-direction=asc&page=1&results-per-page=1`, {
        headers: { 'x-cap-cnsi-list': cfGuid, 'x-cap-passthrough': 'true' }
      });
      return res.json();
    }, cfGuid);
    if (orgsResponse?.resources?.[0]) {
      orgGuid = orgsResponse.resources[0].metadata.guid;
      // Get first space from this org
      const spacesResponse = await page.evaluate(async ({ cfGuid, orgGuid }) => {
        const res = await fetch(`/pp/v1/proxy/v2/organizations/${orgGuid}/spaces?order-direction=asc&page=1&results-per-page=1`, {
          headers: { 'x-cap-cnsi-list': cfGuid, 'x-cap-passthrough': 'true' }
        });
        return res.json();
      }, { cfGuid, orgGuid });
      if (spacesResponse?.resources?.[0]) {
        spaceGuid = spacesResponse.resources[0].metadata.guid;
      }
    }
  } catch (e) {
    console.warn('Could not fetch org/space GUIDs from API:', e);
  }

  console.log(`Discovered: orgGuid=${orgGuid}, spaceGuid=${spaceGuid}`);

  await page.goto(`/cloud-foundry/${cfGuid}/organizations`);
  await page.locator('.meta-card').first()
    .waitFor({ state: 'visible', timeout: 30000 }).catch(() => console.warn('Org cards did not appear within 30s'));
  await page.waitForTimeout(1000);
  await capture(page, '07-cf-organizations');

  if (orgGuid) {
    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/summary`);
    await capture(page, '08-org-summary');

    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces`);
    await page.locator('.meta-card').first()
      .waitFor({ state: 'visible', timeout: 30000 }).catch(() => console.warn('Space cards did not appear within 30s'));
    await page.waitForTimeout(1000);
    await capture(page, '09-org-spaces');

    if (spaceGuid) {
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/summary`);
      await capture(page, '10-space-summary');
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/apps`);
      await capture(page, '11-space-apps');
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/routes`);
      await capture(page, '12-space-routes');
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/service-instances`);
      await capture(page, '13-space-services');
    }
  } else {
    console.warn('Could not discover org GUID — CF API may be slow');
  }

  // Marketplace
  await page.goto('/marketplace');
  await capture(page, '15-marketplace');

  // About, diagnostics, and profile
  await page.goto('/about');
  await capture(page, '16-about');
  await page.goto('/about/diagnostics');
  await capture(page, '18-diagnostics');
  await page.goto('/user-profile');
  await capture(page, '17-user-profile');
  await page.goto('/endpoints');
  await capture(page, '14-endpoints');
}

test.describe('Visual Comparison Screenshots', () => {
  test.setTimeout(300_000);

  test.describe('Unauthenticated', () => {
    test('01-login (light)', async ({ page }) => {
      currentMode = 'light';
      await page.setViewportSize(WindowSize.DESKTOP);
      await page.goto('/login');
      await capture(page, '01-login');
    });

    test('01-login (dark)', async ({ page }) => {
      currentMode = 'dark';
      await page.setViewportSize(WindowSize.DESKTOP);
      // Navigate to app root first to access localStorage (login page may be cross-origin)
      await page.goto('/');
      await page.evaluate(() => localStorage.setItem('stratos-theme-mode', 'dark'));
      await page.goto('/login');
      await page.waitForTimeout(500);
      await capture(page, '01-login');
    });
  });

  test.describe('Authenticated - Light Mode', () => {
    test('capture all pages', async ({ adminPage: page }) => {
      await page.setViewportSize(WindowSize.DESKTOP);
      await disableAnimations(page);
      currentMode = 'light';
      await setThemeMode(page, 'light');

      // Discover CF GUID by navigating to /cloud-foundry (redirects to /cloud-foundry/{guid}/summary)
      await page.goto('/cloud-foundry');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      const url = page.url();
      const cfMatch = url.match(/\/cloud-foundry\/([^/]+)/);
      const cfGuid = cfMatch ? cfMatch[1] : '';

      if (cfGuid) {
        await captureAuthenticatedPages(page, cfGuid);
      } else {
        console.warn('No CF endpoint found — skipping CF pages');
        await page.goto('/');
        await capture(page, '02-home');
        await page.goto('/endpoints');
        await capture(page, '14-endpoints');
        await page.goto('/about');
        await capture(page, '16-about');
        await page.goto('/user-profile');
        await capture(page, '17-user-profile');
      }
    });
  });

  test.describe('Authenticated - Dark Mode', () => {
    test('capture all pages', async ({ adminPage: page }) => {
      await page.setViewportSize(WindowSize.DESKTOP);
      await disableAnimations(page);
      currentMode = 'dark';
      await setThemeMode(page, 'dark');

      await page.goto('/cloud-foundry');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      const url = page.url();
      const cfMatch = url.match(/\/cloud-foundry\/([^/]+)/);
      const cfGuid = cfMatch ? cfMatch[1] : '';

      if (cfGuid) {
        await captureAuthenticatedPages(page, cfGuid);
      } else {
        console.warn('No CF endpoint found — skipping CF pages');
        await page.goto('/');
        await capture(page, '02-home');
        await page.goto('/endpoints');
        await capture(page, '14-endpoints');
        await page.goto('/about');
        await capture(page, '16-about');
        await page.goto('/user-profile');
        await capture(page, '17-user-profile');
      }
    });
  });
});
