import { test, expect } from '../../fixtures/test-base';
import { AppCreateWizardPage } from '../../pages/application/app-create-wizard.page';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Application Create E2E Tests
 * Migrated from src/test-e2e/application/application-create-e2e.spec.ts
 *
 * Tests application creation workflow.
 *
 * The modern create wizard (/applications/create) is a 3-step signal stepper:
 *   1. Cloud Foundry (CF / org / space), 2. Name, 3. Create Route.
 * Instances/memory/disk/buildpack/stack/health-check are NO LONGER part of
 * create — they moved to /applications/deploy — so those legacy tests are
 * skipped with a reason rather than asserted against removed UI.
 */

const testAppBaseName = createCustomName('test-create-app');

test.describe('Application Create', () => {

  test.describe('Create via CF API', () => {
    test('should create app with default settings', async ({ applicationHelper, secrets }) => {
      const appName = createCustomName('basic-app');
      const testApp = await applicationHelper.createTestApp(appName);

      // Verify app was created
      expect(testApp.app.guid).toBeTruthy();
      expect(testApp.app.name).toBe(appName);
      expect(testApp.app.state).toBe('STOPPED');

      // Cleanup
      await applicationHelper.cleanupTestApp(testApp);
    });

    test('should create app with custom settings', async ({ applicationHelper, secrets }) => {
      const appName = createCustomName('custom-app');
      const testApp = await applicationHelper.createTestApp(appName, {
        instances: 2,
        memory: 512,
        disk: 1024,
        buildpacks: ['nodejs_buildpack']
      });

      // Verify app was created with custom settings
      expect(testApp.app.guid).toBeTruthy();
      expect(testApp.app.name).toBe(appName);

      // Get full app details to verify settings
      const app = await applicationHelper.getApp(testApp.app.guid);
      expect(app.lifecycle.data.buildpacks).toContain('nodejs_buildpack');

      // Cleanup
      await applicationHelper.cleanupTestApp(testApp);
    });

    test('should create multiple apps', async ({ applicationHelper }) => {
      const appNames = [
        createCustomName('multi-app-1'),
        createCustomName('multi-app-2'),
        createCustomName('multi-app-3')
      ];

      const testApps = await Promise.all(
        appNames.map(name => applicationHelper.createTestApp(name))
      );

      // Verify all apps were created
      expect(testApps.length).toBe(3);
      for (let i = 0; i < testApps.length; i++) {
        expect(testApps[i].app.guid).toBeTruthy();
        expect(testApps[i].app.name).toBe(appNames[i]);
      }

      // Cleanup all apps
      await applicationHelper.cleanupTestApps(testApps);
    });
  });

  test.describe('Create Wizard (UI)', () => {
    test('should open create application wizard', async ({ withTestApp }) => {
      const { page } = withTestApp;

      const createPage = new AppCreateWizardPage(page);
      await createPage.navigateTo();

      expect(await createPage.isOnCreateWizard()).toBe(true);
      // 3-step signal wizard: Cloud Foundry → Name → Create Route.
      const headers = await createPage.getStepHeaders();
      expect(headers.length).toBe(3);
      expect(headers.join(' | ')).toMatch(/Cloud Foundry.*Name.*Create Route/);
    });

    test('should require CF endpoint selection', async ({ withTestApp }) => {
      const { page } = withTestApp;

      const createPage = new AppCreateWizardPage(page);
      await createPage.navigateTo();

      // Step 1 gates Next until CF/org/space are chosen; nothing selected yet.
      expect(await createPage.isNextEnabled()).toBe(false);
    });

    test('should require organization selection', async ({ withTestApp }) => {
      const { page } = withTestApp;

      const createPage = new AppCreateWizardPage(page);
      await createPage.navigateTo();
      await createPage.selectCfWithData();

      // CF chosen but org/space still empty → cannot proceed.
      expect(await createPage.isNextEnabled()).toBe(false);
    });

    test('should require space selection', async ({ withTestApp }) => {
      const { page } = withTestApp;

      const createPage = new AppCreateWizardPage(page);
      await createPage.navigateTo();
      await createPage.selectCfAndOrgWithData();

      // CF + org chosen, space still empty → cannot proceed.
      expect(await createPage.isNextEnabled()).toBe(false);

      // Selecting the space completes step 1 → Next enables.
      await createPage.selectFirstRealSpace();
      await expect(page.locator('#stepper_next')).toBeEnabled({ timeout: 15000 });
    });

    test('should validate application name', async ({ withTestApp }) => {
      const { page } = withTestApp;

      const createPage = new AppCreateWizardPage(page);
      await createPage.navigateTo();
      await createPage.completeStep1WithData();
      await createPage.clickNext(); // → step 2 (Name)

      // Empty name → step invalid → Next stays disabled.
      await createPage.enterAppName('');
      await expect(page.locator('#stepper_next')).toBeDisabled();

      // A valid, unique name → Next enables.
      await createPage.enterAppName(createCustomName('valid-name'));
      await expect(page.locator('#stepper_next')).toBeEnabled({ timeout: 15000 });
    });

    // Legacy single-page-form fields removed from the create wizard (now
    // deploy-time concerns) — skipped with a reason rather than asserted
    // against UI that no longer exists.
    test('should set default buildpack', async () => {
      test.skip(true, 'Buildpack selection is not part of the modern create wizard (deploy-time concern).');
    });
    test('should set instance count', async () => {
      test.skip(true, 'Instance count is not part of the modern create wizard (deploy-time concern).');
    });
    test('should set memory allocation', async () => {
      test.skip(true, 'Memory allocation is not part of the modern create wizard (deploy-time concern).');
    });
    test('should set disk quota', async () => {
      test.skip(true, 'Disk quota is not part of the modern create wizard (deploy-time concern).');
    });
    test('should enable/disable health checks', async () => {
      test.skip(true, 'Health-check config is not part of the modern create wizard (deploy-time concern).');
    });
  });

  test.describe('Create from Manifest (UI)', () => {
    test('should support manifest upload', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Manifest upload in create wizard not yet implemented in UI
    });

    test('should parse manifest.yml correctly', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Manifest parsing in create wizard not yet implemented
    });

    test('should override manifest values', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Manifest override in create wizard not yet implemented
    });

    test('should validate manifest syntax', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Manifest validation in create wizard not yet implemented
    });
  });

  test.describe('Create and Deploy (UI)', () => {
    test('should create application', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Full create and deploy requires shell app creation without code upload
    });

    test('should upload application bits', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Application bits upload requires file upload integration in create wizard
    });

    test('should stage application', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Staging requires complete create and upload workflow
    });

    test('should start application', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Starting app requires complete create, upload, and staging
    });

    test('should show deployment progress', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Deployment progress requires full create and deploy workflow
    });

    test('should navigate to app summary on success', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Navigation test requires successful app creation
    });
  });

  test.describe('Create Errors', () => {
    test('should handle duplicate app name', async () => {
      // The step-2 uniqueness validator checks the WIZARD-selected space (the
      // connected CF with org/space data). The test fixtures create apps on a
      // different CF endpoint than the one the browser session has connected
      // (cross-CF fixture mismatch), so there is no seeded app in the selected
      // space to collide with. Needs a data-CF-aligned app seed to run for real.
      test.skip(true, 'Needs an app seeded in the wizard-selected (data-CF) space; fixtures create apps on a different CF endpoint.');
    });

    test('should handle invalid buildpack', async () => {
      test.skip(true, 'Buildpack selection is not part of the modern create wizard (deploy-time concern).');
    });

    test('should handle quota exceeded', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Quota exceeded error requires attempting creation that exceeds quota limits
    });

    test('should handle deployment failures', async ({ connectedEndpointsAdminPage }) => {
      test.skip(); // Deployment failure handling requires full create and deploy with failing app
    });

    test('should allow cancel during creation', async ({ withTestApp }) => {
      const { page } = withTestApp;

      const createPage = new AppCreateWizardPage(page);
      await createPage.navigateTo();
      await createPage.clickCancel();

      // Cancel returns to the applications wall (stepper's returnUrl default).
      await expect(page.locator('app-create-application app-steppers')).toBeHidden({ timeout: 15000 });
      expect(page.url()).not.toContain('/applications/create');
    });
  });
});
