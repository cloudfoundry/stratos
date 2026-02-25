import { Page } from '@playwright/test';

/**
 * Test Utilities
 * Common utility functions for E2E tests
 * Migrated from Protractor E2EHelpers
 */

/**
 * E2E item prefix for test data identification
 */
export const E2E_ITEM_PREFIX = 'acceptance.e2e.';

/**
 * Custom org/space label for tests
 */
export const CUSTOM_ORG_SPACE_LABEL = E2E_ITEM_PREFIX + (process.env.CUSTOM_ORG_SPACE_LABEL || process.env.USER);

/**
 * Create a custom name for test items with timestamp
 * Helps identify acceptance test artifacts in case they leak
 */
export function createCustomName(prefix: string, isoTime?: string): string {
  const timestamp = isoTime || new Date().toISOString().replace(/[-:.]+/g, '');
  return `${prefix}.${timestamp}`;
}

/**
 * Create a custom app label
 */
export function createCustomAppLabel(): string {
  const customLabel = E2E_ITEM_PREFIX + (process.env.CUSTOM_APP_LABEL || process.env.USER);
  return createCustomName(customLabel).toLowerCase();
}

/**
 * Disable animations for faster and more reliable tests
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.sessionStorage.setItem('STRATOS_DISABLE_ANIMATIONS', 'true');
  });
}

/**
 * Set GitHub API URL override
 */
export async function setGitHubApiUrl(page: Page, url: string): Promise<void> {
  await page.evaluate((apiUrl) => {
    window.sessionStorage.setItem('STRATOS_GITHUB_API_URL', apiUrl);
  }, url);
}

/**
 * Browser window size presets
 */
export const WindowSize = {
  NORMAL: { width: 1366, height: 768 },
  SMALL: { width: 640, height: 480 },
  SMALL_WIDTH: { width: 640, height: 768 },
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1920, height: 1080 }
} as const;

/**
 * Set browser viewport size
 */
export async function setBrowserSize(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
}

/**
 * Check if element has specific CSS class
 */
export async function hasClass(page: Page, selector: string, className: string): Promise<boolean> {
  const element = page.locator(selector).first();
  const classes = await element.getAttribute('class');
  return classes ? classes.split(' ').includes(className) : false;
}

/**
 * Wait for Angular to be stable
 * In Playwright, we use networkidle or custom wait conditions
 */
export async function waitForAngular(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Clear browser cookies
 */
export async function clearCookies(page: Page): Promise<void> {
  const context = page.context();
  await context.clearCookies();
}

/**
 * Clear browser storage (localStorage and sessionStorage)
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

/**
 * Get element text content with trimming
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector).first();
  const text = await element.textContent();
  return text ? text.trim() : '';
}

/**
 * Check if button is enabled
 */
export async function isButtonEnabled(page: Page, selector: string): Promise<boolean> {
  const button = page.locator(selector).first();
  return await button.isEnabled();
}

/**
 * Wait for element to be present
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout });
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  await page.locator(selector).first().waitFor({ state: 'hidden', timeout });
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
}

/**
 * Take a screenshot with custom filename
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * Force date for testing time-dependent functionality
 */
export async function forceDate(page: Page, year: number, month: number, day: number): Promise<void> {
  await page.evaluate(
    ({ y, m, d }) => {
      (window as any).__forceDate_oldDate = Date;
      (window as any).Date = function() {
        return new (window as any).__forceDate_oldDate(y, m, d);
      };
    },
    { y: year, m: month, d: day }
  );
}

/**
 * Reset date back to normal
 */
export async function resetDate(page: Page): Promise<void> {
  await page.evaluate(() => {
    if ((window as any).__forceDate_oldDate) {
      (window as any).Date = (window as any).__forceDate_oldDate;
      delete (window as any).__forceDate_oldDate;
    }
  });
}
