import { test, expect } from '../../fixtures/test-base';

/**
 * Branding cascade E2E tests — verify the four-layer branding system:
 * 1. Login page uses config theme only (no dark mode bleed)
 * 2. Theme toggle persists across page reloads
 * 3. Profile settings shows light/dark/system buttons
 * 4. Login page displays branding from config
 *
 * Run: STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca npx playwright test tests/core/branding.spec.ts
 */

test.use({ viewport: { width: 1440, height: 900 } });

/** Wait for the page to fully render */
async function waitForPageReady(page: import('@playwright/test').Page, { extraWait = 0 } = {}) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.locator('.progress-bar').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.locator('.list-component, .card, app-info-card, .dashboard-page, .home-page, .login-page, .user-profile-page')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(1500 + extraWait);
}

test.describe('Branding Cascade', () => {

  test('login page theme isolation — dark mode does not bleed to login', async ({ adminPage }) => {
    test.setTimeout(120000);

    // Navigate to home and wait for it to load
    await adminPage.goto('/');
    await waitForPageReady(adminPage);

    // Toggle to dark mode
    const themeToggle = adminPage.locator('button.theme-toggle-button');
    await themeToggle.waitFor({ state: 'visible', timeout: 10000 });

    const label = await themeToggle.locator('.theme-label').textContent();
    if (label?.trim() === 'Light') {
      await themeToggle.click();
      await adminPage.waitForFunction(() => document.body.classList.contains('dark-theme'), { timeout: 5000 });
      await adminPage.waitForTimeout(500);
    }

    // Verify dark mode is active on the dashboard
    const isDark = await adminPage.evaluate(() => document.body.classList.contains('dark-theme'));
    expect(isDark).toBe(true);

    await adminPage.screenshot({
      path: 'e2e-screenshots/branding/dashboard-dark.png',
      fullPage: true,
    });

    // Create a fresh browser context (no auth state) to check login page
    const loginContext = await adminPage.context().browser()!.newContext({
      ignoreHTTPSErrors: true,
    });
    const loginPage = await loginContext.newPage();
    await loginPage.goto('/');
    await loginPage.waitForLoadState('networkidle').catch(() => {});
    await loginPage.waitForTimeout(3000);

    // Verify dark-theme is NOT on the login page body
    const hasDark = await loginPage.evaluate(() => document.body.classList.contains('dark-theme'));
    expect(hasDark).toBe(false);

    await loginPage.screenshot({
      path: 'e2e-screenshots/branding/login-no-dark.png',
      fullPage: true,
    });
    await loginContext.close();

    // Cleanup: toggle back to light mode
    const toggleBack = adminPage.locator('button.theme-toggle-button');
    const darkLabel = await toggleBack.locator('.theme-label').textContent();
    if (darkLabel?.trim() === 'Dark') {
      await toggleBack.click();
      await adminPage.waitForFunction(() => !document.body.classList.contains('dark-theme'), { timeout: 5000 }).catch(() => {});
      await adminPage.waitForTimeout(500);
    }
  });

  test('theme toggle persists across page reload', async ({ adminPage }) => {
    test.setTimeout(90000);

    await adminPage.goto('/');
    await waitForPageReady(adminPage);

    // Ensure we start in light mode
    const themeToggle = adminPage.locator('button.theme-toggle-button');
    await themeToggle.waitFor({ state: 'visible', timeout: 10000 });

    let label = await themeToggle.locator('.theme-label').textContent();
    if (label?.trim() === 'Dark') {
      // Already in dark — toggle to light first
      await themeToggle.click();
      await adminPage.waitForFunction(() => !document.body.classList.contains('dark-theme'), { timeout: 5000 }).catch(() => {});
      await adminPage.waitForTimeout(500);
    }

    // Toggle to dark mode
    const toggle = adminPage.locator('button.theme-toggle-button');
    await toggle.click();
    await adminPage.waitForFunction(() => document.body.classList.contains('dark-theme'), { timeout: 5000 });
    await adminPage.waitForTimeout(500);

    // Reload the page
    await adminPage.reload();
    await waitForPageReady(adminPage);

    // Verify dark mode persisted
    const isDarkAfterReload = await adminPage.evaluate(() => document.body.classList.contains('dark-theme'));
    expect(isDarkAfterReload).toBe(true);

    // Cleanup: toggle back to light
    const cleanupToggle = adminPage.locator('button.theme-toggle-button');
    await cleanupToggle.waitFor({ state: 'visible', timeout: 10000 });
    const cleanupLabel = await cleanupToggle.locator('.theme-label').textContent();
    if (cleanupLabel?.trim() === 'Dark') {
      await cleanupToggle.click();
      await adminPage.waitForFunction(() => !document.body.classList.contains('dark-theme'), { timeout: 5000 }).catch(() => {});
      await adminPage.waitForTimeout(500);
    }
  });

  test('profile settings shows theme toggle buttons', async ({ adminPage }) => {
    test.setTimeout(90000);

    await adminPage.goto('/user-profile');
    await waitForPageReady(adminPage);

    // Verify the button toggle group exists with light/dark/system options
    const lightButton = adminPage.locator('button, mat-button-toggle').filter({ hasText: /light/i });
    const darkButton = adminPage.locator('button, mat-button-toggle').filter({ hasText: /dark/i });
    const systemButton = adminPage.locator('button, mat-button-toggle').filter({ hasText: /system/i });

    await expect(lightButton.first()).toBeVisible({ timeout: 10000 });
    await expect(darkButton.first()).toBeVisible({ timeout: 10000 });
    await expect(systemButton.first()).toBeVisible({ timeout: 10000 });

    await adminPage.screenshot({
      path: 'e2e-screenshots/branding/profile-theme-toggle.png',
      fullPage: true,
    });
  });

  test('login page displays branding from config', async ({ adminPage }) => {
    test.setTimeout(90000);

    // Create unauthenticated context to view login page
    const loginContext = await adminPage.context().browser()!.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 },
    });
    const loginPage = await loginContext.newPage();
    await loginPage.goto('/');
    await loginPage.waitForLoadState('networkidle').catch(() => {});
    await loginPage.waitForTimeout(3000);

    // Verify branding elements are present on the login page
    // Look for a title/heading or company name
    const titleOrHeading = loginPage.locator('h1, h2, .login-title, .login-header, .app-header__logo, .login__title, .title');
    const hasTitleOrHeading = await titleOrHeading.first().isVisible({ timeout: 10000 }).catch(() => false);

    // Look for a logo image
    const logo = loginPage.locator('img, .logo, .app-header__logo img, .login__logo');
    const hasLogo = await logo.first().isVisible({ timeout: 5000 }).catch(() => false);

    // At least one branding element should be visible
    expect(hasTitleOrHeading || hasLogo).toBe(true);

    await loginPage.screenshot({
      path: 'e2e-screenshots/branding/login-branding.png',
      fullPage: true,
    });

    await loginContext.close();
  });
});
