import { test, expect } from '../../fixtures/test-base';
import { MarketplacePage } from '../../pages/marketplace/marketplace.page';

/**
 * Service Offering Detail — Plans Tab Smoke (Stage 9b-2)
 *
 * Verifies the Plans tab on /marketplace/:cnsi/:serviceId/plans renders
 * the signal-list framework after the migration off
 * ServicePlansListConfigService + ServicePlansDataSource.
 */
test.describe('Service Offering Plans Tab', () => {

  test('renders the signal-list on the offering Plans tab', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const marketplacePage = new MarketplacePage(page);
    await marketplacePage.navigateTo(cfGuid);
    await marketplacePage.waitForPage();

    const firstOfferingLink = page.locator('app-signal-list a[href*="/services/"]').first();
    const linkVisible = await firstOfferingLink.isVisible().catch(() => false);
    if (!linkVisible) {
      test.skip(true, 'No service offerings on this CF — skip Plans-tab smoke');
      return;
    }

    await firstOfferingLink.click();
    await page.waitForLoadState('networkidle');

    const baseUrl = new URL(page.url());
    const plansUrl = baseUrl.pathname.replace(/\/(summary|plans|instances)?$/, '') + '/plans';
    await page.goto(plansUrl);
    await page.waitForLoadState('networkidle');

    // Regression guard: the migrated tab MUST use <app-signal-list>, not
    // the legacy <app-list>.
    const signalList = page.locator('app-signal-list').first();
    await expect(signalList).toBeVisible({ timeout: 10000 });
  });
});
