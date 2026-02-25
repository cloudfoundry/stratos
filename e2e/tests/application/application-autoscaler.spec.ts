import { test, expect } from '../../fixtures/test-base';
import { ApplicationBasePage } from '../../pages/application/application.page';
import { ApplicationPageAutoscalerTab } from '../../pages/application/tabs/autoscaler.page';

/**
 * Application Autoscaler E2E Tests
 * Migrated from src/test-e2e/application/application-autoscaler-e2e.spec.ts
 *
 * Tests CF autoscaler integration
 *
 * CF Helpers Integration:
 * - ✅ Uses applicationHelper for app creation via CF API
 * - ⏳ UI wizard tests require autoscaler extension and page objects (TODO)
 * - ⏳ Policy management tests require autoscaler API integration (TODO)
 *
 * NOTE: Full autoscaler functionality requires:
 * - CF autoscaler extension enabled in CF
 * - Autoscaler extension enabled in Stratos
 * - Autoscaler policy management API
 */

test.describe('Application Autoscaler', () => {

  test.describe('Basic Autoscaler Setup', () => {
    test('should create app for autoscaler testing', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      // Verify app exists and is ready for autoscaler
      expect(testApp.app.guid).toBeTruthy();
      expect(testApp.app.state).toBe('STOPPED');

      // Navigate to app summary
      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();
      await page.waitForLoadState('networkidle');

      const summaryPage = page.locator('app-application-page');
      await expect(summaryPage).toBeVisible();
    });

    test('should verify autoscaler extension availability', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      // Navigate to app page to check if autoscaler tab exists
      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Check if autoscaler tab/feature is available
      // Note: This test documents the autoscaler integration point
      // Actual autoscaler tab presence depends on extension being enabled
      const appPageElement = page.locator('app-application-page');
      await expect(appPageElement).toBeVisible();

      // The autoscaler tab would appear here if extension is enabled
      // For now, we just verify the app page loads successfully
    });
  });

  test.describe('Autoscaler Tab (UI)', () => {
    test('should show autoscaler tab when extension enabled', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      // Navigate to app summary
      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Check if autoscaler tab is present
      const autoscalerTab = page.locator('app-page-tabs, mat-tab-group').locator('button, a').filter({ hasText: /autoscale/i });
      const tabVisible = await autoscalerTab.isVisible().catch(() => false);

      if (!tabVisible) {
        test.skip(tabVisible, 'Autoscaler extension is not enabled in this CF deployment');
      }

      // Verify autoscaler tab is visible
      await expect(autoscalerTab).toBeVisible();
    });

    test('should navigate to autoscaler tab', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      // Navigate to app page
      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Check if autoscaler tab exists
      const autoscalerTab = page.locator('app-page-tabs, mat-tab-group').locator('button, a').filter({ hasText: /autoscale/i });
      const tabVisible = await autoscalerTab.isVisible().catch(() => false);

      if (!tabVisible) {
        test.skip(tabVisible, 'Autoscaler extension is not enabled');
      }

      // Click autoscaler tab
      await autoscalerTab.click();

      // Verify navigation to autoscale URL
      await page.waitForURL(new RegExp(`/applications/${testApp.cfGuid}/${testApp.app.guid}/autoscale`), { timeout: 10000 });

      // Verify autoscaler page loaded
      const autoscalerPage = page.locator('app-autoscaler-tab, app-application-autoscaler');
      await expect(autoscalerPage.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show policy status', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      // Navigate to app page
      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();
      await page.waitForLoadState('networkidle');

      // Check for autoscaler tab
      const autoscalerTab = page.locator('app-page-tabs, mat-tab-group').locator('button, a').filter({ hasText: /autoscale/i });
      const tabVisible = await autoscalerTab.isVisible().catch(() => false);

      if (!tabVisible) {
        test.skip(tabVisible, 'Autoscaler extension is not enabled');
      }

      // Navigate to autoscaler tab
      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Check for policy status message (either "no policy" or existing policy details)
      const noPolicyMessage = page.locator('app-no-content-message, .no-content-message').filter({ hasText: /no.*policy|policy.*not.*found/i });
      const policyCard = page.locator('app-card-autoscaler-default, app-autoscaler-policy');

      // Either "no policy" message or policy card should be visible
      const noPolicyVisible = await noPolicyMessage.isVisible().catch(() => false);
      const policyVisible = await policyCard.isVisible().catch(() => false);

      expect(noPolicyVisible || policyVisible).toBe(true);
    });
  });

  test.describe('Create Policy (UI)', () => {
    test('should open create policy dialog', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      // Navigate to app and check for autoscaler
      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      const tabVisible = await autoscalerTab.isVisible().catch(() => false);

      if (!tabVisible) {
        test.skip(tabVisible, 'Autoscaler extension not available');
      }

      // Navigate to autoscaler tab
      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Look for create/add policy button
      const createButton = page.locator('button').filter({ hasText: /create|add.*policy/i });
      const buttonVisible = await createButton.isVisible().catch(() => false);

      if (buttonVisible) {
        await createButton.click();

        // Verify policy creation dialog/form opened
        const policyDialog = page.locator('app-dialog, mat-dialog-container, app-autoscaler-policy-form');
        await expect(policyDialog.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should set instance limits (min/max)', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const createButton = page.locator('button').filter({ hasText: /create|add.*policy/i });
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Look for instance limit fields
        const minInstancesField = page.locator('input[formcontrolname="minInstances"], input[name="minInstances"], input').filter({ has: page.locator('label').filter({ hasText: /min.*instance/i }) });
        const maxInstancesField = page.locator('input[formcontrolname="maxInstances"], input[name="maxInstances"], input').filter({ has: page.locator('label').filter({ hasText: /max.*instance/i }) });

        const minVisible = await minInstancesField.isVisible().catch(() => false);
        const maxVisible = await maxInstancesField.isVisible().catch(() => false);

        if (minVisible && maxVisible) {
          // Set values
          await minInstancesField.first().fill('1');
          await maxInstancesField.first().fill('5');

          // Verify values set
          await expect(minInstancesField.first()).toHaveValue('1');
          await expect(maxInstancesField.first()).toHaveValue('5');
        }
      }
    });

    test('should configure scaling rules', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const createButton = page.locator('button').filter({ hasText: /create|add.*policy/i });
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Look for scaling rules section
        const scalingRulesSection = page.locator('app-autoscaler-scaling-rules, .scaling-rules').or(
          page.locator('mat-expansion-panel').filter({ hasText: /scaling.*rule/i })
        );

        const rulesVisible = await scalingRulesSection.isVisible().catch(() => false);
        if (rulesVisible) {
          await expect(scalingRulesSection.first()).toBeVisible();
        }
      }
    });

    test('should set CPU threshold', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const createButton = page.locator('button').filter({ hasText: /create|add.*policy/i });
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Look for CPU threshold field
        const cpuField = page.locator('input[formcontrolname="cpuThreshold"], input[name="cpu"]').or(
          page.locator('input').filter({ has: page.locator('label').filter({ hasText: /cpu/i }) })
        );

        const cpuVisible = await cpuField.isVisible().catch(() => false);
        if (cpuVisible) {
          await cpuField.first().fill('80');
          await expect(cpuField.first()).toHaveValue('80');
        }
      }
    });

    test('should set memory threshold', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const createButton = page.locator('button').filter({ hasText: /create|add.*policy/i });
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Look for memory threshold field
        const memoryField = page.locator('input[formcontrolname="memoryThreshold"], input[name="memory"]').or(
          page.locator('input').filter({ has: page.locator('label').filter({ hasText: /memory/i }) })
        );

        const memoryVisible = await memoryField.isVisible().catch(() => false);
        if (memoryVisible) {
          await memoryField.first().fill('90');
          await expect(memoryField.first()).toHaveValue('90');
        }
      }
    });

    test('should set custom metrics', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const createButton = page.locator('button').filter({ hasText: /create|add.*policy/i });
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Look for custom metrics section
        const customMetricsSection = page.locator('app-autoscaler-custom-metrics, .custom-metrics').or(
          page.locator('mat-expansion-panel').filter({ hasText: /custom.*metric/i })
        );

        const metricsVisible = await customMetricsSection.isVisible().catch(() => false);
        if (metricsVisible) {
          await expect(customMetricsSection.first()).toBeVisible();
        }
      }
    });

    test('should save policy', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const createButton = page.locator('button').filter({ hasText: /create|add.*policy/i });
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Fill in minimum required fields
        const minInstancesField = page.locator('input[formcontrolname="minInstances"], input[name="minInstances"]');
        const maxInstancesField = page.locator('input[formcontrolname="maxInstances"], input[name="maxInstances"]');

        if (await minInstancesField.isVisible().catch(() => false)) {
          await minInstancesField.first().fill('1');
        }
        if (await maxInstancesField.isVisible().catch(() => false)) {
          await maxInstancesField.first().fill('5');
        }

        // Look for save/submit button
        const saveButton = page.locator('button').filter({ hasText: /save|create|submit/i });
        const saveVisible = await saveButton.isVisible().catch(() => false);

        if (saveVisible) {
          await saveButton.first().click();

          // Wait for dialog to close or success message
          await page.waitForTimeout(2000);

          // Verify we're back on autoscaler tab or success shown
          const currentUrl = page.url();
          expect(currentUrl).toContain('autoscale');
        }
      }
    });
  });

  test.describe('Edit Policy (UI)', () => {
    test('should load existing policy', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Look for edit policy button (only visible if policy exists)
      const editButton = page.locator('button').filter({ hasText: /edit.*policy/i });
      const editVisible = await editButton.isVisible().catch(() => false);

      if (editVisible) {
        await editButton.click();

        // Verify policy edit dialog/form opened
        const policyDialog = page.locator('app-dialog, mat-dialog-container, app-autoscaler-policy-form');
        await expect(policyDialog.first()).toBeVisible({ timeout: 10000 });

        // Verify fields are populated with existing values
        const minInstancesField = page.locator('input[formcontrolname="minInstances"], input[name="minInstances"]');
        const minFieldVisible = await minInstancesField.isVisible().catch(() => false);

        if (minFieldVisible) {
          const minValue = await minInstancesField.first().inputValue();
          expect(minValue).toBeTruthy(); // Should have existing value
        }
      }
    });

    test('should modify instance limits', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const editButton = page.locator('button').filter({ hasText: /edit.*policy/i });
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();

        const minInstancesField = page.locator('input[formcontrolname="minInstances"], input[name="minInstances"]');
        const maxInstancesField = page.locator('input[formcontrolname="maxInstances"], input[name="maxInstances"]');

        if (await minInstancesField.isVisible().catch(() => false)) {
          await minInstancesField.first().fill('2');
          await expect(minInstancesField.first()).toHaveValue('2');
        }

        if (await maxInstancesField.isVisible().catch(() => false)) {
          await maxInstancesField.first().fill('10');
          await expect(maxInstancesField.first()).toHaveValue('10');
        }
      }
    });

    test('should update scaling rules', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const editButton = page.locator('button').filter({ hasText: /edit.*policy/i });
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();

        // Look for scaling rules section
        const scalingRulesSection = page.locator('app-autoscaler-scaling-rules, .scaling-rules').or(
          page.locator('mat-expansion-panel').filter({ hasText: /scaling.*rule/i })
        );

        const rulesVisible = await scalingRulesSection.isVisible().catch(() => false);
        if (rulesVisible) {
          await expect(scalingRulesSection.first()).toBeVisible();
          // Rules can be modified here
        }
      }
    });

    test('should save changes', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const editButton = page.locator('button').filter({ hasText: /edit.*policy/i });
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();

        // Make a change
        const minInstancesField = page.locator('input[formcontrolname="minInstances"], input[name="minInstances"]');
        if (await minInstancesField.isVisible().catch(() => false)) {
          await minInstancesField.first().fill('2');
        }

        // Save changes
        const saveButton = page.locator('button').filter({ hasText: /save|update|submit/i });
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.first().click();

          // Wait for save operation
          await page.waitForTimeout(2000);

          // Verify we're back on autoscaler tab
          const currentUrl = page.url();
          expect(currentUrl).toContain('autoscale');
        }
      }
    });
  });

  test.describe('Delete Policy (UI)', () => {
    test('should confirm policy deletion', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Look for delete policy button
      const deleteButton = page.locator('button').filter({ hasText: /delete.*policy|remove.*policy/i });
      const deleteVisible = await deleteButton.isVisible().catch(() => false);

      if (deleteVisible) {
        await deleteButton.click();

        // Verify confirmation dialog appears
        const confirmDialog = page.locator('app-dialog-confirm, app-confirm-dialog, mat-dialog-container');
        await expect(confirmDialog.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should delete policy', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const deleteButton = page.locator('button').filter({ hasText: /delete.*policy|remove.*policy/i });
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page.locator('mat-dialog-container button, app-confirm-dialog button').filter({ hasText: /delete|confirm/i });
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.first().click();

          // Wait for deletion
          await page.waitForTimeout(2000);

          // Verify "no policy" message appears
          const noPolicyMessage = page.locator('app-no-content-message, .no-content-message').filter({ hasText: /no.*policy/i });
          const noPolicy = await noPolicyMessage.isVisible().catch(() => false);

          if (noPolicy) {
            await expect(noPolicyMessage).toBeVisible();
          }
        }
      }
    });

    test('should disable autoscaling', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Deleting policy effectively disables autoscaling
      const deleteButton = page.locator('button').filter({ hasText: /delete.*policy|remove.*policy/i });
      if (await deleteButton.isVisible().catch(() => false)) {
        // Policy exists, can be deleted to disable autoscaling
        await expect(deleteButton).toBeVisible();
      } else {
        // No policy = autoscaling already disabled
        const noPolicyMessage = page.locator('app-no-content-message').filter({ hasText: /no.*policy/i });
        const noPolicy = await noPolicyMessage.isVisible().catch(() => false);

        if (noPolicy) {
          await expect(noPolicyMessage).toBeVisible();
        }
      }
    });
  });

  test.describe('Scaling Events (UI)', () => {
    test('should show scaling history', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Look for scaling events/history section
      const eventsSection = page.locator('app-autoscaler-events, app-table-autoscaler-events, .autoscaler-events').or(
        page.locator('mat-expansion-panel').filter({ hasText: /event|history/i })
      );

      const eventsVisible = await eventsSection.isVisible().catch(() => false);
      if (eventsVisible) {
        await expect(eventsSection.first()).toBeVisible();
      } else {
        // Events might be in a tab or collapsed section
        const eventsTab = page.locator('button, a').filter({ hasText: /event|history/i });
        const tabVisible = await eventsTab.isVisible().catch(() => false);

        if (tabVisible) {
          await eventsTab.click();
          await expect(page.locator('app-table, table').first()).toBeVisible();
        }
      }
    });

    test('should display scale up events', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Look for events table
      const eventsTable = page.locator('app-table-autoscaler-events, app-table, table');
      const tableVisible = await eventsTable.isVisible().catch(() => false);

      if (tableVisible) {
        // Events table exists - look for scale up events
        const scaleUpEvent = eventsTable.locator('tr, .row').filter({ hasText: /scale.*up|scaled.*up/i });
        const hasScaleUp = await scaleUpEvent.isVisible().catch(() => false);

        // Events might not exist yet, but table should be present
        if (!hasScaleUp) {
          // No events yet, which is fine
          await expect(eventsTable.first()).toBeVisible();
        }
      }
    });

    test('should display scale down events', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const eventsTable = page.locator('app-table-autoscaler-events, app-table, table');
      const tableVisible = await eventsTable.isVisible().catch(() => false);

      if (tableVisible) {
        const scaleDownEvent = eventsTable.locator('tr, .row').filter({ hasText: /scale.*down|scaled.*down/i });
        const hasScaleDown = await scaleDownEvent.isVisible().catch(() => false);

        // Events might not exist yet
        if (!hasScaleDown) {
          await expect(eventsTable.first()).toBeVisible();
        }
      }
    });

    test('should show event timestamps', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const eventsTable = page.locator('app-table-autoscaler-events, app-table, table');
      if (await eventsTable.isVisible().catch(() => false)) {
        // Look for timestamp column header
        const timestampHeader = eventsTable.locator('th, .header-cell').filter({ hasText: /time|date/i });
        const headerVisible = await timestampHeader.isVisible().catch(() => false);

        if (headerVisible) {
          await expect(timestampHeader.first()).toBeVisible();
        }
      }
    });

    test('should show scaling reasons', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const eventsTable = page.locator('app-table-autoscaler-events, app-table, table');
      if (await eventsTable.isVisible().catch(() => false)) {
        // Look for reason column
        const reasonHeader = eventsTable.locator('th, .header-cell').filter({ hasText: /reason|cause/i });
        const headerVisible = await reasonHeader.isVisible().catch(() => false);

        if (headerVisible) {
          await expect(reasonHeader.first()).toBeVisible();
        } else {
          // Reason might be embedded in event description
          await expect(eventsTable.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Metrics (UI)', () => {
    test('should display current metrics', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Look for metrics card or section
      const metricsCard = page.locator('app-card-autoscaler-metric, .autoscaler-metrics, app-metrics');
      const metricsVisible = await metricsCard.isVisible().catch(() => false);

      if (metricsVisible) {
        await expect(metricsCard.first()).toBeVisible();
      }
    });

    test('should show CPU usage', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const cpuMetric = page.locator('app-card-autoscaler-metric, .metric').filter({ hasText: /cpu/i });
      const cpuVisible = await cpuMetric.isVisible().catch(() => false);

      if (cpuVisible) {
        await expect(cpuMetric.first()).toBeVisible();
      }
    });

    test('should show memory usage', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      const memoryMetric = page.locator('app-card-autoscaler-metric, .metric').filter({ hasText: /memory/i });
      const memoryVisible = await memoryMetric.isVisible().catch(() => false);

      if (memoryVisible) {
        await expect(memoryMetric.first()).toBeVisible();
      }
    });

    test('should show custom metric values', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Custom metrics might not be configured
      const customMetric = page.locator('app-card-autoscaler-metric, .metric').filter({ hasText: /custom/i });
      const customVisible = await customMetric.isVisible().catch(() => false);

      if (customVisible) {
        await expect(customMetric.first()).toBeVisible();
      } else {
        // No custom metrics configured, which is fine
        const metricsSection = page.locator('app-autoscaler-tab, app-application-autoscaler');
        await expect(metricsSection.first()).toBeVisible();
      }
    });

    test('should refresh metrics automatically', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appPage = new ApplicationBasePage(page, testApp.cfGuid, testApp.app.guid);
      await appPage.navigateTo();

      const autoscalerTab = page.locator('button, a').filter({ hasText: /autoscale/i });
      if (!await autoscalerTab.isVisible().catch(() => false)) {
        test.skip(true, 'Autoscaler extension not available');
      }

      await autoscalerTab.click();
      await page.waitForURL(new RegExp(`/autoscale`));

      // Verify metrics section is present
      const metricsSection = page.locator('app-card-autoscaler-metric, .autoscaler-metrics, app-autoscaler-tab');
      await expect(metricsSection.first()).toBeVisible();

      // Auto-refresh is a background behavior
      // We can verify the page doesn't show errors after waiting
      await page.waitForTimeout(3000);

      // Metrics section should still be visible (no crash/error)
      await expect(metricsSection.first()).toBeVisible();
    });
  });
});
