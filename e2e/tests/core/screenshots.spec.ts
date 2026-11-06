import { test, expect } from '../../fixtures/test-base';
import { disableAnimations, WindowSize } from '../../helpers/test-utils';
import * as fs from 'fs';
import * as path from 'path';

const label = process.env.STRATOS_SCREENSHOT_LABEL
  || new URL(process.env.E2E_BASE_URL || 'https://localhost').hostname.split('.')[0];

const SCREENSHOT_DIR = path.resolve('e2e-screenshots');

let currentMode: 'light' | 'dark' = 'light';

// All known loading indicators across Stratos page types
const LOADING_SELECTORS = [
  '.loading-page__spinner',           // app-loading-page overlay spinner
  '.progress-bar-indeterminate',      // list progress bar
  '.spinner',                         // inline spinners (app wall, etc.)
  '.loading-spinner',                 // generic loading spinner
  'mat-spinner',                      // Material spinners
];

// Substantive content — at least one should be visible when a page is ready
const CONTENT_SELECTORS = [
  'app-list table tbody tr',          // list table rows
  '.meta-card',                       // card view cards
  'app-tile-grid',                    // summary tile grids
  'app-info-card',                    // info cards (about/diagnostics)
  '.app-metadata',                    // metadata sections
  '.home-page-endpoint-card',         // home page cards
  '.card-number-metric',              // home page metrics
  'form',                             // profile/settings forms
  '.login',                           // login page
  '.boolean-list-component',          // feature flags boolean list
];

async function waitForPage(page: any, timeout: number): Promise<{ loaded: boolean; elapsed: number }> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    let anyLoading = false;
    for (const sel of LOADING_SELECTORS) {
      if (await page.locator(sel).first().isVisible().catch(() => false)) {
        anyLoading = true;
        break;
      }
    }

    let hasContent = false;
    for (const sel of CONTENT_SELECTORS) {
      if (await page.locator(sel).first().isVisible().catch(() => false)) {
        hasContent = true;
        break;
      }
    }

    if (!anyLoading && hasContent) {
      return { loaded: true, elapsed: Date.now() - startTime };
    }
    // No loaders visible but no content either — page may genuinely be empty
    if (!anyLoading && (Date.now() - startTime > timeout / 2)) {
      return { loaded: false, elapsed: Date.now() - startTime };
    }
    await page.waitForTimeout(2000);
  }
  return { loaded: false, elapsed: Date.now() - startTime };
}

async function capture(page: any, name: string, { timeout = 60000 } = {}) {
  const dir = path.join(SCREENSHOT_DIR, `${label}-${currentMode}`);
  fs.mkdirSync(dir, { recursive: true });
  await page.waitForLoadState('domcontentloaded');

  const { loaded, elapsed } = await waitForPage(page, timeout);
  if (!loaded) {
    console.warn(`${name}: page did not fully load (${(elapsed / 1000).toFixed(0)}s)`);
  }

  await page.waitForTimeout(1500); // final settle for animations
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

async function setThemeMode(page: any, mode: 'light' | 'dark') {
  currentMode = mode;
  await page.evaluate((m: string) => localStorage.setItem('stratos-theme-mode', m), mode);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}


async function captureAuthenticatedPages(page: any, cfGuid: string) {
  // Home — long timeout because it aggregates data from all endpoints
  await page.goto('/');
  await capture(page, '02-home', { timeout: 180000 });

  // Applications - cards view
  await page.goto('/applications');
  await capture(page, '03-applications-cards');

  // Applications - table view (toggle if the list/table icon exists)
  const tableIcon = page.locator('.list-component button.btn-icon span.material-icons').filter({ hasText: /view_list|list/ });
  if (await tableIcon.count() > 0) {
    await tableIcon.first().click();
    await capture(page, '04-applications-table');
  }

  // App summary — navigate into the first app from the current list
  const appLink = page.locator('a[href*="/application/"]').first();
  if (await appLink.count() > 0) {
    await appLink.click();
    await capture(page, '05-app-summary');
  }

  // CF summary
  await page.goto(`/cloud-foundry/${cfGuid}/summary`);
  await capture(page, '06-cf-summary');

  // Discover org and space GUIDs via Stratos proxy API
  let orgGuid = '';
  let spaceGuid = '';
  try {
    const orgsResponse = await Promise.race([
      page.evaluate(async (cfGuid: string) => {
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
        page.evaluate(async ({ cfGuid, orgGuid }: { cfGuid: string; orgGuid: string }) => {
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

  // CF organizations
  await page.goto(`/cloud-foundry/${cfGuid}/organizations`);
  await capture(page, '07-cf-organizations');

  if (orgGuid) {
    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/summary`);
    await capture(page, '08-org-summary');

    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces`);
    await capture(page, '09-org-spaces');

    await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/users`);
    await capture(page, '10-org-users');

    if (spaceGuid) {
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/summary`);
      await capture(page, '11-space-summary');
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/apps`);
      await capture(page, '12-space-apps');
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/routes`);
      await capture(page, '13-space-routes');
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/service-instances`);
      await capture(page, '14-space-services');
      await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/users`);
      await capture(page, '15-space-users');
    }
  } else {
    console.warn('Could not discover org GUID — CF API may be slow');
  }

  // CF platform pages (no org/space needed)
  await page.goto(`/cloud-foundry/${cfGuid}/feature-flags`);
  await capture(page, '20-feature-flags');
  await page.goto(`/cloud-foundry/${cfGuid}/build-packs`);
  await capture(page, '21-buildpacks');
  await page.goto(`/cloud-foundry/${cfGuid}/stacks`);
  await capture(page, '22-stacks');
  await page.goto(`/cloud-foundry/${cfGuid}/security-groups`);
  await capture(page, '23-security-groups');
  await page.goto(`/cloud-foundry/${cfGuid}/quota-definitions`);
  await capture(page, '24-org-quotas');
  await page.goto(`/cloud-foundry/${cfGuid}/events`);
  await capture(page, '25-events');

  // Marketplace
  await page.goto('/marketplace');
  await capture(page, '30-marketplace');

  // Endpoints
  await page.goto('/endpoints');
  await capture(page, '31-endpoints');

  // About, diagnostics, and profile
  await page.goto('/about');
  await capture(page, '40-about');
  await page.goto('/about/diagnostics');
  await capture(page, '41-diagnostics');
  await page.goto('/user-profile');
  await capture(page, '42-user-profile');
}

test.describe('Visual Comparison Screenshots', () => {
  test.setTimeout(600_000); // 10 min — 25+ pages, home page alone can take 3 min

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
