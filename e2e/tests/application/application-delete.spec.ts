import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { createCustomName } from '../../helpers/test-utils';
import { DeleteApplicationPage } from '../../pages/application/delete-app.page';

/**
 * Application Delete E2E Tests
 *
 * Deleting an app takes two phases (see DeleteApplicationPage): the /delete
 * wizard collects the routes to delete and the bindings to unbind, then the
 * detail page's "Delete" dialog runs the delete. The tests drive both phases
 * and check the result in Cloud Foundry, not only in the UI.
 */

// CF deletes an app asynchronously (202 + job), so poll for it to go.
const GONE_TIMEOUT = 30000;

async function expectAppDeletedToWall(page: Page, cfApi: CFApiHelper, appGuid: string, appName: string) {
  await page.waitForURL(url => url.pathname === '/applications', { timeout: GONE_TIMEOUT });
  await expect(page.getByText(`Application "${appName}" deleted`)).toBeVisible();
  await expect.poll(() => cfApi.appExists(appGuid), { timeout: GONE_TIMEOUT }).toBe(false);
}

test.describe('Application Delete', () => {

  test.describe('Delete via CF API', () => {
    test('should delete simple app', async ({ applicationHelper, cfApi }) => {
      const testApp = await applicationHelper.createTestApp();
      expect(await cfApi.appExists(testApp.app.guid)).toBe(true);

      await applicationHelper.cleanupTestApp(testApp);

      await expect.poll(() => cfApi.appExists(testApp.app.guid), { timeout: GONE_TIMEOUT }).toBe(false);
    });

    test('should delete app with routes', async ({ applicationHelper, cfApi }) => {
      const testApp = await applicationHelper.createTestApp();
      const routeGuid = await applicationHelper.createAndMapRoute(testApp);
      expect(await cfApi.routeExists(routeGuid)).toBe(true);

      await applicationHelper.cleanupTestApp(testApp);

      await expect.poll(() => cfApi.appExists(testApp.app.guid), { timeout: GONE_TIMEOUT }).toBe(false);
      expect(await cfApi.routeExists(routeGuid)).toBe(false);
    });

    test('should delete multiple apps', async ({ applicationHelper, cfApi }) => {
      const testApps = await applicationHelper.createTestApps(3);
      expect(testApps.length).toBe(3);
      for (const testApp of testApps) {
        expect(await cfApi.appExists(testApp.app.guid)).toBe(true);
      }

      await applicationHelper.cleanupTestApps(testApps);

      for (const testApp of testApps) {
        await expect.poll(() => cfApi.appExists(testApp.app.guid), { timeout: GONE_TIMEOUT }).toBe(false);
      }
    });
  });

  test.describe('Delete wizard', () => {
    test('opens from the summary trash button; an app with no routes or bindings only needs Confirm', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);

      await deletePage.openFromSummary();

      // Only the Confirm step is visible, so the stepper shows no step headers.
      expect(await deletePage.stepTitles()).toEqual([]);
      await expect(deletePage.stepper).toContainText(testApp.app.name);
      await expect(deletePage.nextButton).toHaveText('Confirm');
    });

    test('cancel returns to the app without deleting it', async ({ withTestApp, cfApi }) => {
      const { page, testApp } = withTestApp;
      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();

      await deletePage.cancel();

      await page.waitForURL(url => url.pathname.startsWith(`/applications/${testApp.cfGuid}/${testApp.app.guid}`)
        && !url.pathname.endsWith('/delete'));
      await expect(page.locator('app-page-side-nav')).toBeVisible();
      expect(await cfApi.appExists(testApp.app.guid)).toBe(true);
    });

    test('Confirm opens the Delete dialog; cancelling it keeps the app', async ({ withTestApp, cfApi }) => {
      const { page, testApp } = withTestApp;
      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();

      await deletePage.confirmWizard();
      await expect(deletePage.confirmDialog).toContainText(`Delete: ${testApp.app.name}`);

      await deletePage.cancelDeleteDialog();

      expect(page.url()).not.toContain('/delete');
      expect(await cfApi.appExists(testApp.app.guid)).toBe(true);
    });

    test('confirming the dialog deletes the app and returns to the app wall', async ({ withTestApp, cfApi }) => {
      const { page, testApp } = withTestApp;
      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();

      await deletePage.confirmWizard();
      await deletePage.confirmDeleteDialog();

      await expectAppDeletedToWall(page, cfApi, testApp.app.guid, testApp.app.name);
    });
  });

  test.describe('Routes', () => {
    test('lists the route unselected; deleting the app keeps an unselected route', async ({ withTestApp, cfApi }) => {
      const { page, testApp, helper } = withTestApp;
      const routeGuid = await helper.createAndMapRoute(testApp);
      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();

      expect(await deletePage.stepTitles()).toEqual(['Routes', 'Confirm']);
      await expect(deletePage.routeCheckbox(routeGuid)).not.toBeChecked();

      await deletePage.goToConfirmStep();
      await expect(deletePage.confirmedRoutes()).toHaveCount(0);
      await deletePage.confirmWizard();
      await deletePage.confirmDeleteDialog();

      await expectAppDeletedToWall(page, cfApi, testApp.app.guid, testApp.app.name);
      expect(await cfApi.routeExists(routeGuid)).toBe(true);
    });

    test('deletes a selected route with the app', async ({ withTestApp, cfApi }) => {
      const { page, testApp, helper } = withTestApp;
      const routeGuid = await helper.createAndMapRoute(testApp);
      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();

      await deletePage.routeCheckbox(routeGuid).check();
      await deletePage.goToConfirmStep();
      await expect(deletePage.confirmedRoutes()).toHaveCount(1);
      await deletePage.confirmWizard();
      await deletePage.confirmDeleteDialog();

      await expectAppDeletedToWall(page, cfApi, testApp.app.guid, testApp.app.name);
      expect(await cfApi.routeExists(routeGuid)).toBe(false);
    });

    test('marks a route that another app also uses as shared', async ({ withTestApp, cfApi }) => {
      const { page, testApp, helper } = withTestApp;
      const routeGuid = await helper.createAndMapRoute(testApp);
      const otherApp = await helper.createTestApp();
      try {
        await cfApi.mapRoute(otherApp.app.guid, routeGuid);
        const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
        await deletePage.navigateTo();

        await expect(deletePage.routeRow(routeGuid).locator('[data-test="route-shared-badge"]'))
          .toHaveText('Shared (2 apps)');
      } finally {
        await helper.cleanupTestApp(otherApp);
      }
    });
  });

  test.describe('Service instances', () => {
    test('unbinds a selected service and keeps the service instance', async ({ withTestApp, cfApi }) => {
      const { page, testApp } = withTestApp;
      const serviceName = createCustomName('test-delete-svc');
      const serviceGuid = await cfApi.createUserProvidedService(testApp.spaceGuid, serviceName);
      try {
        const bindingGuid = await cfApi.bindService(testApp.app.guid, serviceGuid);
        expect(bindingGuid).toBeTruthy();
        const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
        await deletePage.navigateTo();

        expect(await deletePage.stepTitles()).toEqual(['Service Instances', 'Confirm']);
        await deletePage.bindingCheckbox(bindingGuid!).check();
        await deletePage.goToConfirmStep();
        await expect(deletePage.confirmedBindings()).toHaveCount(1);
        await expect(deletePage.confirmedBindings()).toContainText(serviceName);
        await deletePage.confirmWizard();
        await deletePage.confirmDeleteDialog();

        await expectAppDeletedToWall(page, cfApi, testApp.app.guid, testApp.app.name);
        expect(await cfApi.serviceBindingExists(bindingGuid!)).toBe(false);
        expect(await cfApi.serviceInstanceExists(serviceGuid)).toBe(true);
      } finally {
        await cfApi.deleteServiceInstance(serviceGuid).catch(() => {});
      }
    });
  });

  test.describe('Errors', () => {
    test('a failed delete is reported and keeps the app; retrying succeeds', async ({ withTestApp, cfApi }) => {
      const { page, testApp } = withTestApp;
      const appUrl = `**/pp/v1/cf/apps/${testApp.cfGuid}/${testApp.app.guid}`;
      await page.route(appUrl, route => route.request().method() === 'DELETE'
        ? route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ errors: [{ code: 10001, title: 'CF-E2EInjected', detail: 'Injected delete failure' }] }),
        })
        : route.fallback());
      const deletePage = new DeleteApplicationPage(page, testApp.cfGuid, testApp.app.guid);
      await deletePage.navigateTo();

      await deletePage.confirmWizard();
      await deletePage.confirmDeleteDialog();

      await expect(page.getByRole('status').filter({ hasText: 'Delete failed' }))
        .toContainText(`Delete failed ${testApp.app.name}`);
      expect(page.url()).not.toMatch(/\/applications\/?$/);
      expect(await cfApi.appExists(testApp.app.guid)).toBe(true);

      await page.unroute(appUrl);
      await deletePage.navigateTo();
      await deletePage.confirmWizard();
      await deletePage.confirmDeleteDialog();

      await expectAppDeletedToWall(page, cfApi, testApp.app.guid, testApp.app.name);
    });
  });
});
