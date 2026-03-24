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
  await page.waitForTimeout(2000); // settle for async data
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

  // Applications - cards view
  await page.goto(`/cloud-foundry/${cfGuid}/applications`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  await capture(page, '03-applications-cards');

  // Applications - table view (find the list/table toggle icon)
  const tableIcon = page.locator('button:has(span.material-icons:text("list")), button:has(span:text("view_list"))');
  if (await tableIcon.count() > 0) {
    await tableIcon.first().click();
    await page.waitForTimeout(1000);
    await capture(page, '04-applications-table');
  }

  // App summary - click the first card to navigate
  const firstCard = page.locator('.card, [class*="card"]').first();
  if (await firstCard.count() > 0) {
    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    // Check if we navigated to an app page
    if (page.url().includes('/application/')) {
      await capture(page, '05-app-summary');
    }
  }

  // CF pages
  await page.goto(`/cloud-foundry/${cfGuid}/summary`);
  await capture(page, '06-cf-summary');

  await page.goto(`/cloud-foundry/${cfGuid}/organizations`);
  await page.waitForTimeout(2000);
  await capture(page, '07-cf-organizations');

  // Click first org card to discover org GUID from URL
  const firstOrgCard = page.locator('.card, [class*="card"]').first();
  let orgGuid = '';
  if (await firstOrgCard.count() > 0) {
    await firstOrgCard.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const orgUrl = page.url();
    const orgMatch = orgUrl.match(/\/organizations\/([^/]+)/);
    if (orgMatch) orgGuid = orgMatch[1];
  }

  if (orgGuid) {
    await capture(page, '08-org-summary');

    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces`);
    await page.waitForTimeout(2000);
    await capture(page, '09-org-spaces');

    // Click first space card to discover space GUID from URL
    const firstSpaceCard = page.locator('.card, [class*="card"]').first();
    let spaceGuid = '';
    if (await firstSpaceCard.count() > 0) {
      await firstSpaceCard.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      const spaceUrl = page.url();
      const spaceMatch = spaceUrl.match(/\/spaces\/([^/]+)/);
      if (spaceMatch) spaceGuid = spaceMatch[1];
    }

    if (spaceGuid) {
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
