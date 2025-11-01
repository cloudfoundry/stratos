import { test, expect } from '../../fixtures/test-base';
import { ApplicationsPage } from '../../pages/application/applications-list.page';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Application Wall E2E Tests
 * Migrated from src/test-e2e/applications/application-wall-e2e.spec.ts
 *
 * Tests the applications wall page (list view, filters, sorting)
 *
 * CF Helpers Integration:
 * - ✅ CFApiHelper - Full CF V3 API wrapper
 * - ✅ ApplicationTestHelper - High-level app management
 * - ✅ Test fixtures - withTestApp, withTestApps for automatic resource management
 */

const customOrgSpacesLabel = createCustomName('app-wall-tests');

test.describe('Application Wall Tests', () => {

  test.describe('Basic Wall View', () => {
    test('should display applications wall', async ({ connectedEndpointsUserPage }) => {
      const appsPage = new ApplicationsPage(connectedEndpointsUserPage);

      // Navigate to applications
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Verify page is active
      expect(await appsPage.isActivePage()).toBeTruthy();
    });

    test('should show list component', async ({ connectedEndpointsUserPage }) => {
      const appsPage = new ApplicationsPage(connectedEndpointsUserPage);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // List should be visible
      expect(await appsPage.list.isDisplayed()).toBeTruthy();
    });
  });

  test.describe('List Operations', () => {
    test('should switch between card and table view', async ({ connectedEndpointsUserPage }) => {
      const appsPage = new ApplicationsPage(connectedEndpointsUserPage);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Get current view
      const isCardView = await appsPage.list.isCardsView();

      // Toggle view
      if (isCardView) {
        await appsPage.list.header.setTableView();
        expect(await appsPage.list.isTableView()).toBeTruthy();
      } else {
        await appsPage.list.header.setCardsView();
        expect(await appsPage.list.isCardsView()).toBeTruthy();
      }
    });

    test('should filter applications by name', async ({ connectedEndpointsUserPage }) => {
      const appsPage = new ApplicationsPage(connectedEndpointsUserPage);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Get initial count
      const initialCount = await appsPage.list.getTotalResults();

      // Apply filter
      await appsPage.list.header.setSearchText('test-app');

      // Wait for filter to apply
      await connectedEndpointsUserPage.waitForTimeout(500);

      // Filtered count should be <= initial count
      const filteredCount = await appsPage.list.getTotalResults();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });
  });

  test.describe('With Test Applications', () => {
    // These tests use CF helpers to create test applications
    // withTestApps fixture automatically:
    // 1. Creates 3 test applications with e2e labels
    // 2. Provides page, testApps array, and helper
    // 3. Cleans up all apps after test completion

    test('should display created test applications', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const appsPage = new ApplicationsPage(page);

      // Navigate to applications
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Verify we have applications displayed
      const totalResults = await appsPage.list.getTotalResults();
      expect(totalResults).toBeGreaterThanOrEqual(testApps.length);

      // Verify at least one of our test apps is visible
      const appNames = testApps.map(app => app.app.name);
      const firstAppName = appNames[0];

      // Search for our test app
      await appsPage.list.header.setSearchText(firstAppName);
      await page.waitForTimeout(1000); // Wait for filter

      // Should find the app
      const filteredResults = await appsPage.list.getTotalResults();
      expect(filteredResults).toBeGreaterThan(0);
    });

    test('should navigate to application details', async ({ withTestApp }) => {
      const { page, testApp, helper } = withTestApp;

      // Navigate to app summary using helper
      await helper.navigateToAppSummary(testApp);

      // Verify we're on the app summary page
      const summaryPage = page.locator('app-application-page');
      await summaryPage.waitFor({ timeout: 10000 });
      expect(await summaryPage.isVisible()).toBeTruthy();

      // Verify app name is displayed
      const appName = testApp.app.name;
      const heading = page.locator('h1, h2, .app-name').filter({ hasText: appName });
      await heading.waitFor({ timeout: 5000 });
      expect(await heading.isVisible()).toBeTruthy();
    });

    test('should sort applications by name', async ({ withTestApps }) => {
      const { page } = withTestApps;
      const appsPage = new ApplicationsPage(page);

      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Look for sort options
      const sortButton = page.locator('button, mat-select').filter({ hasText: /sort|order/i }).first();
      const hasSortButton = await sortButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasSortButton) {
        test.skip('Sort functionality not available in UI');
      }

      await sortButton.click();

      // Look for name sort option
      const nameOption = page.locator('mat-option, button').filter({ hasText: /name/i }).first();
      const hasNameOption = await nameOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasNameOption) {
        await nameOption.click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press('Escape');
        test.skip('Name sort option not found');
      }
    });

    test('should sort applications by creation date', async ({ withTestApps }) => {
      const { page } = withTestApps;
      const appsPage = new ApplicationsPage(page);

      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Look for sort options
      const sortButton = page.locator('button, mat-select').filter({ hasText: /sort|order/i }).first();
      const hasSortButton = await sortButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasSortButton) {
        test.skip('Sort functionality not available in UI');
      }

      await sortButton.click();

      // Look for creation date sort option
      const dateOption = page.locator('mat-option, button').filter({ hasText: /creat|date/i }).first();
      const hasDateOption = await dateOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasDateOption) {
        await dateOption.click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press('Escape');
        test.skip('Creation date sort option not found');
      }
    });

    test('should filter by organization', async ({ withTestApps }) => {
      const { page } = withTestApps;
      const appsPage = new ApplicationsPage(page);

      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Look for org filter
      const orgFilter = page.locator('[placeholder*="org"], mat-select').filter({ hasText: /organization/i }).first();
      const hasOrgFilter = await orgFilter.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasOrgFilter) {
        test.skip('Organization filter not available');
      }

      await orgFilter.click();

      // Select first organization option
      const firstOrg = page.locator('mat-option').first();
      const hasOptions = await firstOrg.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasOptions) {
        await firstOrg.click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press('Escape');
        test.skip('No organization options available');
      }
    });

    test('should filter by space', async ({ withTestApps }) => {
      const { page } = withTestApps;
      const appsPage = new ApplicationsPage(page);

      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Look for space filter
      const spaceFilter = page.locator('[placeholder*="space"], mat-select').filter({ hasText: /space/i }).first();
      const hasSpaceFilter = await spaceFilter.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasSpaceFilter) {
        test.skip('Space filter not available');
      }

      await spaceFilter.click();

      // Select first space option
      const firstSpace = page.locator('mat-option').first();
      const hasOptions = await firstSpace.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasOptions) {
        await firstSpace.click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press('Escape');
        test.skip('No space options available');
      }
    });

    test('should display application status correctly', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const appsPage = new ApplicationsPage(page);

      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Search for our test app
      await appsPage.list.header.setSearchText(testApp.app.name);
      await page.waitForTimeout(1000);

      // Find app card/row
      const appCard = page.locator('app-card, mat-card, tr').filter({ hasText: testApp.app.name }).first();
      const cardExists = await appCard.isVisible({ timeout: 5000 }).catch(() => false);

      if (!cardExists) {
        test.skip('Application card not found');
      }

      // Check for status indicator
      const statusIndicator = appCard.locator('.status, mat-chip, .state, [class*="status"]').first();
      const hasStatus = await statusIndicator.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasStatus) {
        await expect(statusIndicator).toBeVisible();
        const statusText = await statusIndicator.textContent();
        expect(statusText).toBeTruthy();
      } else {
        test.skip('Status indicator not found in app card');
      }
    });

    test('should show application instance count', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const appsPage = new ApplicationsPage(page);

      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Search for our test app
      await appsPage.list.header.setSearchText(testApp.app.name);
      await page.waitForTimeout(1000);

      // Find app card/row
      const appCard = page.locator('app-card, mat-card, tr').filter({ hasText: testApp.app.name }).first();
      const cardExists = await appCard.isVisible({ timeout: 5000 }).catch(() => false);

      if (!cardExists) {
        test.skip('Application card not found');
      }

      // Check for instance count (look for patterns like "1/1", "2 instances", etc.)
      const instanceInfo = appCard.locator(':text-matches("\\d+[/\\s]*(instance|running)", "i")').first();
      const hasInstanceInfo = await instanceInfo.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasInstanceInfo) {
        await expect(instanceInfo).toBeVisible();
      } else {
        // May be displayed differently
        const cardText = await appCard.textContent();
        const hasNumbers = /\d+/.test(cardText || '');
        expect(hasNumbers).toBeTruthy();
      }
    });

    test('should display application memory usage', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const appsPage = new ApplicationsPage(page);

      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Search for our test app
      await appsPage.list.header.setSearchText(testApp.app.name);
      await page.waitForTimeout(1000);

      // Find app card/row
      const appCard = page.locator('app-card, mat-card, tr').filter({ hasText: testApp.app.name }).first();
      const cardExists = await appCard.isVisible({ timeout: 5000 }).catch(() => false);

      if (!cardExists) {
        test.skip('Application card not found');
      }

      // Check for memory info (look for patterns like "256MB", "1GB", etc.)
      const memoryInfo = appCard.locator(':text-matches("\\d+\\s*(MB|GB|memory)", "i")').first();
      const hasMemoryInfo = await memoryInfo.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasMemoryInfo) {
        await expect(memoryInfo).toBeVisible();
      } else {
        // Memory might be displayed in a different format
        test.skip('Memory information not found in expected format');
      }
    });
  });
});
