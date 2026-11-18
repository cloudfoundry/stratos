import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { FakeJob, handOffWrite, isolatedAdmin, toast } from '../../helpers/fake-job.helper';
import { TestBroker, next, openCreateDetails } from '../../helpers/service-wizard.helper';

/**
 * A service instance create the wizard handed off is still reported after a
 * reload or a new sign-in, and by one tab only (#6002). The write and its job
 * are faked (fake-job.helper) so the spec decides when it ends; each test
 * runs in its own browser context, since the record lives in browser storage
 * and some tests sign out. Needs the test broker's offering and plan in the
 * secrets profile (cloudFoundry[0].services.testBroker); skipped without it.
 */

test.describe('service instance wizard: a handed-off create after a reload or sign-in', () => {
  test.setTimeout(150000);

  let broker: TestBroker | undefined;
  test.beforeEach(({ secrets }) => {
    broker = secrets.cloudFoundry[0]?.services?.testBroker;
    test.skip(!broker, 'no services.testBroker in the secrets profile');
  });

  /** Submits a create that job controls, and returns once the page has polled it (the record is then kept). */
  async function submitCreate(page: Page, job: FakeJob, cfGuid: string, cfApi: CFApiHelper, secrets: any): Promise<string> {
    await handOffWrite(page, `**/pp/v1/cf/service_instances/${cfGuid}`, 'POST', job);
    await openCreateDetails(page, cfGuid, cfApi, secrets, broker!);
    const name = `e2e-resume-${Date.now()}`;
    await page.getByRole('textbox', { name: /Name/ }).pressSequentially(name);
    await next(page, 'Finish');
    await expect.poll(() => job.pollsFrom(page)).toBeGreaterThan(0);
    return name;
  }

  const stillRunning = (name: string) => new RegExp(`Creating service instance "${name}" is still running \\(\\d+ (s|min) so far\\)`);

  test('after a reload: says it is still running, then how it ended', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-resume-${Date.now()}`);
      await job.attach(page);
      const name = await submitCreate(page, job, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);

      await page.reload();
      const running = toast(page, stillRunning(name));
      await expect(running).toBeVisible({ timeout: 20000 });
      job.set({ state: 'COMPLETE' });
      await expect(toast(page, `Service instance "${name}" created.`)).toBeVisible({ timeout: 20000 });
      // The still-running notice does not outlive the outcome.
      await expect(running).toBeHidden();
    } finally {
      await context.close();
    }
  });

  test('after signing out in the same tab and back in: resumes and reports it', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, logIn } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-resume-${Date.now()}`);
      await job.attach(page);
      const name = await submitCreate(page, job, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);

      // Signing out reloads the page onto the login screen.
      await page.getByText('Sign Out', { exact: true }).click();
      await page.waitForURL(/\/login/);
      await logIn();
      await page.goto('/');
      await expect(toast(page, stillRunning(name))).toBeVisible({ timeout: 20000 });
      job.set({ state: 'COMPLETE' });
      await expect(toast(page, `Service instance "${name}" created.`)).toBeVisible({ timeout: 20000 });
    } finally {
      await context.close();
    }
  });

  test('when another tab signs out: says the status will show after sign-in, then reports it', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, logIn } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-resume-${Date.now()}`);
      await job.attach(page);
      const name = await submitCreate(page, job, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);

      const other = await context.newPage();
      await other.goto('/');
      await other.getByText('Sign Out', { exact: true }).click();
      await other.waitForURL(/\/login/);
      // The session is gone: the backend itself answers the next poll, 401.
      job.set({ real: true });
      await expect(toast(page, `Signed out while Creating service instance "${name}" was running`)).toBeVisible({ timeout: 20000 });
      await expect(toast(page, 'could not be determined')).toHaveCount(0);

      await logIn();
      job.set({ state: 'COMPLETE' });
      await page.reload();
      await expect(toast(page, `Service instance "${name}" created.`)).toBeVisible({ timeout: 20000 });
    } finally {
      await context.close();
    }
  });

  test('with two tabs open, one reports it; the other takes over if that one closes first', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page: first } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-resume-${Date.now()}`);
      await job.attach(context);
      const name = await submitCreate(first, job, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);

      const second = await context.newPage();
      await second.goto('/');
      // Long enough for the second tab to have resumed the write if it were going to.
      const polled = job.pollsFrom(first);
      await expect.poll(() => job.pollsFrom(first), { timeout: 20000 }).toBeGreaterThan(polled + 1);
      expect(job.pollsFrom(second), 'polls from the second tab while the first follows the write').toBe(0);
      await expect(toast(second, stillRunning(name))).toHaveCount(0);

      await first.close();
      await expect(toast(second, stillRunning(name))).toBeVisible({ timeout: 20000 });
      job.set({ state: 'COMPLETE' });
      await expect(toast(second, `Service instance "${name}" created.`)).toHaveCount(1, { timeout: 20000 });
    } finally {
      await context.close();
    }
  });

  test('with two tabs open, the other says nothing about a write the first saw end', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page: first } = await isolatedAdmin(browser);
    try {
      const job = new FakeJob(`e2e-resume-${Date.now()}`);
      await job.attach(context);
      const name = await submitCreate(first, job, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);

      const second = await context.newPage();
      await second.goto('/');
      job.set({ state: 'COMPLETE' });
      await expect(toast(first, `Service instance "${name}" created.`)).toBeVisible({ timeout: 20000 });
      // The second tab gets the write's lock once the first lets go, finds
      // the record gone and says nothing. Absence needs time to show.
      await second.waitForTimeout(5000);
      expect(job.pollsFrom(second), 'polls from the second tab').toBe(0);
      await expect(toast(second, name)).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
