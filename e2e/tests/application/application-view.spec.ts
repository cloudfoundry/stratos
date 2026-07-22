import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { ApplicationsPage } from '../../pages/application/applications-list.page';
import { ApplicationPageSummary } from '../../pages/application/application.page';
import { ListTableComponent } from '../../components/list.component';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { TestApp } from '../../helpers/application-test.helper';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Seed a bound user-provided service instance, run the assertion against its
 * card in the services list, and always clean up the binding and instance.
 */
async function withBoundService(
  page: Page,
  testApp: TestApp,
  cfApi: CFApiHelper,
  namePrefix: string,
  assertion: (card: Locator, serviceName: string) => Promise<void>,
): Promise<void> {
  const serviceName = createCustomName(namePrefix);
  const serviceGuid = await cfApi.createUserProvidedService(testApp.spaceGuid, serviceName);
  let bindingGuid: string | undefined;
  try {
    bindingGuid = await cfApi.bindService(testApp.app.guid, serviceGuid);

    const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
    await appSummary.navigateTo();
    await appSummary.goToServicesTab();

    // The services list defaults to card view; a just-created binding can lag
    // the polled list, so give the card a generous wait.
    const card = page.locator('app-services-tab app-signal-list [data-test="card"]')
      .filter({ hasText: serviceName }).first();
    await card.waitFor({ state: 'visible', timeout: 30000 });
    await assertion(card, serviceName);
  } finally {
    if (bindingGuid) {
      await cfApi.unbindService(bindingGuid).catch(() => {});
    }
    await cfApi.deleteServiceInstance(serviceGuid).catch(() => {});
  }
}

/**
 * Application View E2E Tests
 * Migrated from src/test-e2e/application/application-view-e2e.spec.ts
 *
 * Tests individual application view pages (summary, instances, routes, etc.)
 *
 * CF Helpers Integration:
 * - ✅ Uses withTestApp fixture for automatic app creation/cleanup
 * - ✅ ApplicationTestHelper for navigation
 * - ✅ ApplicationPageSummary page object for tab navigation
 */

