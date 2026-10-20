import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { FakeJob, handOffWrite, isolatedAdmin, toast } from '../../helpers/fake-job.helper';
import { TestBroker } from '../../helpers/service-wizard.helper';

/**
 * What the console does with an update or a delete of a service instance
 * that runs long (#6002), and how it reports the outcome. The instance is
 * real, made from the test broker's plan; the write and its job are faked
 * (fake-job.helper), so each outcome arrives when the spec says and the
 * instance itself is not changed. The create path is
 * service-write-wait.spec.ts; the real broker path is
 * async-service-writes.spec.ts. Needs the test broker's offering and plan in
 * the secrets profile (cloudFoundry[0].services.testBroker); skipped without
 * it.
 */

type Instance = { guid: string; name: string };

/** Makes a managed instance of the broker's plan and waits until CF has it. */
async function createInstance(cfApi: CFApiHelper, spaceGuid: string, broker: TestBroker, name: string): Promise<Instance> {
  const planGuid = await cfApi.findServicePlanGuid(broker.offering, spaceGuid, broker.plan);
  expect(planGuid, `plan ${broker.plan} visible in the test space`).toBeTruthy();
  await cfApi.createManagedServiceInstance(spaceGuid, name, planGuid!);
  await expect.poll(async () => (await cfApi.findServiceInstanceByName(spaceGuid, name))?.last_operation?.state,
    { timeout: 120000 }).toBe('succeeded');
  return { guid: (await cfApi.findServiceInstanceByName(spaceGuid, name))!.guid, name };
}

async function removeInstance(cfApi: CFApiHelper, spaceGuid: string, name: string): Promise<void> {
  const si = await cfApi.findServiceInstanceByName(spaceGuid, name).catch(() => null);
  if (!si) {
    return;
  }
  await cfApi.deleteServiceInstance(si.guid);
  await expect.poll(() => cfApi.serviceInstanceExists(si.guid), { timeout: 120000 }).toBe(false);
}

test.describe('services list: a delete that runs long', () => {
  // Making and removing the instance goes through the broker.
  test.setTimeout(300000);

  let broker: TestBroker | undefined;
  test.beforeEach(({ secrets }) => {
    broker = secrets.cloudFoundry[0]?.services?.testBroker;
    test.skip(!broker, 'no services.testBroker in the secrets profile');
  });

  /** Confirms the row menu's Delete for si on the Services list; the DELETE hands off to job. Returns si's row. */
  async function deleteFromList(page: Page, job: FakeJob, cfGuid: string, si: Instance): Promise<Locator> {
    await job.attach(page);
    await handOffWrite(page, `**/pp/v1/cf/service_instances/${cfGuid}/${si.guid}`, 'DELETE', job);
    await page.goto('/services');
    await page.locator('[data-test=name-filter]').fill(si.name);
    const row = page.locator('[data-test=row], [data-test=card]').filter({ hasText: si.name });
    await expect(row).toBeVisible({ timeout: 60000 });
    await row.locator('[data-test=row-actions]').click();
    await page.locator('[data-test=row-actions-menu]').getByText('Delete', { exact: true }).click();
    await page.locator('app-dialog-confirm [data-test="confirm-dialog-confirm"]').click();
    return row;
  }

  test('keeps the row while the job runs, and removes it once the job completes', async ({ browser, connectedEndpointsAdminPage, cfApi }) => {
    const { cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-slow-delete-${Date.now()}`;
    const { context, page } = await isolatedAdmin(browser);
    try {
      const si = await createInstance(cfApi, spaceGuid, broker!, name);
      const job = new FakeJob(`e2e-delete-${Date.now()}`, 'cf.service_instance.delete');
      const row = await deleteFromList(page, job, cfGuid, si);

      // A delete from a list asks nothing while it runs: the row stays
      // until the job ends.
      await expect.poll(() => job.pollsFrom(page)).toBeGreaterThanOrEqual(3);
      await expect(row).toBeVisible();
      job.set({ state: 'COMPLETE' });
      await expect(row).toHaveCount(0, { timeout: 20000 });
      await expect(toast(page, 'Delete failed')).toHaveCount(0);
    } finally {
      await context.close();
      await removeInstance(cfApi, spaceGuid, name);
    }
  });

  test('a job that fails gives the broker\'s reason and keeps the row', async ({ browser, connectedEndpointsAdminPage, cfApi }) => {
    const { cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-slow-delete-${Date.now()}`;
    const { context, page } = await isolatedAdmin(browser);
    try {
      const si = await createInstance(cfApi, spaceGuid, broker!, name);
      const job = new FakeJob(`e2e-delete-${Date.now()}`, 'cf.service_instance.delete');
      const row = await deleteFromList(page, job, cfGuid, si);

      await expect.poll(() => job.pollsFrom(page)).toBeGreaterThan(0);
      job.set({ state: 'FAILED', detail: 'The broker refused the e2e delete.' });
      await expect(toast(page, 'Delete failed: The broker refused the e2e delete.')).toBeVisible({ timeout: 20000 });
      await expect(row).toBeVisible();
    } finally {
      await context.close();
      await removeInstance(cfApi, spaceGuid, name);
    }
  });
});
