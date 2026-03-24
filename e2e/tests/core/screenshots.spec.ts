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
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

async function setThemeMode(page: any, mode: 'light' | 'dark') {
  currentMode = mode;
  await page.evaluate((m: string) => localStorage.setItem('stratos-theme-mode', m), mode);
  await page.reload();
  await page.waitForLoadState('networkidle');
}


async function captureAuthenticatedPages(page: any, cfGuid: string) {
  // Home
  await page.goto('/');
  await capture(page, '02-home');

  // Applications - cards view
  await page.goto(`/cloud-foundry/${cfGuid}/applications`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await capture(page, '03-applications-cards');

  // Applications - table view
  const tableToggle = page.locator('[data-test="list-view-toggle-table"], button[aria-label="Table view"]');
  if (await tableToggle.count() > 0) {
    await tableToggle.first().click();
    await page.waitForTimeout(500);
    await capture(page, '04-applications-table');
  }

  // App summary - click first app if available
  const firstAppLink = page.locator('a[href*="/applications/"]').first();
  if (await firstAppLink.count() > 0) {
    await firstAppLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await capture(page, '05-app-summary');
  }

  // CF pages - discover org and space from the UI
  await page.goto(`/cloud-foundry/${cfGuid}/summary`);
  await capture(page, '06-cf-summary');

  await page.goto(`/cloud-foundry/${cfGuid}/organizations`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await capture(page, '07-cf-organizations');

  // Get first org GUID
  const orgLink = page.locator('a[href*="/organizations/"]').first();
  let orgGuid = '';
  if (await orgLink.count() > 0) {
    const href = await orgLink.getAttribute('href') || '';
    const match = href.match(/\/organizations\/([^/]+)/);
    if (match) orgGuid = match[1];
  }

  if (orgGuid) {
    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/summary`);
    await capture(page, '08-org-summary');

    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await capture(page, '09-org-spaces');

    // Get first space GUID
    const spaceLink = page.locator('a[href*="/spaces/"]').first();
    let spaceGuid = '';
    if (await spaceLink.count() > 0) {
      const href = await spaceLink.getAttribute('href') || '';
      const match = href.match(/\/spaces\/([^/]+)/);
      if (match) spaceGuid = match[1];
    }

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
  }

  // Marketplace
  await page.goto(`/marketplace/${cfGuid}`);
  await capture(page, '15-marketplace');

  // About and profile
  await page.goto('/about');
  await capture(page, '16-about');
  await page.goto('/user-profile');
  await capture(page, '17-user-profile');
}

test.describe('Visual Comparison Screenshots', () => {
  test.setTimeout(120_000);

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

      // Discover CF GUID from endpoints page
      await page.goto('/endpoints');
      await capture(page, '14-endpoints');

      // Get first CF endpoint GUID from the page
      const cfLink = page.locator('a[href*="/cloud-foundry/"]').first();
      let cfGuid = '';
      if (await cfLink.count() > 0) {
        const href = await cfLink.getAttribute('href') || '';
        const match = href.match(/\/cloud-foundry\/([^/]+)/);
        if (match) cfGuid = match[1];
      }

      if (cfGuid) {
        await captureAuthenticatedPages(page, cfGuid);
      } else {
        console.warn('No CF endpoint found — skipping CF pages');
        // Capture non-CF pages only
        await page.goto('/');
        await capture(page, '02-home');
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

      await page.goto('/endpoints');
      await capture(page, '14-endpoints');

      const cfLink = page.locator('a[href*="/cloud-foundry/"]').first();
      let cfGuid = '';
      if (await cfLink.count() > 0) {
        const href = await cfLink.getAttribute('href') || '';
        const match = href.match(/\/cloud-foundry\/([^/]+)/);
        if (match) cfGuid = match[1];
      }

      if (cfGuid) {
        await captureAuthenticatedPages(page, cfGuid);
      } else {
        console.warn('No CF endpoint found — skipping CF pages');
        await page.goto('/');
        await capture(page, '02-home');
        await page.goto('/about');
        await capture(page, '16-about');
        await page.goto('/user-profile');
        await capture(page, '17-user-profile');
      }
    });
  });
});
