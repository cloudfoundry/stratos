import { test as base, Page } from '@playwright/test';
import { SecretsHelper } from '../helpers/secrets-helpers';
import { EndpointManagementHelper } from '../helpers/endpoint-management.helper';
import { ConsoleUserType, RequestHelper } from '../helpers/request.helper';
import { CFApiHelper } from '../helpers/cf-api.helper';
import { ApplicationTestHelper, TestApp } from '../helpers/application-test.helper';
import { detectAuthType, browserLogin, AuthType } from '../helpers/auth.helper';
import { ADMIN_STATE, USER_STATE } from '../auth.constants';

/**
 * Test Fixtures
 * Provides reusable setup and teardown logic for E2E tests
 * Migrated from Protractor e2e.setup() pattern
 */

type TestFixtures = {
  secrets: ReturnType<typeof SecretsHelper.load>;
  authType: AuthType;
  endpointManager: EndpointManagementHelper;
  authenticatedPage: Page;
  adminPage: Page;
  userPage: Page;
  noEndpointsAdminPage: Page;
  noEndpointsUserPage: Page;
  registeredEndpointsPage: Page;
  connectedEndpointsAdminPage: { page: Page; cfGuid: string; orgGuid: string; spaceGuid: string };
  connectedEndpointsUserPage: { page: Page; cfGuid: string; orgGuid: string; spaceGuid: string };
  cfApi: CFApiHelper;
  applicationHelper: ApplicationTestHelper;
  withTestApp: { page: Page; testApp: TestApp; helper: ApplicationTestHelper; cfApi: CFApiHelper };
  withTestApps: { page: Page; testApps: TestApp[]; helper: ApplicationTestHelper; cfApi: CFApiHelper };
};

/**
 * Extended test with custom fixtures
 * Usage: import { test, expect } from '../fixtures/test-base';
 */
