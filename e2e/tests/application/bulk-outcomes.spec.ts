import { Locator, Page, Route } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { createCustomName } from '../../helpers/test-utils';
import { FakeJob, isolatedAdmin, toast } from '../../helpers/fake-job.helper';

/**
 * A bulk delete or unmap that partly fails names each failed item and gives
 * its reason (#6002), however it was started: the selection bar, or a row
 * menu's Delete with "Also delete this application's routes and service
 * bindings", which runs the bulk delete for one app. The apps and routes are
 * real; the bulk response (and any job in it) is faked, so nothing is
 * deleted by the action itself.
 */

type BulkItem = { guid: string; state: 'COMPLETE' | 'FAILED' | 'PENDING'; errors?: { code: string; message: string }[]; job?: object };

function bulkResult(results: BulkItem[]): object {
  return {
    results,
    succeeded: results.filter(r => r.state === 'COMPLETE').length,
    failed: results.filter(r => r.state === 'FAILED').length,
    pending: results.filter(r => r.state === 'PENDING').length,
  };
}

/** Answers the next POST to url with results. */
async function fakeBulk(page: Page, url: string, results: BulkItem[]): Promise<void> {
  await page.route(url, (route: Route) => (route.request().method() === 'POST'
    ? route.fulfill({ json: bulkResult(results) })
    : route.fallback()));
}

const failed = (guid: string, reason: string): BulkItem => ({ guid, state: 'FAILED', errors: [{ code: 'CF-UnprocessableEntity', message: reason }] });

/** The list row or card that shows text. */
const item = (page: Page, text: string): Locator => page.locator('[data-test=row], [data-test=card]').filter({ hasText: text });
const checkbox = (it: Locator): Locator => it.locator('[data-test=row-checkbox], [data-test=card-select-checkbox]');

async function showOnly(page: Page, prefix: string): Promise<void> {
  await page.locator('[data-test=name-filter]').fill(prefix);
}

async function confirm(page: Page, alsoCleanUp = false): Promise<void> {
  const dialog = page.locator('app-dialog-confirm');
  if (alsoCleanUp) {
    await dialog.locator('#confirmCheckbox').check();
  }
  await dialog.locator('[data-test="confirm-dialog-confirm"]').click();
}

