import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Application Create Wizard Page Object
 *
 * Handles the complete application creation wizard workflow
 *
 * Features:
 * - CF endpoint selection
 * - Organization selection
 * - Space selection
 * - Application name and configuration
 * - Instance and resource settings
 * - Buildpack selection
 * - Health check configuration
 */
export class AppCreateWizardPage extends BasePage {
  private readonly stepper: Locator;

  constructor(page: Page) {
    super(page);
    this.stepper = page.locator('app-steppers, mat-horizontal-stepper, mat-vertical-stepper');
  }

  // ============================================
  // Locators
  // ============================================

  private get endpointSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Endpoint" i], select[name="endpoint"]');
  }

  private get organizationSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Organization" i], select[name="organization"]');
  }

  private get spaceSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Space" i], select[name="space"]');
  }

  private get appNameInput(): Locator {
    return this.page.locator('input[name="name"], input[formcontrolname="name"]');
  }

  private get instancesInput(): Locator {
    return this.page.locator('input[name="instances"], input[formcontrolname="instances"]');
  }

  private get memoryInput(): Locator {
    return this.page.locator('input[name="memory"], input[formcontrolname="memory"]');
  }

  private get diskInput(): Locator {
    return this.page.locator('input[name="disk"], input[formcontrolname="diskQuota"]');
  }

  private get buildpackSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Buildpack" i], select[name="buildpack"]');
  }

  private get stackSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Stack" i], select[name="stack"]');
  }

  private get startCommandInput(): Locator {
    return this.page.locator('input[name="command"], textarea[name="command"]');
  }

  private get healthCheckTypeSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Health" i], select[name="healthCheckType"]');
  }

  private get healthCheckEndpointInput(): Locator {
    return this.page.locator('input[name="healthCheckHttpEndpoint"]');
  }

  private get nextButton(): Locator {
    return this.page.getByRole('button', { name: /next|continue/i });
  }

  private get createButton(): Locator {
    return this.page.getByRole('button', { name: /create/i });
  }

  private get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  private get validationError(): Locator {
    return this.page.locator('.mat-error, .error-message');
  }

  // ============================================
  // Navigation
  // ============================================

  /**
   * Navigate to create application wizard
   */
  async navigateTo(cfGuid?: string, orgGuid?: string, spaceGuid?: string): Promise<void> {
    let url = '/applications/new';

    if (cfGuid && orgGuid && spaceGuid) {
      url = `/applications/new/${cfGuid}/${orgGuid}/${spaceGuid}`;
    } else if (cfGuid) {
      url = `/applications/new/${cfGuid}`;
    }

    await this.page.goto(url);
    await this.waitForStepper();
  }

  /**
   * Wait for stepper to be visible
   */
  async waitForStepper(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Endpoint, Org, Space Selection
  // ============================================

  /**
   * Select CF endpoint
   */
  async selectEndpoint(endpointName: string): Promise<void> {
    await this.endpointSelect.click();
    await this.page.getByRole('option', { name: new RegExp(endpointName, 'i') }).click();
  }

  /**
   * Get list of available endpoints
   */
  async getEndpoints(): Promise<string[]> {
    await this.endpointSelect.click();
    const options = this.page.locator('mat-option, option');
    const count = await options.count();
    const endpoints: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) endpoints.push(text.trim());
    }

    await this.page.keyboard.press('Escape');
    return endpoints;
  }

  /**
   * Select organization
   */
  async selectOrganization(orgName: string): Promise<void> {
    await this.organizationSelect.click();
    await this.page.getByRole('option', { name: new RegExp(orgName, 'i') }).click();
  }

  /**
   * Get list of available organizations
   */
  async getOrganizations(): Promise<string[]> {
    await this.organizationSelect.click();
    const options = this.page.locator('mat-option, option');
    const count = await options.count();
    const orgs: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) orgs.push(text.trim());
    }

    await this.page.keyboard.press('Escape');
    return orgs;
  }

  /**
   * Select space
   */
  async selectSpace(spaceName: string): Promise<void> {
    await this.spaceSelect.click();
    await this.page.getByRole('option', { name: new RegExp(spaceName, 'i') }).click();
  }

  /**
   * Get list of available spaces
   */
  async getSpaces(): Promise<string[]> {
    await this.spaceSelect.click();
    const options = this.page.locator('mat-option, option');
    const count = await options.count();
    const spaces: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) spaces.push(text.trim());
    }

    await this.page.keyboard.press('Escape');
    return spaces;
  }

  // ============================================
  // Application Configuration
  // ============================================

  /**
   * Enter application name
   */
  async enterAppName(name: string): Promise<void> {
    await this.appNameInput.fill(name);
    await this.appNameInput.blur(); // Trigger validation
  }

  /**
   * Check if app name is valid
   */
  async isAppNameValid(): Promise<boolean> {
    const error = await this.validationError.isVisible().catch(() => false);
    return !error;
  }

  /**
   * Set number of instances
   */
  async setInstances(count: number): Promise<void> {
    await this.instancesInput.fill(count.toString());
  }

  /**
   * Get instances value
   */
  async getInstances(): Promise<number> {
    const value = await this.instancesInput.inputValue();
    return parseInt(value) || 1;
  }

  /**
   * Set memory allocation (MB)
   */
  async setMemory(memoryMB: number): Promise<void> {
    await this.memoryInput.fill(memoryMB.toString());
  }

  /**
   * Get memory value
   */
  async getMemory(): Promise<number> {
    const value = await this.memoryInput.inputValue();
    return parseInt(value) || 256;
  }

  /**
   * Set disk quota (MB)
   */
  async setDiskQuota(diskMB: number): Promise<void> {
    await this.diskInput.fill(diskMB.toString());
  }

  /**
   * Get disk quota value
   */
  async getDiskQuota(): Promise<number> {
    const value = await this.diskInput.inputValue();
    return parseInt(value) || 1024;
  }

  // ============================================
  // Buildpack and Stack
  // ============================================

  /**
   * Select buildpack
   */
  async selectBuildpack(buildpackName: string): Promise<void> {
    await this.buildpackSelect.click();
    await this.page.getByRole('option', { name: new RegExp(buildpackName, 'i') }).click();
  }

  /**
   * Get list of available buildpacks
   */
  async getBuildpacks(): Promise<string[]> {
    await this.buildpackSelect.click();
    const options = this.page.locator('mat-option, option');
    const count = await options.count();
    const buildpacks: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) buildpacks.push(text.trim());
    }

    await this.page.keyboard.press('Escape');
    return buildpacks;
  }

  /**
   * Select stack
   */
  async selectStack(stackName: string): Promise<void> {
    const stackVisible = await this.stackSelect.isVisible().catch(() => false);
    if (!stackVisible) return; // Stack selection may not be available

    await this.stackSelect.click();
    await this.page.getByRole('option', { name: new RegExp(stackName, 'i') }).click();
  }

  /**
   * Set start command
   */
  async setStartCommand(command: string): Promise<void> {
    await this.startCommandInput.fill(command);
  }

  // ============================================
  // Health Checks
  // ============================================

  /**
   * Select health check type
   */
  async selectHealthCheckType(type: 'port' | 'http' | 'process'): Promise<void> {
    const healthCheckVisible = await this.healthCheckTypeSelect.isVisible().catch(() => false);
    if (!healthCheckVisible) return;

    await this.healthCheckTypeSelect.click();
    await this.page.getByRole('option', { name: new RegExp(type, 'i') }).click();
  }

  /**
   * Set HTTP health check endpoint
   */
  async setHealthCheckEndpoint(endpoint: string): Promise<void> {
    const endpointVisible = await this.healthCheckEndpointInput.isVisible().catch(() => false);
    if (!endpointVisible) return;

    await this.healthCheckEndpointInput.fill(endpoint);
  }

  /**
   * Configure health check
   */
  async configureHealthCheck(type: 'port' | 'http' | 'process', endpoint?: string): Promise<void> {
    await this.selectHealthCheckType(type);

    if (type === 'http' && endpoint) {
      await this.setHealthCheckEndpoint(endpoint);
    }
  }

  // ============================================
  // Complete Configuration
  // ============================================

  /**
   * Fill complete application configuration
   */
  async fillApplicationConfig(config: {
    name: string;
    instances?: number;
    memory?: number;
    disk?: number;
    buildpack?: string;
    stack?: string;
    startCommand?: string;
    healthCheck?: {
      type: 'port' | 'http' | 'process';
      endpoint?: string;
    };
  }): Promise<void> {
    await this.enterAppName(config.name);

    if (config.instances) await this.setInstances(config.instances);
    if (config.memory) await this.setMemory(config.memory);
    if (config.disk) await this.setDiskQuota(config.disk);
    if (config.buildpack) await this.selectBuildpack(config.buildpack);
    if (config.stack) await this.selectStack(config.stack);
    if (config.startCommand) await this.setStartCommand(config.startCommand);

    if (config.healthCheck) {
      await this.configureHealthCheck(
        config.healthCheck.type,
        config.healthCheck.endpoint
      );
    }
  }

  // ============================================
  // Stepper Navigation
  // ============================================

  /**
   * Click next button
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if next button is enabled
   */
  async canProceed(): Promise<boolean> {
    return await this.nextButton.isEnabled();
  }

  /**
   * Click create button
   */
  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  /**
   * Cancel wizard
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Get validation error message
   */
  async getValidationError(): Promise<string | null> {
    const isVisible = await this.validationError.isVisible().catch(() => false);
    return isVisible ? await this.validationError.textContent() : null;
  }

  /**
   * Check if form is valid
   */
  async isFormValid(): Promise<boolean> {
    return await this.canProceed();
  }

  /**
   * Check for specific validation errors
   */
  async hasValidationError(errorType: 'name' | 'duplicate' | 'quota' | 'buildpack'): Promise<boolean> {
    const error = await this.getValidationError();
    if (!error) return false;

    const errorLower = error.toLowerCase();
    switch (errorType) {
      case 'name':
        return errorLower.includes('name') && errorLower.includes('required');
      case 'duplicate':
        return errorLower.includes('already exists') || errorLower.includes('duplicate');
      case 'quota':
        return errorLower.includes('quota') || errorLower.includes('limit');
      case 'buildpack':
        return errorLower.includes('buildpack') && errorLower.includes('invalid');
      default:
        return false;
    }
  }

  // ============================================
  // Result Handling
  // ============================================

  /**
   * Wait for app creation to complete and navigate to app summary
   */
  async waitForCreationComplete(timeout: number = 30000): Promise<void> {
    await this.page.waitForURL(/.*\/applications\/.*\/summary.*/, { timeout });
  }

  /**
   * Get created app GUID from URL
   */
  async getCreatedAppGuid(): Promise<string | null> {
    const url = this.page.url();
    const match = url.match(/\/applications\/([^/]+)\/summary/);
    return match ? match[1] : null;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get current step index
   */
  async getCurrentStepIndex(): Promise<number> {
    const allSteps = this.stepper.locator('.mat-step-header');
    const count = await allSteps.count();

    for (let i = 0; i < count; i++) {
      const isActive = await allSteps.nth(i).getAttribute('aria-selected');
      if (isActive === 'true') return i;
    }

    return 0;
  }

  /**
   * Get step count
   */
  async getStepCount(): Promise<number> {
    const allSteps = this.stepper.locator('.mat-step-header');
    return await allSteps.count();
  }

  /**
   * Check if on create wizard
   */
  async isOnCreateWizard(): Promise<boolean> {
    return await this.stepper.isVisible().catch(() => false);
  }
}
