import { Page } from '@playwright/test';
import { CFApiHelper, CFApp } from './cf-api.helper';
import { createCustomName } from './test-utils';

/**
 * Test Application Resource
 */
export interface TestApp {
  app: CFApp;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
}

/**
 * Application Test Helper
 * High-level wrapper for common application test operations
 *
 * Simplifies test code by providing ready-to-use patterns for:
 * - Creating test applications with sensible defaults
 * - Managing app lifecycle (start, stop, restart)
 * - Route management
 * - Service binding
 * - Automatic cleanup
 */
export class ApplicationTestHelper {
  constructor(
    private cfApi: CFApiHelper,
    private page: Page,
    private cfGuid: string,
    private defaultOrgGuid: string,
    private defaultSpaceGuid: string
  ) {}

  /**
   * Create a test application with e2e label
   */
  async createTestApp(name?: string, options?: {
    buildpacks?: string[];
    stack?: string;
    instances?: number;
    memory?: number;
    disk?: number;
    environmentVariables?: Record<string, string>;
  }): Promise<TestApp> {
    const appName = name || createCustomName('test-app');

    const app = await this.cfApi.createApp({
      name: appName,
      spaceGuid: this.defaultSpaceGuid,
      buildpacks: options?.buildpacks,
      stack: options?.stack,
      instances: options?.instances,
      memory: options?.memory,
      disk: options?.disk,
      environmentVariables: options?.environmentVariables
    });

    return {
      app,
      cfGuid: this.cfGuid,
      orgGuid: this.defaultOrgGuid,
      spaceGuid: this.defaultSpaceGuid
    };
  }

  /**
   * Create multiple test applications
   */
  async createTestApps(count: number, namePrefix?: string): Promise<TestApp[]> {
    const apps: TestApp[] = [];

    for (let i = 0; i < count; i++) {
      const name = namePrefix
        ? createCustomName(`${namePrefix}-${i + 1}`)
        : createCustomName(`test-app-${i + 1}`);

      const testApp = await this.createTestApp(name);
      apps.push(testApp);
    }

    return apps;
  }

  /**
   * Start application and wait for STARTED state
   */
  async startApp(testApp: TestApp, timeoutMs: number = 60000): Promise<void> {
    await this.cfApi.startApp(testApp.app.guid);
    await this.cfApi.waitForAppState(testApp.app.guid, 'STARTED', timeoutMs);
  }

  /**
   * Stop application and wait for STOPPED state
   */
  async stopApp(testApp: TestApp, timeoutMs: number = 60000): Promise<void> {
    await this.cfApi.stopApp(testApp.app.guid);
    await this.cfApi.waitForAppState(testApp.app.guid, 'STOPPED', timeoutMs);
  }

  /**
   * Restart application
   */
  async restartApp(testApp: TestApp): Promise<void> {
    await this.cfApi.restartApp(testApp.app.guid);
  }

  /**
   * Scale application
   */
  async scaleApp(testApp: TestApp, scale: {
    instances?: number;
    memory?: number;
    disk?: number;
  }): Promise<void> {
    await this.cfApi.scaleApp(testApp.app.guid, scale);
  }

  /**
   * Create and map a route to an application
   */
  async createAndMapRoute(testApp: TestApp, host?: string): Promise<string> {
    // Get available domains
    const domains = await this.cfApi.getDomains(testApp.spaceGuid);
    if (domains.length === 0) {
      throw new Error('No domains available for route creation');
    }

    // Use first available domain
    const domain = domains[0];

    // Create route
    const routeHost = host || createCustomName('test-route');
    const route = await this.cfApi.createRoute({
      domainGuid: domain.guid,
      spaceGuid: testApp.spaceGuid,
      host: routeHost
    });

    // Map route to app
    await this.cfApi.mapRoute(testApp.app.guid, route.guid);

    return route.guid;
  }

  /**
   * Bind service to application
   */
  async bindService(testApp: TestApp, serviceInstanceGuid: string): Promise<void> {
    await this.cfApi.bindService(testApp.app.guid, serviceInstanceGuid);
  }

  /**
   * Navigate to application summary page in UI
   */
  async navigateToAppSummary(testApp: TestApp): Promise<void> {
    await this.page.goto(`/applications/${testApp.cfGuid}/${testApp.app.guid}/summary`);

    // Wait for application page to load
    await this.page.locator('app-application-page').waitFor({ timeout: 10000 });
  }

  /**
   * Navigate to applications wall/list page
   */
  async navigateToAppsWall(): Promise<void> {
    await this.page.goto('/applications');
    await this.page.locator('app-applications-wall').waitFor({ timeout: 10000 });
  }

  /**
   * Clean up test application and associated resources
   */
  async cleanupTestApp(testApp: TestApp): Promise<void> {
    try {
      await this.cfApi.deleteApp(testApp.app.guid);
    } catch (error) {
      // Ignore cleanup errors - app may already be deleted
      console.warn(`Failed to cleanup app ${testApp.app.guid}:`, error);
    }
  }

  /**
   * Clean up multiple test applications
   */
  async cleanupTestApps(testApps: TestApp[]): Promise<void> {
    const cleanupPromises = testApps.map(app => this.cleanupTestApp(app));
    await Promise.allSettled(cleanupPromises);
  }

  /**
   * Get application by GUID
   */
  async getApp(appGuid: string): Promise<CFApp> {
    return await this.cfApi.getApp(appGuid);
  }

  /**
   * Wait for application to reach desired state
   */
  async waitForAppState(
    testApp: TestApp,
    desiredState: 'STOPPED' | 'STARTED',
    timeoutMs: number = 60000
  ): Promise<void> {
    await this.cfApi.waitForAppState(testApp.app.guid, desiredState, timeoutMs);
  }
}