test.describe('bulk deletes and unmaps that partly fail', () => {
  test.setTimeout(120000);

  test('the selection bar\'s Delete names the app that failed and why, and clears the selection', async ({ browser, applicationHelper }) => {
    const prefix = createCustomName('e2e-bulk');
    const [kept, refused] = [await applicationHelper.createTestApp(`${prefix}-a`), await applicationHelper.createTestApp(`${prefix}-b`)];
    const { context, page } = await isolatedAdmin(browser);
    try {
      await fakeBulk(page, `**/pp/v1/cf/apps/${kept.cfGuid}/bulk/delete`, [
        { guid: kept.app.guid, state: 'COMPLETE' },
        failed(refused.app.guid, 'A binding is in progress.'),
      ]);
      await page.goto(`/cloud-foundry/${kept.cfGuid}/applications`);
      await showOnly(page, prefix);
      await checkbox(item(page, kept.app.name)).click();
      await checkbox(item(page, refused.app.name)).click();
      await page.locator('[data-test="bulk-action-Delete"]').click();
      await confirm(page);

      await expect(toast(page, `1 application deleted; 1 failed: "${refused.app.name}" (A binding is in progress)`)).toBeVisible({ timeout: 20000 });
      await expect(page.locator('[data-test=bulk-action-bar]')).toBeHidden();
    } finally {
      await context.close();
      await applicationHelper.cleanupTestApps([kept, refused]);
    }
  });

  test('an item whose job fails after the response is named with CF\'s reason', async ({ browser, applicationHelper }) => {
    const testApp = await applicationHelper.createTestApp(createCustomName('e2e-bulk'));
    const { context, page } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-bulk-${Date.now()}`, 'cf.app.delete');
      job.set({ state: 'FAILED', detail: 'The e2e broker is still unbinding.' });
      await job.attach(page);
      await fakeBulk(page, `**/pp/v1/cf/apps/${testApp.cfGuid}/bulk/delete`, [
        { guid: testApp.app.guid, state: 'PENDING', job: { id: job.id, kind: job.kind, state: 'PROCESSING', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      ]);
      await page.goto(`/cloud-foundry/${testApp.cfGuid}/applications`);
      await showOnly(page, testApp.app.name);
      await checkbox(item(page, testApp.app.name)).click();
      await page.locator('[data-test="bulk-action-Delete"]').click();
      await confirm(page);

      await expect(toast(page, `0 applications deleted; 1 failed: "${testApp.app.name}" (The e2e broker is still unbinding)`)).toBeVisible({ timeout: 20000 });
    } finally {
      await context.close();
      await applicationHelper.cleanupTestApp(testApp);
    }
  });

  for (const tab of ['Cloud Foundry', 'space'] as const) {
    test(`a row menu Delete with cleanup on the ${tab} Applications tab reports a failure and keeps the selection`, async ({ browser, applicationHelper }) => {
      const prefix = createCustomName('e2e-row');
      const [target, selected] = [await applicationHelper.createTestApp(`${prefix}-a`), await applicationHelper.createTestApp(`${prefix}-b`)];
      const { context, page } = await isolatedAdmin(browser);
      try {
        await fakeBulk(page, `**/pp/v1/cf/apps/${target.cfGuid}/bulk/delete`, [failed(target.app.guid, 'A binding is in progress.')]);
        await page.goto(tab === 'space'
          ? `/cloud-foundry/${target.cfGuid}/organizations/${target.orgGuid}/spaces/${target.spaceGuid}/apps`
          : `/cloud-foundry/${target.cfGuid}/applications`);
        await showOnly(page, prefix);
        await checkbox(item(page, selected.app.name)).click();
        await expect(page.locator('[data-test=bulk-selected-count]')).toHaveText(/1 selected/);

        await item(page, target.app.name).locator('[data-test=row-actions]').click();
        await page.locator('[data-test=row-actions-menu]').getByText('Delete', { exact: true }).click();
        await confirm(page, true);

        await expect(toast(page, `0 applications deleted; 1 failed: "${target.app.name}" (A binding is in progress)`)).toBeVisible({ timeout: 20000 });
        await expect(page.locator('[data-test=bulk-selected-count]')).toHaveText(/1 selected/);
      } finally {
        await context.close();
        await applicationHelper.cleanupTestApps([target, selected]);
      }
    });
  }

  for (const action of ['Unmap', 'Delete'] as const) {
    test(`the routes tab's ${action} names the route that failed and why`, async ({ browser, applicationHelper }) => {
      const testApp = await applicationHelper.createTestApp(createCustomName('e2e-route'));
      const host = createCustomName('e2e-route');
      const routeGuid = await applicationHelper.createAndMapRoute(testApp, host);
      const { context, page } = await isolatedAdmin(browser);
      try {
        await fakeBulk(page, `**/pp/v1/cf/routes/${testApp.cfGuid}/bulk/${action.toLowerCase()}`, [failed(routeGuid, 'The route is in use by e2e.')]);
        await page.goto(`/cloud-foundry/${testApp.cfGuid}/routes`);
        await showOnly(page, host);
        await checkbox(item(page, host)).click();
        await page.locator(`[data-test="bulk-action-${action}"]`).click();
        await confirm(page);

        const done = action === 'Unmap' ? 'unmapped' : 'deleted';
        await expect(toast(page, new RegExp(`^0 routes ${done}; 1 failed: "[^"]*${host}[^"]*" \\(The route is in use by e2e\\)$`))).toBeVisible({ timeout: 20000 });
      } finally {
        await context.close();
        await applicationHelper.cleanupTestApp(testApp);
      }
    });
  }
});
