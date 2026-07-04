import { test, expect } from '../../fixtures/test-base';

/**
 * Diagnostics Pages E2E Tests
 *
 * Covers the About → Diagnostics tab shell and its two proof-of-concept
 * sub-pages:
 *  - Entity Counts: per-endpoint entity counts via the jetstream
 *    `?return=counts` fast paths, with footprint/risk annotations.
 *  - Load Performance: the Performance-API load report (milestones,
 *    resource waterfall, transfer sizes) with markdown/JSON export.
 *
 * The Load Performance page is the instrument used to compare deployments
 * (GH #5550/#5391), so these tests guard that it keeps producing a real,
 * populated report end to end.
 */
test.describe('Diagnostics', () => {

  test('redirects to the overview tab and shows all three tabs', async ({ connectedEndpointsAdminPage }) => {
    const page = connectedEndpointsAdminPage.page;
    await page.goto('/about/diagnostics');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/about\/diagnostics\/overview$/);
    await expect(page.locator('a', { hasText: 'Overview' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Entity Counts' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Load Performance' })).toBeVisible();
  });

  test('entity counts page shows per-endpoint counts with footprints', async ({ connectedEndpointsAdminPage }) => {
    const page = connectedEndpointsAdminPage.page;
    await page.goto('/about/diagnostics/counts');
    await page.waitForLoadState('networkidle');

    // POC notice and heap line
    await expect(page.locator('[data-test="poc-notice"]')).toBeVisible();
    await expect(page.locator('text=/Heap: /')).toBeVisible();

    // The fixture guarantees a connected CF endpoint, so a card must render
    // with the probed entity rows (scope to table cells — "Organizations"
    // also appears in the side nav and home shortcuts).
    await expect(page.locator('td', { hasText: 'Organizations' }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('td', { hasText: 'Applications' }).first()).toBeVisible();

    // At least one probe must resolve to a numeric count (not stay pending).
    const orgRow = page.locator('tr', { hasText: 'Organizations' }).first();
    await expect(orgRow.locator('td').nth(1)).toHaveText(/^[\d,]+$/, { timeout: 20000 });
  });

  test('load performance page produces a populated report', async ({ connectedEndpointsAdminPage }) => {
    const page = connectedEndpointsAdminPage.page;
    await page.goto('/about/diagnostics/performance');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-test="poc-notice"]')).toBeVisible();

    // Summary card with milestones
    await expect(page.locator('text=Summary')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('td', { hasText: 'DOMContentLoaded' })).toBeVisible();
    // Scope to the milestone cell — the waterfall caption also mentions LCP.
    await expect(page.locator('td', { hasText: 'Largest contentful paint' })).toBeVisible();

    // A real load produced resources: the waterfall and top-resources table
    // both report a count — assert on the first.
    await expect(page.locator('text=/Showing \\d+ of \\d+ resources/').first()).toBeVisible();

    // Export buttons present
    await expect(page.locator('[data-test="copy-markdown"]')).toBeVisible();
    await expect(page.locator('[data-test="copy-json"]')).toBeVisible();
  });

  test('copy as JSON exports a parseable load report', async ({ connectedEndpointsAdminPage }) => {
    const page = connectedEndpointsAdminPage.page;
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/about/diagnostics/performance');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-test="copy-json"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-test="copy-json"]').click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    const report = JSON.parse(clipboard);
    expect(report.collectedAt).toBeTruthy();
    expect(report.topology === 'cf-pushed' || report.topology === 'local/other').toBe(true);
    expect(Array.isArray(report.resources)).toBe(true);
    expect(report.requestCount).toBeGreaterThan(0);
  });

  test('measure again refreshes the report without breaking the page', async ({ connectedEndpointsAdminPage }) => {
    const page = connectedEndpointsAdminPage.page;
    await page.goto('/about/diagnostics/performance');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button', { hasText: 'Measure again' })).toBeVisible({ timeout: 15000 });
    await page.locator('button', { hasText: 'Measure again' }).click();

    // Report re-renders (the buffer is drained per measure, so counts may
    // shrink — the page must still show a coherent summary).
    await expect(page.locator('text=Summary')).toBeVisible();
    await expect(page.locator('text=DOMContentLoaded')).toBeVisible();
  });
});
