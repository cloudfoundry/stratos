import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Docker Deployment Stepper Page Object
 *
 * Handles Docker image deployment wizard
 *
 * Features:
 * - Docker image URL input
 * - Registry authentication
 * - Container configuration
 * - Environment variables
 * - Deployment progress
 */
export class DockerDeployStepperPage extends BasePage {
  private readonly stepper: Locator;

  constructor(page: Page) {
    super(page);
    this.stepper = page.locator('app-steppers, mat-horizontal-stepper');
  }

  // ============================================
  // Locators
  // ============================================

  private get dockerImageInput(): Locator {
    return this.page.locator('input[name="dockerImage"], input[placeholder*="Docker" i]');
  }

  private get registryUrlInput(): Locator {
    return this.page.locator('input[name="registryUrl"], input[placeholder*="Registry" i]');
  }

  private get registryUsernameInput(): Locator {
    return this.page.locator('input[name="registryUsername"], input[placeholder*="Username" i]');
  }

  private get registryPasswordInput(): Locator {
    return this.page.locator('input[name="registryPassword"], input[type="password"]');
  }

  private get requiresAuthCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"][name*="auth" i], mat-checkbox').filter({ hasText: /private|auth/i });
  }

  private get configurationForm(): Locator {
    return this.page.locator('form[name="dockerConfig"], app-docker-config-step form');
  }

  private get commandInput(): Locator {
    return this.configurationForm.locator('input[name="command"], input[placeholder*="Command" i]');
  }

  private get instancesInput(): Locator {
    return this.configurationForm.locator('input[name="instances"], input[formcontrolname="instances"]');
  }

  private get memoryInput(): Locator {
    return this.configurationForm.locator('input[name="memory"], input[formcontrolname="memory"]');
  }

  private get diskInput(): Locator {
    return this.configurationForm.locator('input[name="disk"], input[formcontrolname="diskQuota"]');
  }

  private get envVarSection(): Locator {
    return this.page.locator('.env-vars, app-env-var-editor');
  }

  private get addEnvVarButton(): Locator {
    return this.page.getByRole('button', { name: /add.*variable|add.*env/i });
  }

  private get healthCheckSection(): Locator {
    return this.page.locator('.health-check, app-health-check-config');
  }

  private get nextButton(): Locator {
    return this.page.getByRole('button', { name: /next|continue/i });
  }

  private get deployButton(): Locator {
    return this.page.getByRole('button', { name: /deploy/i });
  }

  private get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  private get validationError(): Locator {
    return this.page.locator('.mat-error, .error-message');
  }

  private get deploymentProgress(): Locator {
    return this.page.locator('.deploy-progress, mat-progress-bar');
  }

  // ============================================
  // Navigation
  // ============================================

  /**
   * Navigate to Docker deployment page
   */
  async navigateTo(cfGuid: string, spaceGuid?: string): Promise<void> {
    const url = spaceGuid
      ? `/applications/new/${cfGuid}/${spaceGuid}/docker`
      : `/applications/deploy/docker`;

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
  // Docker Image Configuration
  // ============================================

  /**
   * Enter Docker image URL
   */
  async enterDockerImage(imageUrl: string): Promise<void> {
    await this.dockerImageInput.fill(imageUrl);
    // Trigger validation
    await this.dockerImageInput.blur();
  }

  /**
   * Get Docker image URL
   */
  async getDockerImageUrl(): Promise<string> {
    return await this.dockerImageInput.inputValue();
  }

  /**
   * Validate Docker image format
   */
  async isValidImageFormat(): Promise<boolean> {
    const errorVisible = await this.validationError.isVisible().catch(() => false);
    return !errorVisible;
  }

  // ============================================
  // Registry Authentication
  // ============================================

  /**
   * Enable private registry authentication
   */
  async enablePrivateRegistry(): Promise<void> {
    const checkbox = this.requiresAuthCheckbox;
    const isChecked = await checkbox.isChecked().catch(() => false);

    if (!isChecked) {
      await checkbox.check();
    }
  }

  /**
   * Enter registry credentials
   */
  async enterRegistryCredentials(credentials: {
    url?: string;
    username: string;
    password: string;
  }): Promise<void> {
    await this.enablePrivateRegistry();

    if (credentials.url) {
      await this.registryUrlInput.fill(credentials.url);
    }

    await this.registryUsernameInput.fill(credentials.username);
    await this.registryPasswordInput.fill(credentials.password);
  }

  /**
   * Check if registry authentication is enabled
   */
  async isPrivateRegistryEnabled(): Promise<boolean> {
    return await this.registryUsernameInput.isVisible().catch(() => false);
  }

  // ============================================
  // Container Configuration
  // ============================================

  /**
   * Set container start command
   */
  async setStartCommand(command: string): Promise<void> {
    await this.commandInput.fill(command);
  }

  /**
   * Set number of instances
   */
  async setInstances(count: number): Promise<void> {
    await this.instancesInput.fill(count.toString());
  }

  /**
   * Set memory limit (MB)
   */
  async setMemory(memoryMB: number): Promise<void> {
    await this.memoryInput.fill(memoryMB.toString());
  }

  /**
   * Set disk quota (MB)
   */
  async setDiskQuota(diskMB: number): Promise<void> {
    await this.diskInput.fill(diskMB.toString());
  }

  /**
   * Fill complete container configuration
   */
  async fillContainerConfiguration(config: {
    command?: string;
    instances?: number;
    memory?: number;
    disk?: number;
  }): Promise<void> {
    if (config.command) await this.setStartCommand(config.command);
    if (config.instances) await this.setInstances(config.instances);
    if (config.memory) await this.setMemory(config.memory);
    if (config.disk) await this.setDiskQuota(config.disk);
  }

  // ============================================
  // Environment Variables
  // ============================================

  /**
   * Add environment variable
   */
  async addEnvironmentVariable(key: string, value: string): Promise<void> {
    // Check if add button is visible
    const addButtonVisible = await this.addEnvVarButton.isVisible().catch(() => false);

    if (addButtonVisible) {
      await this.addEnvVarButton.click();
    }

    // Find the last key/value input pair
    const keyInputs = this.envVarSection.locator('input[name*="key" i], input[placeholder*="name" i]');
    const valueInputs = this.envVarSection.locator('input[name*="value" i], input[placeholder*="value" i]');

    const count = await keyInputs.count();
    const lastIndex = count - 1;

    await keyInputs.nth(lastIndex).fill(key);
    await valueInputs.nth(lastIndex).fill(value);
  }

  /**
   * Set multiple environment variables
   */
  async setEnvironmentVariables(envVars: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(envVars)) {
      await this.addEnvironmentVariable(key, value);
    }
  }

  /**
   * Get environment variables count
   */
  async getEnvVarCount(): Promise<number> {
    const keyInputs = this.envVarSection.locator('input[name*="key" i]');
    return await keyInputs.count();
  }

  // ============================================
  // Health Checks
  // ============================================

  /**
   * Configure health check
   */
  async configureHealthCheck(config: {
    type?: 'port' | 'http' | 'process';
    endpoint?: string;
    timeout?: number;
  }): Promise<void> {
    const healthCheckVisible = await this.healthCheckSection.isVisible().catch(() => false);

    if (!healthCheckVisible) {
      return; // Health check section not available
    }

    if (config.type) {
      const typeSelect = this.healthCheckSection.locator('mat-select, select');
      await typeSelect.click();
      await this.page.getByRole('option', { name: config.type }).click();
    }

    if (config.endpoint && config.type === 'http') {
      const endpointInput = this.healthCheckSection.locator('input[name*="endpoint" i]');
      await endpointInput.fill(config.endpoint);
    }

    if (config.timeout) {
      const timeoutInput = this.healthCheckSection.locator('input[name*="timeout" i]');
      await timeoutInput.fill(config.timeout.toString());
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
   * Click deploy button
   */
  async clickDeploy(): Promise<void> {
    await this.deployButton.click();
  }

  /**
   * Cancel deployment
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // ============================================
  // Validation and Errors
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

  // ============================================
  // Deployment Monitoring
  // ============================================

  /**
   * Wait for deployment to complete
   */
  async waitForDeploymentComplete(timeout: number = 180000): Promise<void> {
    // Docker deployments can take longer due to image pulling
    await this.page.waitForURL(/.*\/applications\/.*\/summary.*/, { timeout });
  }

  /**
   * Check if deployment is in progress
   */
  async isDeploying(): Promise<boolean> {
    return await this.deploymentProgress.isVisible().catch(() => false);
  }

  /**
   * Get deployment status message
   */
  async getDeploymentStatus(): Promise<string> {
    const statusLocator = this.page.locator('.deploy-status, .deployment-status');
    return await statusLocator.textContent() || 'Unknown';
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
   * Check if on Docker deployment wizard
   */
  async isOnDockerDeploymentWizard(): Promise<boolean> {
    return await this.dockerImageInput.isVisible().catch(() => false);
  }
}
