import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { TestBroker, createBrokerInstance, next } from '../../helpers/service-wizard.helper';

/**
 * Editing a managed service instance from the console (#6002), checked
 * against what CF then holds. The instance is made from the test broker's
 * plan and removed afterwards. A user-provided instance's edit is tested in
 * user-provided-service-instance.spec.ts; an update that runs long in
 * service-write-update-delete.spec.ts. Needs the test broker's offering and
 * plan in the secrets profile (cloudFoundry[0].services.testBroker); skipped
 * without it.
 */

async function removeInstance(cfApi: CFApiHelper, spaceGuid: string, name: string): Promise<void> {
  const si = await cfApi.findServiceInstanceByName(spaceGuid, name).catch(() => null);
  if (!si) {
    return;
  }
  await cfApi.deleteServiceInstance(si.guid);
  await expect.poll(() => cfApi.serviceInstanceExists(si.guid), { timeout: 120000 }).toBe(false);
}

test.describe('managed service instance: edit', () => {
  // Making and removing the instance goes through the broker.
  test.setTimeout(300000);

  let broker: TestBroker | undefined;
  test.beforeEach(({ secrets }) => {
    broker = secrets.cloudFoundry[0]?.services?.testBroker;
    test.skip(!broker, 'no services.testBroker in the secrets profile');
  });

  test('renames it and adds a tag from the edit wizard', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-managed-edit-${Date.now()}`;
    const renamed = `${name}-new`;
    try {
      const guid = await createBrokerInstance(cfApi, spaceGuid, broker!, name);

      await page.goto(`/services/service/${cfGuid}/${guid}/edit`);
      await next(page);
      const nameBox = page.getByRole('textbox', { name: /Name/ });
      await expect(nameBox).toHaveValue(name, { timeout: 15000 });
      await nameBox.fill(renamed);
      const tags = page.getByRole('textbox', { name: 'Tags' });
      await tags.fill('e2e-one');
      await tags.press('Enter');
      await expect(page.getByRole('button', { name: 'Remove tag e2e-one' })).toBeVisible();
      await next(page, 'Finish');
      // An update still running at 30 s is handed off and leaves the page
      // too; CF says how it ended.
      await page.waitForURL(url => !url.pathname.endsWith('/edit'), { timeout: 120000 });

      await expect.poll(async () => (await cfApi.findServiceInstanceByName(spaceGuid, renamed))?.last_operation?.state,
        { timeout: 120000 }).toBe('succeeded');
      const si = await cfApi.findServiceInstanceByName(spaceGuid, renamed);
      expect(si!.guid, `CF has ${name} renamed to ${renamed}`).toBe(guid);
      expect(si!.tags).toEqual(['e2e-one']);
    } finally {
      await removeInstance(cfApi, spaceGuid, name);
      await removeInstance(cfApi, spaceGuid, renamed);
    }
  });
});
