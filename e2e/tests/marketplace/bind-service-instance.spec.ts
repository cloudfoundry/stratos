import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { toast } from '../../helpers/fake-job.helper';
import { TestBroker, next, pick } from '../../helpers/service-wizard.helper';

/**
 * Binding an existing managed service instance to an app from the app's
 * Services tab, and unbinding it there (#6002), checked against what CF then
 * holds. Binding while creating an instance is tested in
 * async-service-writes.spec.ts. Each test makes its own instance, from the
 * test broker's plan, and its own app, and removes both afterwards. Needs the
 * test broker's offering and plan in the secrets profile
 * (cloudFoundry[0].services.testBroker); skipped without it.
 */

/** Makes a managed instance of the broker's plan and waits until CF has it. Returns its guid. */
async function createInstance(cfApi: CFApiHelper, spaceGuid: string, broker: TestBroker, name: string): Promise<string> {
  const planGuid = await cfApi.findServicePlanGuid(broker.offering, spaceGuid, broker.plan);
  expect(planGuid, `plan ${broker.plan} visible in the test space`).toBeTruthy();
  await cfApi.createManagedServiceInstance(spaceGuid, name, planGuid!);
  await expect.poll(async () => (await cfApi.findServiceInstanceByName(spaceGuid, name))?.last_operation?.state,
    { timeout: 120000 }).toBe('succeeded');
  return (await cfApi.findServiceInstanceByName(spaceGuid, name))!.guid;
}

/** Removes the named instance and any app bindings it has, if CF has it. */
async function removeInstance(cfApi: CFApiHelper, spaceGuid: string, name: string): Promise<void> {
  const si = await cfApi.findServiceInstanceByName(spaceGuid, name).catch(() => null);
  if (!si) {
    return;
  }
  for (const binding of await cfApi.getAppBindings(si.guid)) {
    await cfApi.unbindService(binding.guid);
  }
  // Unbinding a managed instance is a CF job; CF refuses the delete until it ends.
  await expect.poll(async () => (await cfApi.getAppBindings(si.guid)).length, { timeout: 120000 }).toBe(0);
  await cfApi.deleteServiceInstance(si.guid);
  await expect.poll(() => cfApi.serviceInstanceExists(si.guid), { timeout: 120000 }).toBe(false);
}

/** The instance's row on the app's Services tab. */
async function bindingRow(page: Page, cfGuid: string, appGuid: string, name: string): Promise<Locator> {
  await page.goto(`/applications/${cfGuid}/${appGuid}/services`);
  return page.locator('[data-test=row], [data-test=card]').filter({ hasText: name });
}

test.describe('app services tab: bind an existing instance', () => {
  // Making, binding, unbinding and removing the instance go through the broker.
  test.setTimeout(300000);

  let broker: TestBroker | undefined;
  test.beforeEach(({ secrets }) => {
    broker = secrets.cloudFoundry[0]?.services?.testBroker;
    test.skip(!broker, 'no services.testBroker in the secrets profile');
  });

  test('binds it from Bind Service, then unbinds it from its row', async ({ connectedEndpointsAdminPage, cfApi, applicationHelper }) => {
    const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-bind-existing-${Date.now()}`;
    const testApp = await applicationHelper.createTestApp(`e2e-bind-existing-app-${Date.now()}`);
    const appGuid = testApp.app.guid;
    try {
      const guid = await createInstance(cfApi, spaceGuid, broker!, name);

      await page.goto(`/applications/${cfGuid}/${appGuid}/services`);
      await page.locator('[data-test=list-sub-nav-add]').click();
      await page.getByRole('button', { name: /Marketplace Service/ }).click();
      await pick(page, 0, broker!.offering);
      await next(page);
      await pick(page, 0, broker!.plan);
      await next(page);
      // Binding parameters: none.
      await next(page);
      await page.getByRole('radio', { name: 'Bind to an Existing Service Instance' }).check();
      await pick(page, 0, name);
      await next(page, 'Finish');

      await page.waitForURL(url => url.pathname === `/applications/${cfGuid}/${appGuid}/services`, { timeout: 120000 });
      await expect(toast(page, `Service instance "${name}" bound to the application.`)).toBeVisible();
      // A managed bind is a CF job.
      await expect.poll(async () => (await cfApi.getAppBindings(guid)).find(b => b.appGuid === appGuid)?.state,
        { timeout: 120000 }).toBe('succeeded');

      const row = await bindingRow(page, cfGuid, appGuid, name);
      await expect(row).toBeVisible({ timeout: 60000 });
      await row.locator('[data-test=row-actions]').click();
      await page.locator('[data-test=row-actions-menu]').getByText('Unbind', { exact: true }).click();
      const dialog = page.locator('app-dialog-confirm');
      await expect(dialog).toContainText(`Are you sure you want to unbind "${name}" from this application?`);
      await dialog.locator('[data-test="confirm-dialog-confirm"]').click();

      await expect(row).toHaveCount(0, { timeout: 120000 });
      await expect(toast(page, 'Unbind failed')).toHaveCount(0);
      await expect.poll(async () => (await cfApi.getAppBindings(guid)).length, { timeout: 60000 }).toBe(0);
      // Unbinding keeps the instance and the app.
      expect(await cfApi.serviceInstanceExists(guid)).toBe(true);
      expect(await cfApi.appExists(appGuid)).toBe(true);
    } finally {
      await removeInstance(cfApi, spaceGuid, name);
      await applicationHelper.cleanupTestApp(testApp);
    }
  });
});