export const test = base.extend<TestFixtures>({
  /**
   * Secrets fixture - provides access to secrets.yaml
   */
  secrets: async ({}, use) => {
    const secrets = SecretsHelper.load();
    await use(secrets);
  },

  /**
   * Auth type fixture - detects local vs SSO auth
   */
  authType: async ({ baseURL }, use) => {
    const type = await detectAuthType(baseURL || 'https://localhost:5540');
    await use(type);
  },

  /**
   * Endpoint Manager fixture - provides endpoint management operations
   */
  endpointManager: async ({ baseURL }, use) => {
    const manager = new EndpointManagementHelper(baseURL);
    await use(manager);
    await manager.dispose();
  },

  /**
   * Authenticated page fixture - pre-authenticated as admin via storageState.
   * The setup project saves admin cookies; the chromium project loads them.
   * Just navigate to trigger the stored session.
   */
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
  },

  /**
   * Admin page fixture - alias for authenticatedPage
   */
  adminPage: async ({ authenticatedPage }, use) => {
    await use(authenticatedPage);
  },

  /**
   * User page fixture - uses saved user storageState
   */
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: USER_STATE });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
    await context.close();
  },

  /**
   * No Endpoints Admin Page - Admin user (pre-authenticated via storageState)
   */
  noEndpointsAdminPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
  },

  /**
   * No Endpoints User Page - Regular user (pre-authenticated via storageState)
   */
  noEndpointsUserPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: USER_STATE });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
    await context.close();
  },

  /**
   * Registered Endpoints Page - Admin with default CF registered (pre-authenticated)
   */
  registeredEndpointsPage: async ({ page, endpointManager }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Dismiss snackbar if present
    try {
      const snackbar = page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container, simple-snack-bar');
      await snackbar.waitFor({ state: 'visible', timeout: 3000 });
      const closeButton = snackbar.locator('button').filter({ hasText: /close|dismiss/i });
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
      await snackbar.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    } catch { /* snackbar may not appear */ }

    await use(page);
  },

  /**
   * Connected Endpoints Admin Page - Admin with default CF registered and connected.
   * Pre-authenticated via storageState. Endpoint setup done in auth.setup.ts.
   * Uses page.request to get endpoint GUID (no extra browser launch).
   */
  connectedEndpointsAdminPage: async ({ page, secrets }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Get CF endpoint GUID using the page's existing session
    const response = await page.request.get('/api/v1/endpoints');
    const endpointsList = await response.json();
    const cfEndpoint = endpointsList.find((ep: any) => ep.cnsi_type === 'cf');

    if (!cfEndpoint) {
      throw new Error('No CF endpoint found');
    }

    const cfConfig = secrets.cloudFoundry[0];

    await use({
      page,
      cfGuid: cfEndpoint.guid,
      orgGuid: cfConfig.testOrgGuid,
      spaceGuid: cfConfig.testSpaceGuid
    });
  },

  /**
   * Connected Endpoints User Page - Regular user with default CF connected.
   * Pre-authenticated via storageState. Uses page.request for GUID lookup.
   */
  connectedEndpointsUserPage: async ({ browser, secrets }, use) => {
    const context = await browser.newContext({ storageState: USER_STATE });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Get CF endpoint GUID using the page's existing session
    const response = await page.request.get('/api/v1/endpoints');
    const endpointsList = await response.json();
    const cfEndpoint = endpointsList.find((ep: any) => ep.cnsi_type === 'cf');

    if (!cfEndpoint) {
      throw new Error('No CF endpoint found');
    }

    const cfConfig = secrets.cloudFoundry[0];

    await use({
      page,
      cfGuid: cfEndpoint.guid,
      orgGuid: cfConfig.testOrgGuid,
      spaceGuid: cfConfig.testSpaceGuid
    });

    await context.close();
  },

  /**
   * CF API Helper - Provides Cloud Foundry V3 API operations
   * Requires connected CF endpoint.
   * Still uses RequestHelper for ongoing API calls, but reuses
   * storageState session to avoid extra SSO login.
   */
  cfApi: async ({ baseURL, secrets }, use) => {
    const endpoints = secrets.cloudFoundry;
    if (!endpoints || endpoints.length === 0) {
      throw new Error('No Cloud Foundry endpoints configured in secrets');
    }

    // Create request helper with pre-authenticated state
    const request = new RequestHelper(baseURL || 'http://localhost:4200');
    await request.initFromStorageState(ADMIN_STATE);

    // Get registered endpoints
    const endpointsList = await request.get('/api/v1/endpoints');
    const cfEndpoint = endpointsList.find((ep: any) =>
      ep.cnsi_type === 'cf' && ep.api_endpoint?.Host
    );

    if (!cfEndpoint) {
      throw new Error('No CF endpoint found. Tests require a registered CF endpoint.');
    }

    // Initialize CF API helper
    const cfApi = new CFApiHelper(request, cfEndpoint.guid);
    await cfApi.init();

    await use(cfApi);

    await cfApi.cleanupTestResources();
    await request.dispose();
  },

  /**
   * Application Test Helper - High-level application management operations
   * Requires connected CF endpoint with default org/space
   */
  applicationHelper: async ({ page, cfApi, secrets }, use) => {
    // Get default org and space from secrets
    const cfConfig = secrets.cloudFoundry[0];
    if (!cfConfig.testOrgGuid || !cfConfig.testSpaceGuid) {
      throw new Error('Test org and space GUIDs required in secrets.cloudFoundry[0]');
    }

    // Get CF GUID (from cfApi)
    const endpoints = await cfApi['request'].get('/api/v1/endpoints');
    const cfEndpoint = endpoints.find((ep: any) => ep.cnsi_type === 'cf');

    const helper = new ApplicationTestHelper(
      cfApi,
      page,
      cfEndpoint.guid,
      cfConfig.testOrgGuid,
      cfConfig.testSpaceGuid
    );

    await use(helper);
  },

  /**
   * With Test App - Creates a single test application
   * Automatically cleans up after test completion
   */
  withTestApp: async ({ connectedEndpointsUserPage, applicationHelper, cfApi }, use) => {
    const testApp = await applicationHelper.createTestApp();

    await use({
      page: connectedEndpointsUserPage.page,
      testApp,
      helper: applicationHelper,
      cfApi
    });

    // Cleanup
    await applicationHelper.cleanupTestApp(testApp);
  },

  /**
   * With Test Apps - Creates multiple test applications
   * Automatically cleans up after test completion
   */
  withTestApps: async ({ connectedEndpointsUserPage, applicationHelper, cfApi }, use) => {
    const testApps = await applicationHelper.createTestApps(3);

    await use({
      page: connectedEndpointsUserPage.page,
      testApps,
      helper: applicationHelper,
      cfApi
    });

    // Cleanup all apps
    await applicationHelper.cleanupTestApps(testApps);
  },
});

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';
