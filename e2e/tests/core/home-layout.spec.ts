import { test, expect } from '../../fixtures/test-base';

/**
 * Home Page Layout Tests
 * Verifies that recent applications data persists across layout changes
 *
 * Bug: FWT-678 - Timestamps disappear when switching from single to two column
 * Root cause: cfhome-card.component.html binds [showDate]="layout.x === 1"
 */
test.describe('Home Page Layout', () => {

  test('recent apps should show timestamps in all column layouts', async ({ connectedEndpointsAdminPage }) => {
    const page = connectedEndpointsAdminPage.page;
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Wait for recent apps to load
    const recentAppsSection = page.locator('text=Recently updated applications');
    await recentAppsSection.waitFor({ timeout: 15000 });

    // Open the layout dropdown (column selector button in top right)
    const layoutButton = page.locator('button.home-layout-select, [matMenuTriggerFor]').first();
    await layoutButton.click();

    // Switch to Single Column
    await page.locator('button:has-text("Single Column")').click();
    await page.waitForTimeout(1000);

    // Verify timestamps are visible in single column
    const appRows = page.locator('app-compact-app-card');
    const firstRowTimestamp = appRows.first().locator('.compact-app-card__date, .app-card-date, time');
    await expect(firstRowTimestamp).toBeVisible({ timeout: 5000 });
    const singleColumnDate = await firstRowTimestamp.textContent();
    expect(singleColumnDate).toBeTruthy();

    // Switch to Two Column
    await layoutButton.click();
    await page.locator('button:has-text("Two Column")').click();
    await page.waitForTimeout(1000);

    // Verify timestamps are still visible in two column layout
    const twoColTimestamp = appRows.first().locator('.compact-app-card__date, .app-card-date, time');
    await expect(twoColTimestamp).toBeVisible({ timeout: 5000 });
    const twoColumnDate = await twoColTimestamp.textContent();
    expect(twoColumnDate).toBeTruthy();

    // Switch back to Single Column and verify timestamps persist
    await layoutButton.click();
    await page.locator('button:has-text("Single Column")').click();
    await page.waitForTimeout(1000);

    const revertedTimestamp = appRows.first().locator('.compact-app-card__date, .app-card-date, time');
    await expect(revertedTimestamp).toBeVisible({ timeout: 5000 });
  });
});
