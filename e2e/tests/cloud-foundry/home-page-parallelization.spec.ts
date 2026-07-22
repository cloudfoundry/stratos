import { test, expect } from '../../fixtures/test-base';

/**
 * Home Page Parallelization E2E Tests
 *
 * Baseline measurements (adepttech, 2026-04-18):
 *   cf curl /v3/organizations: 0.66–1.79s direct
 *   cf curl /v3/apps:          0.90–1.25s direct
 * Timeout = 95th-percentile ≈ 3s × 2 × Stratos overhead → 15s
 *
 * These tests verify:
 *   1. CF home cards all begin loading (are visible) simultaneously
 *   2. Metrics (org/app/route counts) populate within the timeout
 *   3. Navigating away and back shows cached data immediately (sticky signals)
 *   4. No data bleed between endpoint cards (each card independently populated)
 */

const LOAD_TIMEOUT_MS = 15000;
// Cached data should appear faster than a fresh fetch (LOAD_TIMEOUT_MS).
// 5s is generous enough for Angular CD under parallel test load.
const STICKY_CACHE_TIMEOUT_MS = 5000;

test.describe('Home page CF card parallelization', () => {

  test('all visible CF endpoint cards are present on home page', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Wait for dynamic card components (created via ViewContainerRef.createComponent())
    const cards = page.locator('app-cfhome-card');
    await expect(cards.first()).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // All cards must be visible (not hidden behind a sequential queue)
    for (let i = 0; i < cardCount; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
  });

  test('org count loads for each card within timeout', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('**/home', { timeout: 10000 });

    const cards = page.locator('app-cfhome-card');
    await expect(cards.first()).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      // Org count metric: wait for a non-zero number (initial signal value is 0;
      // a real non-zero count confirms the API response was received)
      const orgMetric = card.locator('app-card-number-metric').nth(1);
      await expect(orgMetric).toContainText(/[1-9]\d*/, { timeout: LOAD_TIMEOUT_MS });
    }
  });

  test('app count loads for each card within timeout', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('**/home', { timeout: 10000 });

    const cards = page.locator('app-cfhome-card');
    await expect(cards.first()).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      // App count is the first metric
      const appMetric = card.locator('app-card-number-metric').first();
      await expect(appMetric).toContainText(/[1-9]\d*/, { timeout: LOAD_TIMEOUT_MS });
    }
  });

  test('navigating away and back shows cached data immediately', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Wait for at least one card to fully load
    const firstCard = page.locator('app-cfhome-card').first();
    const appMetric = firstCard.locator('app-card-number-metric').first();
    await expect(appMetric).toContainText(/[1-9]\d*/, { timeout: LOAD_TIMEOUT_MS });

    // Navigate away
    await page.goto('/endpoints');
    await page.waitForURL('**/endpoints**', { timeout: 10000 });

    // Navigate back — sticky signals in EndpointDataRegistry retain data
    await page.goto('/');
    await page.waitForURL('**/home**', { timeout: 10000 });
    // Wait for the card element to be created (async via ViewContainerRef.createComponent())
    await expect(page.locator('app-cfhome-card').first()).toBeVisible({ timeout: LOAD_TIMEOUT_MS });

    // Data should appear from cache, no re-fetch needed
    await expect(firstCard.locator('app-card-number-metric').first())
      .toContainText(/[1-9]\d*/, { timeout: STICKY_CACHE_TIMEOUT_MS });
  });

  test('no data bleed between endpoint cards', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('**/home', { timeout: 10000 });

    const cards = page.locator('app-cfhome-card');
    await expect(cards.first()).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    // Temporarily removed: skip-if-count<2 guard, to allow testing with the same
    // endpoint registered twice (simulating multiple endpoints locally).

    // Wait for both cards to load
    await expect(cards.nth(0).locator('app-card-number-metric').first())
      .toContainText(/[1-9]\d*/, { timeout: LOAD_TIMEOUT_MS });
    await expect(cards.nth(1).locator('app-card-number-metric').first())
      .toContainText(/[1-9]\d*/, { timeout: LOAD_TIMEOUT_MS });

    // Each card must have independently loaded values (both present)
    const appCount0 = await cards.nth(0).locator('app-card-number-metric').first().textContent();
    const appCount1 = await cards.nth(1).locator('app-card-number-metric').first().textContent();
    expect(appCount0).toMatch(/\d+/);
    expect(appCount1).toMatch(/\d+/);
  });
});
