import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { TestBroker } from '../../helpers/service-wizard.helper';

/**
 * The Services Marketplace list and an offering's page (#6002), driven by
 * the test broker's offering, which the test space can see. Needs it in the
 * secrets profile (cloudFoundry[0].services.testBroker); skipped without it.
 */

/** Opens the marketplace filtered to name. */
async function filterTo(page: Page, name: string): Promise<Locator> {
  await page.goto('/marketplace');
  await page.locator('[data-test=name-filter]').fill(name);
  return page.locator('[data-test=row], [data-test=card]');
}

test.describe('marketplace', () => {
  let broker: TestBroker | undefined;
  test.beforeEach(({ secrets }) => {
    broker = secrets.cloudFoundry[0]?.services?.testBroker;
    test.skip(!broker, 'no services.testBroker in the secrets profile');
  });

  test('filters the offerings by name', { tag: '@smoke' }, async ({ connectedEndpointsAdminPage }) => {
    const { page } = connectedEndpointsAdminPage;
    const rows = await filterTo(page, broker!.offering);
    await expect(rows.filter({ hasText: broker!.offering }).first()).toBeVisible({ timeout: 60000 });

    await page.locator('[data-test=name-filter]').fill(`e2e-no-such-offering-${Date.now()}`);
    await expect(page.locator('[data-test=empty-filtered]')).toContainText('No services match the current filters');
    await expect(rows).toHaveCount(0);
  });

  test('opens an offering\'s page, and its Add Service Instance opens the create wizard', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const offeringGuid = await cfApi.findServiceOfferingGuid(broker!.offering, spaceGuid);
    expect(offeringGuid, `offering ${broker!.offering} visible in the test space`).toBeTruthy();

    const rows = await filterTo(page, broker!.offering);
    // The link of this CF's offering; another CF may offer one of the same name.
    await rows.locator(`a[href="/marketplace/${cfGuid}/${offeringGuid}"]`).click({ timeout: 60000 });
    await page.waitForURL(url => url.pathname === `/marketplace/${cfGuid}/${offeringGuid}/summary`);
    // The page title is projected into the top bar's page header.
    await expect(page.locator('app-show-page-header')).toContainText(broker!.offering);
    await expect(page.locator('app-service-summary-card')).toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: 'Add Service Instance' }).click();
    await page.waitForURL(url => url.pathname === `/marketplace/${cfGuid}/${offeringGuid}/create`);
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible({ timeout: 30000 });
  });
});
