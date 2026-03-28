import { test, expect } from '../../fixtures/test-base';
import { disableAnimations, WindowSize } from '../../helpers/test-utils';
import * as fs from 'fs';
import * as path from 'path';

const label = process.env.STRATOS_SCREENSHOT_LABEL
  || new URL(process.env.STRATOS_E2E_BASE_URL || 'https://localhost').hostname.split('.')[0];

const SCREENSHOT_DIR = path.resolve('e2e-screenshots');

let currentMode: 'light' | 'dark' = 'light';

async function capture(page: any, name: string, { timeout = 60000 } = {}) {
  const dir = path.join(SCREENSHOT_DIR, `${label}-${currentMode}`);
  fs.mkdirSync(dir, { recursive: true });
  await page.waitForLoadState('domcontentloaded');

  // Wait for page-level loading indicators to disappear
  const loadingSelectors = [
    'app-loading-page',
    '.loading-page',
    '.loading-spinner',
    'text="Retrieving"',
  ];

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    let anyLoading = false;
    for (const sel of loadingSelectors) {
      const visible = await page.locator(sel).first().isVisible().catch(() => false);
      if (visible) {
        anyLoading = true;
        break;
      }
    }
    if (!anyLoading) break;
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(2000); // final settle after loading done
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

async function setThemeMode(page: any, mode: 'light' | 'dark') {
  currentMode = mode;
  await page.evaluate((m: string) => localStorage.setItem('stratos-theme-mode', m), mode);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}


async function captureAuthenticatedPages(page: any, cfGuid: string) {
  // Home — capture loading progression until content appears or 3min timeout
  await page.goto('/');
  {
    const startTime = Date.now();
    const timeout = 180000; // 3 minutes
    let attempt = 0;
    let loaded = false;
    while (Date.now() - startTime < timeout) {
      attempt++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const spinnerVisible = await page.locator('mat-spinner, .loading-spinner, app-loading-page').first()
        .isVisible().catch(() => false);
      const hasContent = await page.locator('.home-page-endpoint-card, .card-number-metric, .card-boolean-metric').first()
        .isVisible().catch(() => false);
      if (!spinnerVisible && hasContent) {
        console.log(`Home page loaded after ${elapsed}s`);
        loaded = true;
        break;
      }
      await capture(page, `02-home-loading-${elapsed}s`);
      await page.waitForTimeout(10000);
    }
    const finalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    if (!loaded) {
      console.warn(`Home page did not fully load within 3 minutes — capturing at ${finalElapsed}s`);
    }
    await page.waitForTimeout(1000);
    await capture(page, `02-home-${finalElapsed}s`);
  }

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
    const orgsResponse = await Promise.race([
      page.evaluate(async (cfGuid) => {
        const res = await fetch(`/pp/v1/proxy/v2/organizations?order-direction=asc&page=1&results-per-page=1`, {
          headers: { 'x-cap-cnsi-list': cfGuid, 'x-cap-passthrough': 'true' }
        });
        return res.json();
      }, cfGuid),
      new Promise((_, reject) => setTimeout(() => reject(new Error('org fetch timeout')), 30000))
    ]) as any;
    if (orgsResponse?.resources?.[0]) {
      orgGuid = orgsResponse.resources[0].metadata.guid;
      const spacesResponse = await Promise.race([
        page.evaluate(async ({ cfGuid, orgGuid }) => {
          const res = await fetch(`/pp/v1/proxy/v2/organizations/${orgGuid}/spaces?order-direction=asc&page=1&results-per-page=1`, {
            headers: { 'x-cap-cnsi-list': cfGuid, 'x-cap-passthrough': 'true' }
          });
          return res.json();
        }, { cfGuid, orgGuid }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('space fetch timeout')), 30000))
      ]) as any;
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
