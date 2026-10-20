import { test, expect } from '../../fixtures/test-base';
import { TestBroker, createBrokerInstance } from '../../helpers/service-wizard.helper';

/**
 * An offering's Summary, Plans and Instances tabs (#6002), driven by the
 * test broker's offering with one instance of its plan, which the test makes
 * and removes. The tabs are reached by clicking them, as a user does. Needs
 * the test broker's offering and plan in the secrets profile
 * (cloudFoundry[0].services.testBroker); skipped without it.
 */

test.describe('service offering tabs', () => {
  // Making and removing the instance go through the broker.
  test.setTimeout(300000);

  let broker: TestBroker | undefined;
  test.beforeEach(({ secrets }) => {
    broker = secrets.cloudFoundry[0]?.services?.testBroker;
    test.skip(!broker, 'no services.testBroker in the secrets profile');
  });

  test('Summary, Plans and Instances show the offering\'s plan and instance', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-offering-tabs-${Date.now()}`;
    const offeringGuid = await cfApi.findServiceOfferingGuid(broker!.offering, spaceGuid);
    expect(offeringGuid, `offering ${broker!.offering} visible in the test space`).toBeTruthy();
    const base = `/marketplace/${cfGuid}/${offeringGuid}`;
    const tab = (label: string) => page.locator('app-page-side-nav').getByRole('link', { name: label });
    const rows = page.locator('[data-test=row], [data-test=card]');
    try {
      await createBrokerInstance(cfApi, spaceGuid, broker!, name);

      await page.goto(`${base}/summary`);
      await expect(page.locator('app-service-summary-card').first()).toBeVisible({ timeout: 30000 });
      await expect(page.locator('app-service-recent-instances-card')).toContainText(name, { timeout: 60000 });

      await tab('Plans').click();
      await page.waitForURL(url => url.pathname === `${base}/plans`);
      await expect(rows.filter({ hasText: broker!.plan }).first()).toBeVisible({ timeout: 30000 });

      await tab('Instances').click();
      await page.waitForURL(url => url.pathname === `${base}/instances`);
      await expect(rows.filter({ hasText: name })).toBeVisible({ timeout: 60000 });

      await tab('Summary').click();
      await page.waitForURL(url => url.pathname === `${base}/summary`);
      await expect(page.locator('app-service-recent-instances-card')).toContainText(name);
    } finally {
      const si = await cfApi.findServiceInstanceByName(spaceGuid, name).catch(() => null);
      if (si) {
        await cfApi.deleteServiceInstance(si.guid);
        await expect.poll(() => cfApi.serviceInstanceExists(si.guid), { timeout: 120000 }).toBe(false);
      }
    }
  });
});
