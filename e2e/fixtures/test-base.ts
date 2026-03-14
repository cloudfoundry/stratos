import { test as base, Page } from '@playwright/test';
import { SecretsHelper } from '../helpers/secrets-helpers';
import { EndpointManagementHelper } from '../helpers/endpoint-management.helper';
import { ConsoleUserType, RequestHelper } from '../helpers/request.helper';
import { CFApiHelper } from '../helpers/cf-api.helper';
import { ApplicationTestHelper, TestApp } from '../helpers/application-test.helper';
import { detectAuthType, browserLogin, AuthType } from '../helpers/auth.helper';

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
   * Authenticated page fixture - automatically logs in as admin before each test
   * Supports both local auth and SSO (auto-detected).
   */
  authenticatedPage: async ({ page, secrets, authType }, use) => {
    await browserLogin(page, secrets.console.admin.username, secrets.console.admin.password, authType);
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
   * User page fixture - automatically logs in as regular user
   * Supports both local auth and SSO (auto-detected).
   */
  userPage: async ({ page, secrets, authType }, use) => {
    await browserLogin(page, secrets.console.user.username, secrets.console.user.password, authType);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
  },

  /**
   * No Endpoints Admin Page - Admin user with all endpoints cleared
   * Migrated from: e2e.setup(ConsoleUserType.admin).clearAllEndpoints()
   */
  noEndpointsAdminPage: async ({ page, secrets, authType, endpointManager }, use) => {
    await endpointManager.clearAllEndpoints();
    await browserLogin(page, secrets.console.admin.username, secrets.console.admin.password, authType);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
  },

  /**
   * No Endpoints User Page - Regular user with all endpoints cleared
   * Migrated from: e2e.setup(ConsoleUserType.user).clearAllEndpoints()
   */
  noEndpointsUserPage: async ({ page, secrets, authType, endpointManager }, use) => {
    await endpointManager.clearAllEndpoints();
    await browserLogin(page, secrets.console.user.username, secrets.console.user.password, authType);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
  },

  /**
   * Registered Endpoints Page - Admin with default CF registered but not connected
   * Migrated from: e2e.setup(ConsoleUserType.admin).clearAllEndpoints().registerDefaultCloudFoundry()
   */
  registeredEndpointsPage: async ({ page, secrets, authType, endpointManager }, use) => {
    await endpointManager.clearAllEndpoints();
    await endpointManager.registerDefaultCloudFoundry();
    await browserLogin(page, secrets.console.admin.username, secrets.console.admin.password, authType);
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
   * Connected Endpoints Admin Page - Admin with default CF registered and connected
   * Migrated from: e2e.setup(ConsoleUserType.admin).clearAllEndpoints().registerDefaultCloudFoundry().connectAllEndpoints(ConsoleUserType.admin)
   */
  connectedEndpointsAdminPage: async ({ page, secrets, authType, endpointManager, baseURL }, use) => {
    // Setup: clear all, register, and connect
    await endpointManager.clearAllEndpoints();
    await endpointManager.registerDefaultCloudFoundry();
    await endpointManager.connectAllEndpoints(ConsoleUserType.admin);

    // Login via browser (local or SSO)
    await browserLogin(page, secrets.console.admin.username, secrets.console.admin.password, authType);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Get CF endpoint GUID
    const request = new RequestHelper(baseURL || 'http://localhost:4200');
    await request.init();
    await request.createSession(ConsoleUserType.admin);

    const endpointsList = await request.get('/api/v1/endpoints');
    const cfEndpoint = endpointsList.find((ep: any) => ep.cnsi_type === 'cf');

    if (!cfEndpoint) {
      throw new Error('No CF endpoint found');
    }

    const cfGuid = cfEndpoint.guid;
    const cfConfig = secrets.cloudFoundry[0];

    await use({
      page,
      cfGuid,
      orgGuid: cfConfig.testOrgGuid,
      spaceGuid: cfConfig.testSpaceGuid
    });

    await request.dispose();
  },

  /**
   * Connected Endpoints User Page - Regular user with default CF connected
   * Migrated from: e2e.setup(ConsoleUserType.user).clearAllEndpoints().registerDefaultCloudFoundry().connectAllEndpoints(ConsoleUserType.user)
   */
  connectedEndpointsUserPage: async ({ page, secrets, authType, endpointManager, baseURL }, use) => {
    // Setup: clear all, register, and connect as user
    await endpointManager.clearAllEndpoints();
    await endpointManager.registerDefaultCloudFoundry();
    await endpointManager.connectAllEndpoints(ConsoleUserType.user);

    // Login via browser (local or SSO)
    await browserLogin(page, secrets.console.user.username, secrets.console.user.password, authType);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Get CF endpoint GUID
    const request = new RequestHelper(baseURL || 'http://localhost:4200');
    await request.init();
    await request.createSession(ConsoleUserType.user);

    const endpointsList = await request.get('/api/v1/endpoints');
    const cfEndpoint = endpointsList.find((ep: any) => ep.cnsi_type === 'cf');

    if (!cfEndpoint) {
      throw new Error('No CF endpoint found');
    }

    const cfGuid = cfEndpoint.guid;
    const cfConfig = secrets.cloudFoundry[0];

    await use({
      page,
      cfGuid,
      orgGuid: cfConfig.testOrgGuid,
      spaceGuid: cfConfig.testSpaceGuid
    });

    await request.dispose();
  },

  /**
   * CF API Helper - Provides Cloud Foundry V3 API operations
   * Requires connected CF endpoint
   */
  cfApi: async ({ baseURL, secrets, endpointManager }, use) => {
    // Ensure we have endpoints
    const endpoints = secrets.cloudFoundry;
    if (!endpoints || endpoints.length === 0) {
      throw new Error('No Cloud Foundry endpoints configured in secrets');
    }

    // Create request helper and get CF endpoint GUID
    const request = new RequestHelper(baseURL || 'http://localhost:4200');
    await request.init();
    await request.createSession(ConsoleUserType.admin);

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

    // Use the CF API helper
    await use(cfApi);

    // Cleanup: remove all test resources
    await cfApi.cleanupTestResources();

    // Dispose request helper
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
