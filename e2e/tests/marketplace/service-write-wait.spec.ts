import { Browser, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { FakeJob, handOffWrite, isolatedAdmin, toast } from '../../helpers/fake-job.helper';
import { TestBroker, next, openCreateDetails } from '../../helpers/service-wizard.helper';

/**
 * What the service instance wizard does with a write that outlasts its wait
 * (#6002): it asks at 30 s whether to keep waiting, hands the write off when
 * told to or when nobody answers, and reports the outcome wherever the user
 * is. The write and its job are faked (fake-job.helper), so each outcome
 * arrives when the spec says; the real broker path is
 * async-service-writes.spec.ts. Needs the test broker's offering and plan in
 * the secrets profile (cloudFoundry[0].services.testBroker) to walk the
 * wizard; skipped without it.
 */

test.describe('service instance wizard: a write that outlasts the wait', () => {
  // The question comes at 30 s and an unanswered one hands off 30 s later.
  test.setTimeout(150000);

  let broker: TestBroker | undefined;
  test.beforeEach(({ secrets }) => {
    broker = secrets.cloudFoundry[0]?.services?.testBroker;
    test.skip(!broker, 'no services.testBroker in the secrets profile');
  });

  /** Walks the wizard in its own context and submits a create the spec controls through job. */
  async function submitCreate(browser: Browser, cfGuid: string, cfApi: CFApiHelper, secrets: any, before?: (page: Page, job: FakeJob) => Promise<void>) {
    const { context, page } = await isolatedAdmin(browser);
    const job = new FakeJob(`e2e-wait-${Date.now()}`);
    await job.attach(page);
    await handOffWrite(page, `**/pp/v1/cf/service_instances/${cfGuid}`, 'POST', job);
    await openCreateDetails(page, cfGuid, cfApi, secrets, broker!);
    const name = `e2e-wait-${Date.now()}`;
    await page.getByRole('textbox', { name: /Name/ }).pressSequentially(name);
    await before?.(page, job);
    await next(page, 'Finish');
    return { context, page, job, name, question: page.getByRole('alertdialog') };
  }

  test('asks at 30 s how long the write has run, and takes focus', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, name, question } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);
    try {
      await expect(question).toBeHidden();
      await expect(question).toContainText(`Creating service instance "${name}" is still running after 30 s.`, { timeout: 40000 });
      // An alert dialog takes focus, so a screen reader reads it out.
      await expect(page.getByLabel('Wait another')).toBeFocused();
    } finally {
      await context.close();
    }
  });

  test('Keep waiting asks again once the chosen time is up, with the time so far', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, name, question } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);
    try {
      await expect(question).toBeVisible({ timeout: 40000 });
      await page.getByLabel('Wait another').fill('30');
      await page.getByRole('button', { name: 'Keep waiting' }).click();
      await expect(question).toBeHidden();
      await expect(question).toContainText(`Creating service instance "${name}" is still running after 1 min.`, { timeout: 40000 });
    } finally {
      await context.close();
    }
  });

  test('takes 30 to 600 whole seconds and refuses anything else', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, question } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);
    try {
      await expect(question).toBeVisible({ timeout: 40000 });
      const seconds = page.getByLabel('Wait another');
      const keepWaiting = page.getByRole('button', { name: 'Keep waiting' });
      const rangeError = page.getByText('Enter 30 to 600 whole seconds.');
      for (const bad of ['20', '601', '30.5']) {
        await seconds.fill(bad);
        await expect(rangeError).toBeVisible();
        await expect(keepWaiting).toBeDisabled();
      }
      await seconds.fill('45');
      await expect(rangeError).toBeHidden();
      await expect(keepWaiting).toBeEnabled();
    } finally {
      await context.close();
    }
  });

  test('hands off when nobody answers, names where to watch, then reports success', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, job, name, question } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);
    try {
      await expect(question).toContainText('Continuing in the background in', { timeout: 40000 });
      await page.waitForURL(url => !url.pathname.endsWith('/create'), { timeout: 40000 });
      const carriesOn = toast(page, `Creating service instance "${name}" carries on in the background. The Services list shows its progress`);
      await expect(carriesOn).toBeVisible();

      job.set({ state: 'COMPLETE' });
      const created = `Service instance "${name}" created.`;
      await expect(toast(page, created)).toBeVisible({ timeout: 20000 });
      // The hand-off notice does not outlive the outcome.
      await expect(carriesOn).toBeHidden();
      // The outcome reaches a screen reader through the announcer's live region.
      await expect(page.locator('.cdk-live-announcer-element')).toHaveText(created);
    } finally {
      await context.close();
    }
  });

  test('Continue in background hands off at once; a later failure gives the broker\'s reason', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, job, name, question } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);
    try {
      await expect(question).toBeVisible({ timeout: 40000 });
      await page.getByRole('button', { name: 'Continue in background' }).click();
      await page.waitForURL(url => !url.pathname.endsWith('/create'), { timeout: 10000 });
      const carriesOn = toast(page, `Creating service instance "${name}" carries on in the background.`);
      await expect(carriesOn).toBeVisible();

      job.set({ state: 'FAILED', detail: 'The broker refused the e2e plan.' });
      await expect(toast(page, `Failed to create service instance "${name}": The broker refused the e2e plan.`)).toBeVisible({ timeout: 20000 });
      await expect(carriesOn).toBeHidden();
    } finally {
      await context.close();
    }
  });

  test('leaving the wizard hands off once and reports the outcome on the next page', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, job, name } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets);
    try {
      await expect.poll(() => job.pollsFrom(page)).toBeGreaterThan(0);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await page.waitForURL(url => !url.pathname.endsWith('/create'));
      const carriesOn = toast(page, `Creating service instance "${name}" carries on in the background.`);
      await expect(carriesOn).toHaveCount(1);

      job.set({ state: 'COMPLETE' });
      await expect(toast(page, `Service instance "${name}" created.`)).toBeVisible({ timeout: 20000 });
      await expect(carriesOn).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('brings the question into view below a tall form', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, question } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets,
      async page => page.setViewportSize({ width: 1280, height: 480 }));
    try {
      await expect(question).toBeInViewport({ timeout: 40000 });
    } finally {
      await context.close();
    }
  });

  test('keeps checking through network errors and reports the real outcome', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, job, name } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets,
      async (_page, j) => j.set({ abort: true }));
    try {
      await expect.poll(() => job.pollsFrom(page)).toBeGreaterThanOrEqual(3);
      job.set({ state: 'COMPLETE' });
      await expect(toast(page, `Service instance "${name}" created.`)).toBeVisible({ timeout: 15000 });
      await expect(toast(page, 'could not be determined')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('a job the backend no longer knows is reported as unknown, not created', async ({ browser, connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { context, page, name } = await submitCreate(browser, connectedEndpointsAdminPage.cfGuid, cfApi, secrets,
      async (_page, j) => j.set({ status: 404 }));
    try {
      await expect(toast(page, `Create service instance "${name}": the operation ended, but its result could not be determined. `
        + 'The Services list shows the current state.')).toBeVisible({ timeout: 15000 });
      await expect(toast(page, 'created.')).toHaveCount(0);
      await expect(page).toHaveURL(/\/create$/);
    } finally {
      await context.close();
    }
  });

  test('shows the Tags field: a tag can be added and removed', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    await openCreateDetails(page, cfGuid, cfApi, secrets, broker!);
    const tags = page.getByLabel('Tags');
    await expect(tags).toBeVisible();
    await tags.pressSequentially('e2e-tag');
    await tags.press('Enter');
    const remove = page.getByRole('button', { name: 'Remove tag e2e-tag' });
    await expect(remove).toBeVisible();
    await remove.click();
    await expect(remove).toBeHidden();
  });
});
