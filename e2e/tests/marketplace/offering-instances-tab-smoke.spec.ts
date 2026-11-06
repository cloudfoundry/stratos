import { test, expect } from '../../fixtures/test-base';
import { MarketplacePage } from '../../pages/marketplace/marketplace.page';

/**
 * Service Offering Detail — Instances Tab Smoke (Stage 9b-1)
 *
 * Verifies the Instances tab on /services/:cnsi/:serviceId/instances
 * renders the signal-list framework after the migration off
 * ServiceInstancesListConfigService + CfServiceInstancesListConfigBase.
 */
test.describe('Service Offering Instances Tab', () => {

  test('renders the signal-list on the offering Instances tab', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const marketplacePage = new MarketplacePage(page);
    await marketplacePage.navigateTo(cfGuid);
    await marketplacePage.waitForPage();

    // Pick the first offering on the marketplace and drill into its
    // Instances tab. The wall now uses <app-signal-list>; the offering
    // tab should too. Bail early (test passes) if the marketplace is
    // genuinely empty — we still want the spec to exercise the tab on
    // CFs that have offerings without becoming a hard failure on those
    // that don't.
    const firstOfferingLink = page.locator('app-signal-list a[href*="/services/"]').first();
    const linkVisible = await firstOfferingLink.isVisible().catch(() => false);
    if (!linkVisible) {
      test.skip(true, 'No service offerings on this CF — skip Instances-tab smoke');
      return;
    }

    await firstOfferingLink.click();
    await page.waitForLoadState('networkidle');

    // Navigate to the Instances tab via URL append — robust to L4 sub-nav
    // markup variations across themes.
    const baseUrl = new URL(page.url());
    const instancesUrl = baseUrl.pathname.replace(/\/(summary|plans|instances)?$/, '') + '/instances';
    await page.goto(instancesUrl);
    await page.waitForLoadState('networkidle');

    // Regression guard: the migrated tab MUST use <app-signal-list>, not
    // the legacy <app-list>. If this locator hits the legacy element
    // instead, the migration regressed.
    const signalList = page.locator('app-signal-list').first();
    await expect(signalList).toBeVisible({ timeout: 10000 });
  });
});
