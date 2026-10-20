import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { toast } from '../../helpers/fake-job.helper';
import { next, pick } from '../../helpers/service-wizard.helper';

/**
 * Creating, editing and deleting a user-provided service instance from the
 * console (#6002), checked against what CF then holds. A user-provided
 * instance has no broker, so each write is done once CF answers. Every test
 * makes its own instance (and app) and removes it afterwards.
 */

/** Placeholder credentials, not secrets. Tests assert their keys only. */
const CREDENTIALS = { user: 'e2e-user', password: 'e2e-placeholder', uri: 'https://e2e-ups.example.com' };

/** Removes the named instance, and any app bindings it has, if CF has it. */
async function removeUps(cfApi: CFApiHelper, spaceGuid: string, name: string): Promise<void> {
  const si = await cfApi.findServiceInstanceByName(spaceGuid, name).catch(() => null);
  if (!si) {
    return;
  }
  for (const binding of await cfApi.getAppBindings(si.guid)) {
    await cfApi.unbindService(binding.guid);
  }
  await cfApi.deleteServiceInstance(si.guid);
}

async function credentialKeys(cfApi: CFApiHelper, guid: string): Promise<string[]> {
  return Object.keys(await cfApi.getUserProvidedCredentials(guid)).sort();
}

/** Opens the create wizard from the Services list, picks User Provided Service and the test space. */
async function openCreateDetails(page: Page, cfApi: CFApiHelper, secrets: any): Promise<void> {
  const cf = secrets.cloudFoundry[0];
  await page.goto('/services');
  await page.locator('[data-test=list-sub-nav-add]').click();
  await page.getByRole('button', { name: /User Provided Service/ }).click();
  await pick(page, 0, await cfApi.getEndpointName());
  await pick(page, 1, cf.testOrg);
  await pick(page, 2, cf.testSpace);
  await next(page);
  await expect(page.getByRole('textbox', { name: /Name/ })).toBeVisible();
}

/** The instance's row on the Services list, filtered to its name. */
async function listRow(page: Page, name: string): Promise<Locator> {
  await page.goto('/services');
  await page.locator('[data-test=name-filter]').fill(name);
  const row = page.locator('[data-test=row], [data-test=card]').filter({ hasText: name });
  await expect(row).toBeVisible({ timeout: 60000 });
  return row;
}

async function rowAction(page: Page, row: Locator, label: 'Edit' | 'Delete'): Promise<void> {
  await row.locator('[data-test=row-actions]').click();
  await page.locator('[data-test=row-actions-menu]').getByText(label, { exact: true }).click();
}