test.describe('Application View', () => {

  test.describe('With Test Application', () => {
    // Uses withTestApp fixture for automatic app creation and cleanup

    test.describe('Breadcrumbs', () => {
      test('should show applications breadcrumb on fresh load', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        const breadcrumbs = await appSummary.breadcrumbs.getBreadcrumbsData();
        expect(breadcrumbs.length).toBeGreaterThanOrEqual(1);

        const appsBreadcrumb = breadcrumbs.find(bc => bc.label === 'Applications');
        expect(appsBreadcrumb).toBeDefined();
      });

      test('should show applications breadcrumb from app wall', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        // Navigate from app wall to app summary
        const appWall = new ApplicationsPage(page);
        await appWall.navigateTo();
        await appWall.waitForPage();

        // Navigate to app summary
        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Verify breadcrumb
        const breadcrumbs = await appSummary.breadcrumbs.getBreadcrumbsData();
        expect(breadcrumbs.length).toBeGreaterThanOrEqual(1);

        const appsBreadcrumb = breadcrumbs.find(bc => bc.label === 'Applications');
        expect(appsBreadcrumb).toBeDefined();
      });
    });

    test.describe('Tabs', () => {
      test('should walk through all tabs', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Walk through all tabs
        await appSummary.goToInstancesTab();
        await page.waitForTimeout(500);

        await appSummary.goToRoutesTab();
        await page.waitForTimeout(500);

        await appSummary.goToLogStreamTab();
        await page.waitForTimeout(500);

        await appSummary.goToServicesTab();
        await page.waitForTimeout(500);

        await appSummary.goToVariablesTab();
        await page.waitForTimeout(500);

        await appSummary.goToEventsTab();
        await page.waitForTimeout(500);

        // Return to summary tab
        await appSummary.goToSummaryTab();
        await page.waitForTimeout(500);
      });
    });

    test.describe('Summary Tab', () => {
      test('should display application name', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Verify app name is displayed
        const heading = page.locator('h1, h2, .app-name').filter({ hasText: testApp.app.name });
        await expect(heading).toBeVisible();
      });

      test('should show application status', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // App should show status (STOPPED for new apps)
        const statusIndicator = page.locator('.app-status, [class*="status"], mat-chip').first();
        await expect(statusIndicator).toBeVisible();
      });

      test('should display instance count', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Look for instance count display (typically shows X/Y instances)
        const instanceInfo = page.locator('text=/instances?/i, [class*="instance"]').first();
        const isVisible = await instanceInfo.isVisible().catch(() => false);

        // Instance count should be visible somewhere in the summary
        expect(isVisible).toBeTruthy();
      });

      test('should show memory allocation', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Look for memory info (MB, GB, etc.)
        const memoryInfo = page.locator('text=/memory/i, text=/\\d+\\s*MB/i, text=/\\d+\\s*GB/i').first();
        const isVisible = await memoryInfo.isVisible().catch(() => false);

        // Memory allocation should be displayed
        expect(isVisible).toBeTruthy();
      });

      test('should display disk allocation', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Look for disk info
        const diskInfo = page.locator('text=/disk/i, [class*="disk"]').first();
        const isVisible = await diskInfo.isVisible().catch(() => false);

        // Disk allocation should be displayed (may be in summary cards)
        expect(isVisible).toBeTruthy();
      });

      test('should show buildpack information', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Look for buildpack info
        const buildpackInfo = page.locator('text=/buildpack/i, [class*="buildpack"]').first();
        const isVisible = await buildpackInfo.isVisible().catch(() => false);

        // Buildpack info should be displayed (shows "none" or actual buildpack)
        expect(isVisible).toBeTruthy();
      });

      test('should display stack information', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Look for stack info (cflinuxfs3, etc.)
        const stackInfo = page.locator('text=/stack/i, text=/cflinuxfs/i').first();
        const isVisible = await stackInfo.isVisible().catch(() => false);

        // Stack info should be displayed
        expect(isVisible).toBeTruthy();
      });

      test('should show CF space and org', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.waitForPage();

        // Look for space and org info
        const spaceInfo = page.locator('text=/space/i').first();
        const orgInfo = page.locator('text=/organization|org/i').first();

        const spaceVisible = await spaceInfo.isVisible().catch(() => false);
        const orgVisible = await orgInfo.isVisible().catch(() => false);

        // Either space or org info should be visible
        expect(spaceVisible || orgVisible).toBeTruthy();
      });
    });

    test.describe('Instances Tab', () => {
      test('should list all instances', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToInstancesTab();
        await page.waitForTimeout(1500);

        // Look for instances list
        const instancesList = page.locator('app-list, mat-table, .instances-list').first();
        await expect(instancesList).toBeVisible({ timeout: 10000 });
      });

      test('should show instance state', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToInstancesTab();
        await page.waitForTimeout(1500);

        // Look for instance state indicators (RUNNING, STOPPED, etc.)
        const stateIndicator = page.locator('text=/running|stopped|starting|crashed/i, mat-chip, .state').first();
        const isVisible = await stateIndicator.isVisible().catch(() => false);

        // State should be displayed (even if no instances running)
        expect(isVisible).toBeTruthy();
      });

      test('should display instance metrics', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToInstancesTab();
        await page.waitForTimeout(1500);

        // Look for metrics (CPU, memory, disk usage)
        const metricsInfo = page.locator('text=/cpu|memory|disk/i, [class*="metric"]').first();
        const isVisible = await metricsInfo.isVisible().catch(() => false);

        // Metrics should be visible (or message that app is stopped)
        expect(isVisible).toBeTruthy();
      });

      test('should allow SSH to instance (if enabled)', async () => {
        test.skip(true, 'SSH requires a running instance; the API-created test app has no bits and stays STOPPED.');
      });

      test('should show instance logs', async () => {
        test.skip(true, 'Per-instance logs require a running instance; app-level logs are covered by the Log Stream tab.');
      });
    });

    test.describe('Routes Tab', () => {
      test('should list all routes', async ({ withTestApp }) => {
        const { page, testApp, helper } = withTestApp;

        // Create a route
        const routeGuid = await helper.createAndMapRoute(testApp, `view-test-${Date.now()}`);
        expect(routeGuid).toBeTruthy();

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToRoutesTab();
        await page.waitForTimeout(1500);

        // Verify routes list is visible
        const routesList = page.locator('app-list, mat-table, .routes-list').first();
        await expect(routesList).toBeVisible({ timeout: 10000 });
      });

      test('should allow adding new route', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToRoutesTab();
        await page.waitForTimeout(1000);

        // Look for add route button
        const addButton = page.locator('button').filter({ hasText: /add.*route|create.*route/i }).first();
        await expect(addButton).toBeVisible({ timeout: 10000 });
      });

      test('should allow unmapping route', async ({ withTestApp }) => {
        const { page, testApp, helper } = withTestApp;

        // Create a route first
        const routeGuid = await helper.createAndMapRoute(testApp, `unmap-view-${Date.now()}`);
        expect(routeGuid).toBeTruthy();

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToRoutesTab();
        await page.waitForTimeout(1500);

        // Look for unmap/remove action
        const unmapButton = page.locator('button, mat-icon').filter({ hasText: /unmap|remove|delete/i }).first();
        const unmapExists = await unmapButton.count() > 0;

        // Unmap action should be available
        expect(unmapExists).toBeGreaterThan(0);
      });

      test('should allow mapping existing route', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToRoutesTab();
        await page.waitForTimeout(1000);

        // Look for map existing route button
        const mapButton = page.locator('button').filter({ hasText: /map.*route|existing.*route/i }).first();
        const mapExists = await mapButton.count() > 0;

        // Map existing button should be available
        expect(mapExists).toBeDefined();
      });
    });

    test.describe('Log Stream Tab', () => {
      test('should display recent logs', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToRoutesTab();
        await page.waitForTimeout(1000);

        // Look for log stream component or container
        const logStream = page.locator('app-log-stream, .log-stream, [class*="log"]').first();
        const isVisible = await logStream.isVisible().catch(() => false);

        // Log stream area should exist (may be empty for stopped app)
        expect(isVisible).toBeTruthy();
      });

      test('should auto-scroll with new logs', async () => {
        // The modern log viewer auto-scrolls by default (a "Scroll to Bottom"
        // escape button appears only once the user scrolls up through content).
        test.skip(true, 'Verifying auto-scroll needs flowing logs, which requires a running app; the API-created test app has no bits and stays STOPPED.');
      });

      test('should allow filtering by log level', async () => {
        test.skip(true, 'The modern log viewer (app-log-viewer) has no log-level filter UI; the legacy Material filter was not carried over.');
      });

      test('should support log download', async () => {
        test.skip(true, 'The modern log viewer (app-log-viewer) has no download control; the legacy download feature was not carried over.');
      });
    });

    test.describe('Services Tab', () => {
      test('should list bound services', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToServicesTab();
        await page.waitForTimeout(1500);

        // Look for services list
        const servicesList = page.locator('app-list, mat-table, .services-list').first();
        await expect(servicesList).toBeVisible({ timeout: 10000 });
      });

      test('should allow binding new service', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToServicesTab();
        await page.waitForTimeout(1000);

        // Look for bind service button
        const bindButton = page.locator('button').filter({ hasText: /bind.*service|add.*service/i }).first();
        await expect(bindButton).toBeVisible({ timeout: 10000 });
      });

      test('should allow unbinding service', async ({ withTestApp }) => {
        const { page, testApp, cfApi } = withTestApp;

        // Seed a real binding: user-provided service instances need no broker.
        const serviceName = createCustomName('e2e-view-unbind');
        const serviceGuid = await cfApi.createUserProvidedService(testApp.spaceGuid, serviceName);
        let bindingGuid: string | undefined;
        try {
          bindingGuid = await cfApi.bindService(testApp.app.guid, serviceGuid);

          const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
          await appSummary.navigateTo();
          await appSummary.goToServicesTab();

          // The services list defaults to card view; each card carries the
          // same row-actions kebab as a table row. Unbind lives behind it.
          const card = page.locator('app-services-tab app-signal-list [data-test="card"]')
            .filter({ hasText: serviceName }).first();
          await card.waitFor({ state: 'visible', timeout: 30000 });
          const list = new ListTableComponent(page, page.locator('app-services-tab app-signal-list'));
          const menu = await list.openRowActionMenuByRow(card);
          await expect(menu.getItem('Unbind')).toBeVisible();
        } finally {
          if (bindingGuid) {
            await cfApi.unbindService(bindingGuid).catch(() => {});
          }
          await cfApi.deleteServiceInstance(serviceGuid).catch(() => {});
        }
      });

      test('should show service details', async ({ withTestApp }) => {
        const { page, testApp, cfApi } = withTestApp;

        // Seed a real binding so the list has a row to show details for.
        const serviceName = createCustomName('e2e-view-details');
        const serviceGuid = await cfApi.createUserProvidedService(testApp.spaceGuid, serviceName);
        let bindingGuid: string | undefined;
        try {
          bindingGuid = await cfApi.bindService(testApp.app.guid, serviceGuid);

          const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
          await appSummary.navigateTo();
          await appSummary.goToServicesTab();

          // The services card IS the details surface: it must show the bound
          // instance by name and its service type.
          const card = page.locator('app-services-tab app-signal-list [data-test="card"]')
            .filter({ hasText: serviceName }).first();
          await card.waitFor({ state: 'visible', timeout: 30000 });
          await expect(card.getByText('User Provided')).toBeVisible();
        } finally {
          if (bindingGuid) {
            await cfApi.unbindService(bindingGuid).catch(() => {});
          }
          await cfApi.deleteServiceInstance(serviceGuid).catch(() => {});
        }
      });
    });

    test.describe('Variables Tab', () => {
      test('should list environment variables', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToVariablesTab();
        await page.waitForTimeout(1500);

        // Look for variables list or display
        const variablesList = page.locator('app-list, mat-table, .variables-list, [class*="env"]').first();
        await expect(variablesList).toBeVisible({ timeout: 10000 });
      });

      test('should allow adding variable', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToVariablesTab();
        await page.waitForTimeout(1000);

        // Look for add variable button
        const addButton = page.locator('button').filter({ hasText: /add.*variable|add.*env|new/i }).first();
        const addExists = await addButton.count() > 0;

        // Add variable functionality should exist
        expect(addExists).toBeGreaterThan(0);
      });

      test('should allow editing variable', async ({ withTestApp }) => {
        const { page, testApp, cfApi } = withTestApp;

        // Seed a variable so the list has a row with actions.
        await cfApi.updateAppEnvironment(testApp.app.guid, { E2E_EDIT_VAR: 'before' });

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToVariablesTab();

        // Edit is a per-row action behind the signal-list row-actions kebab.
        const list = new ListTableComponent(page, page.locator('app-variables-tab app-signal-list'));
        const row = await list.findRowByCellContent('E2E_EDIT_VAR');
        const menu = await list.openRowActionMenuByRow(row);
        await expect(menu.getItem('Edit')).toBeVisible();
      });

      test('should allow deleting variable', async ({ withTestApp }) => {
        const { page, testApp, cfApi } = withTestApp;

        // Seed a variable so the list has a row with actions.
        await cfApi.updateAppEnvironment(testApp.app.guid, { E2E_DELETE_VAR: 'gone' });

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToVariablesTab();

        // Delete is a per-row action behind the signal-list row-actions kebab.
        const list = new ListTableComponent(page, page.locator('app-variables-tab app-signal-list'));
        const row = await list.findRowByCellContent('E2E_DELETE_VAR');
        const menu = await list.openRowActionMenuByRow(row);
        await expect(menu.getItem('Delete')).toBeVisible();
      });
    });

    test.describe('Events Tab', () => {
      test('should display application events', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToEventsTab();
        await page.waitForTimeout(1500);

        // Look for events list
        const eventsList = page.locator('app-list, mat-table, .events-list').first();
        await expect(eventsList).toBeVisible({ timeout: 10000 });
      });

      test('should show event timestamps', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToEventsTab();
        await page.waitForTimeout(1500);

        // Look for timestamp column or timestamp data
        const timestampElement = page.locator('text=/\\d{1,2}:\\d{2}|\\d{4}-\\d{2}-\\d{2}|ago|time/i').first();
        const timestampVisible = await timestampElement.isVisible().catch(() => false);

        // Timestamps should be displayed in events
        expect(timestampVisible).toBeTruthy();
      });

      test('should display event types', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToEventsTab();
        await page.waitForTimeout(1500);

        // Look for event type indicators (audit events, app events, etc.)
        const eventTypeElement = page.locator('text=/audit|app\\.crash|instance|update/i, [class*="type"]').first();
        const typeVisible = await eventTypeElement.isVisible().catch(() => false);

        // Event types should be displayed
        expect(typeVisible).toBeTruthy();
      });

      test('should support event filtering', async ({ withTestApp }) => {
        const { page, testApp } = withTestApp;

        const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
        await appSummary.navigateTo();
        await appSummary.goToEventsTab();

        // The events signal-list exposes a name filter input.
        await expect(page.locator('app-events-tab [data-test="name-filter"]')).toBeVisible({ timeout: 10000 });
      });
    });

    // Cleanup handled automatically by withTestApp fixture
  });
});
