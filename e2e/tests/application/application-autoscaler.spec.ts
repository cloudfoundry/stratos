import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';

/**
 * The App Autoscaler pages against a real autoscaler (14.x or 15.x): the
 * Autoscale tab, the policy editor, the scaling history and metric pages.
 *
 * Needs the autoscaler service offering in the test space (its broker
 * registered and service access enabled); skipped without it. Each test
 * makes its own app and cleans it up.
 */

const OFFERING = 'autoscaler';

// Writes go through CF jobs and the autoscaler; the lifecycle test does a
// create, an edit and a detach.
test.setTimeout(300000);

async function openTab(page: Page, cfGuid: string, appGuid: string): Promise<void> {
  await page.goto(`/applications/${cfGuid}/${appGuid}/autoscale`);
}

async function editorSteps(page: Page): Promise<void> {
  // From recurring schedules (step 3) past specific dates: none, then save.
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
}

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

test.describe('Application Autoscaler', () => {
  test('explains why an app that is not bound cannot autoscale', async ({ connectedEndpointsAdminPage, cfApi, applicationHelper }) => {
    const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    test.skip(!(await cfApi.findServicePlanGuid(OFFERING, spaceGuid)), 'no autoscaler offering in the test space');
    const testApp = await applicationHelper.createTestApp('e2e-autoscaler-unbound');
    try {
      await openTab(page, cfGuid, testApp.app.guid);
      // The autoscaler's own reason, not a generic HTTP error or "no policy".
      await expect(page.getByText(/not bound/i)).toBeVisible({ timeout: 60000 });
      await expect(page.getByRole('button', { name: /Create Policy/ })).toHaveCount(0);
    } finally {
      await applicationHelper.cleanupTestApp(testApp);
    }
  });

  test('creates, edits and detaches a policy', async ({ connectedEndpointsAdminPage, cfApi, applicationHelper }) => {
    const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const planGuid = await cfApi.findServicePlanGuid(OFFERING, spaceGuid);
    test.skip(!planGuid, 'no autoscaler offering in the test space');

    const testApp = await applicationHelper.createTestApp('e2e-autoscaler-policy');
    const appGuid = testApp.app.guid;
    const appName = testApp.app.name;
    const instanceName = `e2e-autoscaler-${Date.now()}`;
    try {
      await cfApi.createManagedServiceInstance(spaceGuid, instanceName, planGuid!);
      await expect.poll(async () => (await cfApi.findServiceInstanceByName(spaceGuid, instanceName))?.last_operation?.state,
        { timeout: 120000 }).toBe('succeeded');
      const si = await cfApi.findServiceInstanceByName(spaceGuid, instanceName);
      await cfApi.bindService(appGuid, si!.guid);
      // A managed bind is a CF job: the autoscaler knows the app only once it succeeds.
      await expect.poll(async () => (await cfApi.getAppBindings(si!.guid)).find(b => b.appGuid === appGuid)?.state,
        { timeout: 120000 }).toBe('succeeded');

      // Bound, no policy yet.
      await openTab(page, cfGuid, appGuid);
      await expect(page.getByText('This application has no Autoscaler Policy')).toBeVisible({ timeout: 60000 });

      // Create through the editor with the default limits and rule.
      await page.getByRole('button', { name: /Create Policy/ }).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(`Create AutoScaler Policy: ${appName}`, { timeout: 60000 });
      const next = page.getByRole('button', { name: 'Next', exact: true });
      await expect(next).toBeEnabled();
      await next.click();
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('button', { name: 'done', exact: true }).click();
      await expect(page.getByText(/If average memoryused/)).toBeVisible();
      await next.click();
      await editorSteps(page);
      await page.waitForURL(url => url.pathname.endsWith('/autoscale'));
      await expect.poll(async () => (await cfApi.getAutoscalerPolicy(appGuid))?.scaling_rules?.[0]?.metric_type,
        { timeout: 60000 }).toBe('memoryused');
      await expect(page.getByRole('button', { name: /Edit Policy/ })).toBeVisible({ timeout: 60000 });

      // Edit the maximum instance count.
      await page.getByRole('button', { name: /Edit Policy/ }).click();
      const max = page.getByRole('spinbutton', { name: 'Maximum Instance Count' });
      await expect(max).toHaveValue('10', { timeout: 60000 });
      await max.fill('5');
      await next.click();
      await next.click();
      await editorSteps(page);
      await page.waitForURL(url => url.pathname.endsWith('/autoscale'));
      await expect.poll(async () => (await cfApi.getAutoscalerPolicy(appGuid))?.instance_max_count, { timeout: 60000 }).toBe(5);

      // The scaling history and metric pages name the app and load.
      await page.goto(`/autoscaler/${cfGuid}/${appGuid}/app-autoscaler-scale-history-page`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(`AutoScaler Scaling Events: ${appName}`, { timeout: 60000 });
      await expect(page.getByText('There are no scaling events')).toBeVisible({ timeout: 60000 });
      await page.goto(`/autoscaler/${cfGuid}/${appGuid}/app-autoscaler-metric-page`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(`AutoScaler Metric Charts: ${appName}`, { timeout: 60000 });
      await expect(page.getByRole('heading', { level: 3, name: /memoryused/ })).toBeVisible({ timeout: 60000 });

      // Detach: with no default policy on the instance, none is left.
      await openTab(page, cfGuid, appGuid);
      await page.getByRole('button', { name: /Delete Policy/ }).click();
      await page.locator('[data-test="confirm-dialog-confirm"]').click();
      await expect(page.getByText('This application has no Autoscaler Policy')).toBeVisible({ timeout: 60000 });
      expect(await cfApi.getAutoscalerPolicy(appGuid)).toBeNull();
    } finally {
      await removeInstance(cfApi, spaceGuid, instanceName);
      await applicationHelper.cleanupTestApp(testApp);
    }
  });
});