test.describe('user-provided service instance: create', () => {
  // The wizard's Tags field is never rendered (app-form-field drops it), so
  // tags are not part of this test.
  test('stores the credentials, syslog drain and route service given in the wizard', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-create-${Date.now()}`;
    const routeServiceUrl = 'https://e2e-ups-route.example.com';
    const syslogDrainUrl = 'https://e2e-ups-drain.example.com/logs';
    try {
      await openCreateDetails(page, cfApi, secrets);
      await page.getByRole('textbox', { name: /Name/ }).fill(name);
      await page.getByRole('textbox', { name: /Route Service URL/ }).fill(routeServiceUrl);
      await page.getByRole('textbox', { name: /Syslog Drain URL/ }).fill(syslogDrainUrl);
      await page.getByRole('textbox', { name: 'Credentials (JSON)' }).fill(JSON.stringify(CREDENTIALS));
      await next(page, 'Finish');
      await page.waitForURL(url => !url.pathname.includes('/new'), { timeout: 30000 });

      const si = await cfApi.findServiceInstanceByName(spaceGuid, name);
      expect(si, `CF has ${name}`).toBeTruthy();
      expect(si!.type).toBe('user-provided');
      expect(si!.route_service_url).toBe(routeServiceUrl);
      expect(si!.syslog_drain_url).toBe(syslogDrainUrl);
      expect(await credentialKeys(cfApi, si!.guid)).toEqual(Object.keys(CREDENTIALS).sort());
      await listRow(page, name);
    } finally {
      await removeUps(cfApi, spaceGuid, name);
    }
  });

  // app-form-field does not render a field's own <app-error> text, so the
  // user sees the field's generic message, read out through aria-errormessage.
  test('refuses credentials that are not a JSON object', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-json-${Date.now()}`;
    try {
      await openCreateDetails(page, cfApi, secrets);
      await page.getByRole('textbox', { name: /Name/ }).fill(name);
      const credentials = page.getByRole('textbox', { name: 'Credentials (JSON)' });
      const finish = page.getByRole('button', { name: 'Finish' });
      for (const bad of ['{"user": ', '["e2e"]']) {
        await credentials.fill(bad);
        await expect(credentials).toHaveAccessibleErrorMessage('Invalid value');
        await expect(finish).toBeDisabled();
      }
      await credentials.fill(JSON.stringify(CREDENTIALS));
      await expect(credentials).not.toHaveAttribute('aria-invalid', 'true');
      await expect(finish).toBeEnabled({ timeout: 15000 });
    } finally {
      await removeUps(cfApi, spaceGuid, name);
    }
  });

  test('refuses a name the space already has', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-taken-${Date.now()}`;
    try {
      await cfApi.createUserProvidedService(spaceGuid, name);
      await openCreateDetails(page, cfApi, secrets);
      const nameBox = page.getByRole('textbox', { name: /Name/ });
      const finish = page.getByRole('button', { name: 'Finish' });
      await nameBox.fill(name);
      // The check asks CF once typing pauses.
      await expect(nameBox).toHaveAccessibleErrorMessage('Invalid value', { timeout: 15000 });
      await expect(finish).toBeDisabled();
      await nameBox.fill(`${name}-free`);
      await expect(finish).toBeEnabled({ timeout: 15000 });
    } finally {
      await removeUps(cfApi, spaceGuid, name);
      await removeUps(cfApi, spaceGuid, `${name}-free`);
    }
  });
});

test.describe('user-provided service instance: edit', () => {
  test('renames it from the list; CF keeps its tags and credentials', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-rename-${Date.now()}`;
    const renamed = `${name}-new`;
    try {
      const guid = await cfApi.createUserProvidedService(spaceGuid, name, { credentials: CREDENTIALS, tags: ['e2e-one', 'e2e-two'] });
      await rowAction(page, await listRow(page, name), 'Edit');
      const nameBox = page.getByRole('textbox', { name: /Name/ });
      await expect(nameBox).toHaveValue(name, { timeout: 15000 });
      await nameBox.fill(renamed);
      await next(page, 'Finish');
      await page.waitForURL(url => !url.pathname.endsWith('/edit'), { timeout: 30000 });

      const si = await cfApi.findServiceInstanceByName(spaceGuid, renamed);
      expect(si?.guid, `CF has ${name} renamed to ${renamed}`).toBe(guid);
      // The form sends the tags it loaded, though it does not show them, and
      // leaves out credentials nobody opened.
      expect(si!.tags).toEqual(['e2e-one', 'e2e-two']);
      expect(await credentialKeys(cfApi, guid)).toEqual(Object.keys(CREDENTIALS).sort());
    } finally {
      await removeUps(cfApi, spaceGuid, name);
      await removeUps(cfApi, spaceGuid, renamed);
    }
  });

  test('replaces its credentials', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-creds-${Date.now()}`;
    try {
      const guid = await cfApi.createUserProvidedService(spaceGuid, name, { credentials: CREDENTIALS });
      await rowAction(page, await listRow(page, name), 'Edit');
      await expect(page.getByRole('textbox', { name: /Name/ })).toHaveValue(name, { timeout: 15000 });
      await page.getByRole('button', { name: 'Edit credentials' }).click();
      await page.getByRole('textbox', { name: 'Credentials (JSON)' }).fill(JSON.stringify({ token: 'e2e-placeholder' }));
      await next(page, 'Finish');
      await page.waitForURL(url => !url.pathname.endsWith('/edit'), { timeout: 30000 });

      expect(await credentialKeys(cfApi, guid)).toEqual(['token']);
    } finally {
      await removeUps(cfApi, spaceGuid, name);
    }
  });
});

test.describe('user-provided service instance: delete', () => {
  test('deletes it from its row on the Services list', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-row-delete-${Date.now()}`;
    try {
      const guid = await cfApi.createUserProvidedService(spaceGuid, name);
      const row = await listRow(page, name);
      await rowAction(page, row, 'Delete');
      await page.locator('app-dialog-confirm [data-test="confirm-dialog-confirm"]').click();

      await expect(row).toHaveCount(0, { timeout: 20000 });
      await expect(toast(page, 'Delete failed')).toHaveCount(0);
      expect(await cfApi.serviceInstanceExists(guid)).toBe(false);
    } finally {
      await removeUps(cfApi, spaceGuid, name);
    }
  });

  test('deletes it from its own page, which then returns to the Services list', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-page-delete-${Date.now()}`;
    try {
      const guid = await cfApi.createUserProvidedService(spaceGuid, name);
      await page.goto(`/services/user-service/${cfGuid}/${guid}`);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 30000 });
      // The page's actions render in the shell's top bar; the icon's text is
      // part of the button's name.
      await page.getByRole('button', { name: /^(delete )?Delete$/ }).click();
      await page.locator('app-dialog-confirm [data-test="confirm-dialog-confirm"]').click();

      await page.waitForURL(url => url.pathname === '/services', { timeout: 20000 });
      await expect(toast(page, 'Delete failed')).toHaveCount(0);
      expect(await cfApi.serviceInstanceExists(guid)).toBe(false);
    } finally {
      await removeUps(cfApi, spaceGuid, name);
    }
  });

  // The confirmation warns that bound apps are detached; it does not ask
  // for an unbind first. CF deletes a user-provided instance's bindings
  // with it.
  test('deleting one bound to an app removes the binding and keeps the app', async ({ connectedEndpointsAdminPage, cfApi, applicationHelper }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const name = `e2e-ups-bound-${Date.now()}`;
    const testApp = await applicationHelper.createTestApp(`e2e-ups-bound-app-${Date.now()}`);
    try {
      const guid = await cfApi.createUserProvidedService(spaceGuid, name);
      const bindingGuid = await cfApi.bindService(testApp.app.guid, guid);
      expect(bindingGuid, 'CF binds a user-provided instance at once').toBeTruthy();

      const row = await listRow(page, name);
      await rowAction(page, row, 'Delete');
      const dialog = page.locator('app-dialog-confirm');
      await expect(dialog).toContainText(`Delete the service instance "${name}"? This cannot be undone and will detach any apps bound to it.`);
      await dialog.locator('[data-test="confirm-dialog-confirm"]').click();

      await expect(row).toHaveCount(0, { timeout: 20000 });
      await expect(toast(page, 'Delete failed')).toHaveCount(0);
      expect(await cfApi.serviceInstanceExists(guid)).toBe(false);
      expect(await cfApi.serviceBindingExists(bindingGuid!)).toBe(false);
      expect(await cfApi.appExists(testApp.app.guid)).toBe(true);
    } finally {
      await removeUps(cfApi, spaceGuid, name);
      await applicationHelper.cleanupTestApp(testApp);
    }
  });
});
