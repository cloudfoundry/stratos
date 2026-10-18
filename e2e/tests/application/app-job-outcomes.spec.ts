import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { createCustomName } from '../../helpers/test-utils';
import { FakeJob, handOffWrite, isolatedAdmin, toast } from '../../helpers/fake-job.helper';
import { DeleteApplicationPage } from '../../pages/application/delete-app.page';

/**
 * How the application page reports an action CF ran as a job (#6002): a
 * failure gives CF's reason, not its error name; a result nobody can
 * determine is reported as unknown, not as done. The app is real; the write
 * and its job are faked (fake-job.helper), so the app itself is never
 * restaged or deleted by these tests.
 */

test.describe('application page: an action CF runs as a job', () => {
  test.setTimeout(120000);

  const progress = (page: Page) => page.getByRole('status').filter({ hasText: /Restag|Delete/ });

  // A new test app has no package, so Start is off; Restage runs the same
  // lifecycle path.
  async function restage(page: Page): Promise<void> {
    await page.locator('button[name=restage]').click();
    await page.locator('app-dialog-confirm [data-test="confirm-dialog-confirm"]').click();
  }

  test('a delete that fails in CF gives CF\'s reason', async ({ browser, applicationHelper }) => {
    const testApp = await applicationHelper.createTestApp(createCustomName('e2e-job-del'));
    const { context, page } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-job-${Date.now()}`, 'cf.app.delete');
      job.set({ state: 'FAILED', detail: 'The app has an e2e operation in progress.' });
      await job.attach(page);
      await handOffWrite(page, `**/pp/v1/cf/apps/${testApp.cfGuid}/${testApp.app.guid}`, 'DELETE', job);

      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();
      await deletePage.confirmWizard();
      await deletePage.confirmDeleteDialog();

      await expect(progress(page)).toContainText(`Delete failed ${testApp.app.name}`, { timeout: 20000 });
      await expect(progress(page)).toContainText('The app has an e2e operation in progress.');
      await expect(progress(page)).not.toContainText('CF-UnableToPerform');
      expect(page.url()).not.toMatch(/\/applications\/?$/);
    } finally {
      await context.close();
      await applicationHelper.cleanupTestApp(testApp);
    }
  });

  test('a delete whose job the backend no longer knows is reported as unknown, and the app stays', async ({ browser, applicationHelper }) => {
    const testApp = await applicationHelper.createTestApp(createCustomName('e2e-job-del'));
    const { context, page } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-job-${Date.now()}`, 'cf.app.delete');
      job.set({ status: 404 });
      await job.attach(page);
      await handOffWrite(page, `**/pp/v1/cf/apps/${testApp.cfGuid}/${testApp.app.guid}`, 'DELETE', job);

      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();
      await deletePage.confirmWizard();
      await deletePage.confirmDeleteDialog();

      await expect(progress(page)).toContainText(`Delete result unknown ${testApp.app.name}`, { timeout: 20000 });
      await expect(progress(page)).toContainText('could not be determined');
      await expect(toast(page, `Application "${testApp.app.name}" deleted`)).toHaveCount(0);
      expect(page.url()).not.toMatch(/\/applications\/?$/);
    } finally {
      await context.close();
      await applicationHelper.cleanupTestApp(testApp);
    }
  });

  test('a restage that fails in CF gives CF\'s reason', async ({ browser, applicationHelper }) => {
    const testApp = await applicationHelper.createTestApp(createCustomName('e2e-job-restage'));
    const { context, page } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-job-${Date.now()}`, 'cf.app.restage');
      job.set({ state: 'FAILED', detail: 'The app could not be staged for e2e.' });
      await job.attach(page);
      await handOffWrite(page, `**/pp/v1/cf/apps/${testApp.cfGuid}/${testApp.app.guid}/actions/restage`, 'POST', job);

      await page.goto(`/applications/${testApp.cfGuid}/${testApp.app.guid}/summary`);
      await restage(page);

      await expect(progress(page)).toContainText(`Restage failed ${testApp.app.name}`, { timeout: 20000 });
      await expect(progress(page)).toContainText('The app could not be staged for e2e.');
      await expect(progress(page)).not.toContainText('CF-UnableToPerform');
    } finally {
      await context.close();
      await applicationHelper.cleanupTestApp(testApp);
    }
  });

  test('a restage whose result nobody can determine is not reported as done', async ({ browser, applicationHelper }) => {
    const testApp = await applicationHelper.createTestApp(createCustomName('e2e-job-restage'));
    const { context, page } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-job-${Date.now()}`, 'cf.app.restage');
      job.set({ status: 404 });
      await job.attach(page);
      await handOffWrite(page, `**/pp/v1/cf/apps/${testApp.cfGuid}/${testApp.app.guid}/actions/restage`, 'POST', job);

      await page.goto(`/applications/${testApp.cfGuid}/${testApp.app.guid}/summary`);
      await restage(page);

      await expect(progress(page)).toContainText(`Restage result unknown ${testApp.app.name}`, { timeout: 20000 });
      await expect(progress(page)).not.toContainText(`Restaged ${testApp.app.name}`);
    } finally {
      await context.close();
      await applicationHelper.cleanupTestApp(testApp);
    }
  });

  test('a restage still running when the page reloads is not reported afterwards', async ({ browser, applicationHelper }) => {
    const testApp = await applicationHelper.createTestApp(createCustomName('e2e-job-restage'));
    const { context, page } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-job-${Date.now()}`, 'cf.app.restage');
      await job.attach(page);
      await handOffWrite(page, `**/pp/v1/cf/apps/${testApp.cfGuid}/${testApp.app.guid}/actions/restage`, 'POST', job);

      await page.goto(`/applications/${testApp.cfGuid}/${testApp.app.guid}/summary`);
      await restage(page);
      await expect.poll(() => job.pollsFrom(page)).toBeGreaterThan(0);

      // Only the service instance wizard's create and update are kept across
      // a reload; an app action is not followed or reported afterwards.
      await page.reload();
      const polled = job.pollsFrom(page);
      await page.waitForTimeout(5000);
      expect(job.pollsFrom(page), 'polls after the reload').toBe(polled);
      await expect(toast(page, 'still running')).toHaveCount(0);
    } finally {
      await context.close();
      await applicationHelper.cleanupTestApp(testApp);
    }
  });
});
