import { test, expect } from '../../fixtures/test-base';
import { MarketplacePage } from '../../pages/marketplace/marketplace.page';

/**
 * Service Offering Detail — Summary Tab Smoke (Stage 9b-2)
 *
 * Verifies the Summary tab on /marketplace/:cnsi/:serviceId/summary
 * renders the migrated signal-native cards (summary + recent instances)
 * after the migration off the ngrx-coupled ServicesService.
 *
 * Regression guard: the legacy `app-list` element used to live on the
 * sibling Plans tab; since that's also now signal-list, the Summary tab
 * itself must keep its meta-card chrome and not regress to a list shell.
 */
test.describe('Service Offering Summary Tab', () => {

  test('renders the migrated meta-card chrome on the offering Summary tab', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const marketplacePage = new MarketplacePage(page);
    await marketplacePage.navigateTo(cfGuid);
    await marketplacePage.waitForPage();

    const firstOfferingLink = page.locator('app-signal-list a[href*="/services/"]').first();
    const linkVisible = await firstOfferingLink.isVisible().catch(() => false);
    if (!linkVisible) {
      test.skip(true, 'No service offerings on this CF — skip Summary-tab smoke');
      return;
    }

    await firstOfferingLink.click();
    await page.waitForLoadState('networkidle');

    // Force navigate to the Summary path — robust to L4 sub-nav variants.
    const baseUrl = new URL(page.url());
    const summaryUrl = baseUrl.pathname.replace(/\/(summary|plans|instances)?$/, '') + '/summary';
    await page.goto(summaryUrl);
    await page.waitForLoadState('networkidle');

    // The migrated Summary tab renders <app-service-summary-card> +
    // <app-service-recent-instances-card>; neither existed under the
    // legacy <app-list>-style tabs, so their presence is the regression
    // guard.
    const summaryCard = page.locator('app-service-summary-card').first();
    await expect(summaryCard).toBeVisible({ timeout: 10000 });

    const recentInstancesCard = page.locator('app-service-recent-instances-card').first();
    await expect(recentInstancesCard).toBeVisible({ timeout: 10000 });
  });
});
