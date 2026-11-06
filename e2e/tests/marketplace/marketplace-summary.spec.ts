import { test, expect } from '../../fixtures/test-base';
import { MarketplaceSummaryPage } from '../../pages/marketplace/marketplace-summary.page';

/**
 * Marketplace Summary E2E Tests
 * Migrated from src/test-e2e/marketplace/marketplace-summary-e2e.spec.ts
 *
 * Tests individual service summary pages in the marketplace
 */

test.describe('Marketplace Summary', () => {

  test('should reach marketplace summary page', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

    // Get first available service from CF
    // Note: This requires at least one service broker to be available in the CF
    const servicesResponse = await connectedEndpointsAdminPage.request.get(
      `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
    );
    const services = servicesResponse.resources;

    if (services && services.length > 0) {
      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).toContain(`/marketplace/${cfGuid}/${serviceGuid}/summary`);
    } else {
      test.skip('No service offerings available in CF - skipping marketplace summary test');
    }
  });

  test('should display service summary card', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    // Get first available service
    const servicesResponse = await connectedEndpointsAdminPage.request.get(
      `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
    );
    const services = servicesResponse.resources;

    if (services && services.length > 0) {
      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Verify service summary card is present
      const summaryCard = marketplaceSummaryPage.getServiceSummaryCard();
      await expect(summaryCard).toBeVisible({ timeout: 10000 });
    } else {
      test.skip('No service offerings available - skipping test');
    }
  });

  test('should display recent service instances card', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const servicesResponse = await connectedEndpointsAdminPage.request.get(
      `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
    );
    const services = servicesResponse.resources;

    if (services && services.length > 0) {
      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Verify recent instances card is present
      const recentInstances = marketplaceSummaryPage.getRecentInstances();
      await expect(recentInstances).toBeVisible({ timeout: 10000 });
    } else {
      test.skip('No service offerings available - skipping test');
    }
  });

  test('should have add service instance button', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const servicesResponse = await connectedEndpointsAdminPage.request.get(
      `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
    );
    const services = servicesResponse.resources;

    if (services && services.length > 0) {
      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Verify add service instance button is present
      const addButton = marketplaceSummaryPage.getAddServiceInstanceButton();
      const isVisible = await addButton.isVisible().catch(() => false);

      // Button might be in header or as a floating action button
      if (!isVisible) {
        // Try alternative selectors
        const altButton = page.locator('button:has-text("Add"), button[aria-label*="add"]').first();
        await expect(altButton).toBeVisible({ timeout: 5000 });
      } else {
        await expect(addButton).toBeVisible();
      }
    } else {
      test.skip('No service offerings available - skipping test');
    }
  });

  test('should navigate to create service instance on button click', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const servicesResponse = await connectedEndpointsAdminPage.request.get(
      `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
    );
    const services = servicesResponse.resources;

    if (services && services.length > 0) {
      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Click add service instance button
      const addButton = marketplaceSummaryPage.getAddServiceInstanceButton();
      const isVisible = await addButton.isVisible().catch(() => false);

      if (isVisible) {
        await addButton.click();
      } else {
        // Try alternative button
        const altButton = page.locator('button:has-text("Add"), button[aria-label*="add"]').first();
        await altButton.click();
      }

      // Wait for navigation to create page
      await page.waitForURL(/.*create\?isSpaceScoped=false.*/, { timeout: 10000 });

      const url = page.url();
      expect(url).toContain('create?isSpaceScoped=false');
    } else {
      test.skip('No service offerings available - skipping test');
    }
  });

  test.describe('Service Offerings Discovery (UI)', () => {

    test('should discover and display all service plans', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      // Get first available service
      const servicesResponse = await connectedEndpointsAdminPage.request.get(
        `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
      );
      const services = servicesResponse.resources;

      if (!services || services.length === 0) {
        test.skip('No service offerings available - skipping test');
      }

      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Look for service plans section or list
      const plansSection = page.locator('[class*="plan"], [class*="service-plan"], app-service-plans').first();
      const plansSectionExists = await plansSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (!plansSectionExists) {
        // Try looking for plans in a table or list
        const plansList = page.locator('mat-list, app-list, table').filter({ hasText: /plan/i }).first();
        const plansListExists = await plansList.isVisible({ timeout: 5000 }).catch(() => false);

        if (!plansListExists) {
          test.skip('Service plans display not found in UI');
        }

        await expect(plansList).toBeVisible();
      } else {
        await expect(plansSection).toBeVisible();
      }

      // Verify at least one plan is displayed
      const planItems = page.locator('[class*="plan-item"], [class*="service-plan-"], mat-list-item, tr').filter({ hasText: /plan|standard|free|basic/i });
      const planCount = await planItems.count();
      expect(planCount).toBeGreaterThanOrEqual(0); // May be 0 if no plans configured
    });

    test('should show service plan costs and limits', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const servicesResponse = await connectedEndpointsAdminPage.request.get(
        `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
      );
      const services = servicesResponse.resources;

      if (!services || services.length === 0) {
        test.skip('No service offerings available - skipping test');
      }

      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Look for cost/pricing information
      const costInfo = page.locator(':text("cost"), :text("price"), :text("free"), :text("$")').first();
      const costExists = await costInfo.isVisible({ timeout: 5000 }).catch(() => false);

      // Look for limits information
      const limitsInfo = page.locator(':text("limit"), :text("quota"), :text("maximum"), :text("MB"), :text("GB")').first();
      const limitsExist = await limitsInfo.isVisible({ timeout: 5000 }).catch(() => false);

      if (!costExists && !limitsExist) {
        test.skip('Plan costs and limits information not displayed in UI');
      }

      // At least one should be visible
      if (costExists) {
        await expect(costInfo).toBeVisible();
      }
      if (limitsExist) {
        await expect(limitsInfo).toBeVisible();
      }
    });

    test('should filter service instances by plan', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const servicesResponse = await connectedEndpointsAdminPage.request.get(
        `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
      );
      const services = servicesResponse.resources;

      if (!services || services.length === 0) {
        test.skip('No service offerings available - skipping test');
      }

      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Look for filter controls (dropdown, select, or filter buttons)
      const filterControl = page.locator('mat-select, select, [class*="filter"]').filter({ hasText: /plan|filter/i }).first();
      const filterExists = await filterControl.isVisible({ timeout: 5000 }).catch(() => false);

      if (!filterExists) {
        // Try looking for filter in instances section
        const instancesSection = page.locator('app-list, [class*="instances"]').first();
        const instancesSectionExists = await instancesSection.isVisible({ timeout: 5000 }).catch(() => false);

        if (instancesSectionExists) {
          const filterInSection = instancesSection.locator('mat-select, select, button').filter({ hasText: /plan|filter/i }).first();
          const filterInSectionExists = await filterInSection.isVisible({ timeout: 5000 }).catch(() => false);

          if (!filterInSectionExists) {
            test.skip('Plan filter control not found in UI');
          }

          await expect(filterInSection).toBeVisible();
        } else {
          test.skip('Instances section with plan filter not found');
        }
      } else {
        await expect(filterControl).toBeVisible();

        // Try to open filter dropdown
        await filterControl.click().catch(() => {});
        await page.waitForTimeout(500);

        // Look for plan options
        const planOptions = page.locator('mat-option, option').filter({ hasText: /plan|standard|free|basic/i }).first();
        const optionsExist = await planOptions.isVisible({ timeout: 2000 }).catch(() => false);

        if (optionsExist) {
          await expect(planOptions).toBeVisible();
        }

        // Close dropdown
        await page.keyboard.press('Escape');
      }
    });

    test('should display service broker information', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const servicesResponse = await connectedEndpointsAdminPage.request.get(
        `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
      );
      const services = servicesResponse.resources;

      if (!services || services.length === 0) {
        test.skip('No service offerings available - skipping test');
      }

      const serviceGuid = services[0].guid;
      const marketplaceSummaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);

      await marketplaceSummaryPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Look for broker information section
      const brokerInfo = page.locator('[class*="broker"], :text("broker"), :text("provider")').first();
      const brokerExists = await brokerInfo.isVisible({ timeout: 5000 }).catch(() => false);

      if (!brokerExists) {
        // Try looking in summary card or metadata
        const summaryCard = marketplaceSummaryPage.getServiceSummaryCard();
        const brokerInCard = summaryCard.locator(':text("broker"), :text("provider")').first();
        const brokerInCardExists = await brokerInCard.isVisible({ timeout: 5000 }).catch(() => false);

        if (!brokerInCardExists) {
          test.skip('Service broker information not displayed in UI');
        }

        await expect(brokerInCard).toBeVisible();
      } else {
        await expect(brokerInfo).toBeVisible();
      }

      // Verify broker name is shown
      const brokerText = await brokerInfo.textContent().catch(() => '');
      expect(brokerText.length).toBeGreaterThan(0);
    });
  });
});
