import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * GitHub Deployment Stepper Page Object
 *
 * Handles GitHub-based application deployment wizard
 *
 * Features:
 * - GitHub OAuth connection
 * - Repository selection and filtering
 * - Branch selection
 * - Buildpack detection
 * - Deployment configuration
 * - Progress monitoring
 */
export class GitHubDeployStepperPage extends BasePage {
  private readonly stepper: Locator;

  constructor(page: Page) {
    super(page);
    this.stepper = page.locator('app-steppers, mat-horizontal-stepper');
  }

  // ============================================
  // Locators
  // ============================================

  private get githubConnectButton(): Locator {
    return this.page.getByRole('button', { name: /connect.*github|authorize.*github/i });
  }

  private get repositoryList(): Locator {
    return this.page.locator('app-list, mat-list').filter({ has: this.page.locator('[role="listitem"]') });
  }

  private get repositorySearchInput(): Locator {
    return this.page.locator('input[placeholder*="Search" i], input[placeholder*="Filter" i]').first();
  }

  private get branchSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Branch" i], select[name="branch"]');
  }

  private get buildpackSelect(): Locator {
    return this.page.locator('mat-select[placeholder*="Buildpack" i], select[name="buildpack"]');
  }

  private get deploymentOptionsForm(): Locator {
    return this.page.locator('form[name="deployOptions"], app-deploy-application-options-step form');
  }

  private get instancesInput(): Locator {
    return this.deploymentOptionsForm.locator('input[name="instances"], input[formcontrolname="instances"]');
  }

  private get memoryInput(): Locator {
    return this.deploymentOptionsForm.locator('input[name="memory"], input[formcontrolname="memory"]');
  }

  private get diskInput(): Locator {
    return this.deploymentOptionsForm.locator('input[name="disk"], input[formcontrolname="diskQuota"]');
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

  private get deploymentProgress(): Locator {
    return this.page.locator('.deploy-progress, app-deploy-progress, mat-progress-bar');
  }

  private get deploymentStatus(): Locator {
    return this.page.locator('.deploy-status, .deployment-status');
  }

  private get errorMessage(): Locator {
    return this.page.locator('.error-message, .mat-error, app-error-message');
  }

  // ============================================
  // Navigation
  // ============================================

  /**
   * Navigate to GitHub deployment page
   */
  async navigateTo(cfGuid: string, spaceGuid?: string): Promise<void> {
    const url = spaceGuid
      ? `/applications/new/${cfGuid}/${spaceGuid}/github`
      : `/applications/deploy/github`;

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
  // GitHub OAuth
  // ============================================

  /**
   * Check if GitHub is connected
   */
  async isGitHubConnected(): Promise<boolean> {
    const connectButton = this.githubConnectButton;
    return !(await connectButton.isVisible().catch(() => false));
  }

  /**
   * Click connect GitHub button
   * Note: This will open OAuth flow which cannot be automated without credentials
   */
  async clickConnectGitHub(): Promise<void> {
    await this.githubConnectButton.click();
  }

  /**
   * Wait for GitHub connection to complete
   */
  async waitForGitHubConnection(timeout: number = 30000): Promise<void> {
    await this.page.waitForURL(/.*github.*connected.*/, { timeout });
  }

  // ============================================
  // Repository Selection
  // ============================================

  /**
   * Search repositories by name
   */
  async searchRepositories(searchTerm: string): Promise<void> {
    await this.repositorySearchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Debounce search
  }

  /**
   * Get list of visible repositories
   */
  async getRepositoryNames(): Promise<string[]> {
    const items = this.repositoryList.locator('[role="listitem"]');
    const count = await items.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) names.push(text.trim());
    }

    return names;
  }

  /**
   * Select repository by name
   */
  async selectRepository(repoName: string): Promise<void> {
    const repo = this.repositoryList
      .locator('[role="listitem"]')
      .filter({ hasText: repoName });

    await repo.click();
  }

  /**
   * Check if repository list is visible
   */
  async hasRepositories(): Promise<boolean> {
    const items = this.repositoryList.locator('[role="listitem"]');
    const count = await items.count();
    return count > 0;
  }

  // ============================================
  // Branch Selection
  // ============================================

  /**
   * Select branch by name
   */
  async selectBranch(branchName: string): Promise<void> {
    await this.branchSelect.click();
    await this.page.getByRole('option', { name: branchName }).click();
  }

  /**
   * Get list of available branches
   */
  async getBranches(): Promise<string[]> {
    await this.branchSelect.click();
    const options = this.page.locator('mat-option, option');
    const count = await options.count();
    const branches: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) branches.push(text.trim());
    }

    // Close dropdown
    await this.page.keyboard.press('Escape');

    return branches;
  }

  // ============================================
  // Buildpack Selection
  // ============================================

  /**
   * Select buildpack by name
   */
  async selectBuildpack(buildpackName: string): Promise<void> {
    await this.buildpackSelect.click();
    await this.page.getByRole('option', { name: new RegExp(buildpackName, 'i') }).click();
  }

  /**
   * Get detected buildpack
   */
  async getDetectedBuildpack(): Promise<string | null> {
    const detected = this.page.locator('.detected-buildpack, .buildpack-auto');
    return await detected.textContent().catch((): string | null => null);
  }

  // ============================================
  // Deployment Configuration
  // ============================================

  /**
   * Set number of instances
   */
  async setInstances(count: number): Promise<void> {
    await this.instancesInput.fill(count.toString());
  }

  /**
   * Set memory allocation (MB)
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
   * Fill deployment options form
   */
  async fillDeploymentOptions(options: {
    instances?: number;
    memory?: number;
    disk?: number;
    buildpack?: string;
  }): Promise<void> {
    if (options.instances) await this.setInstances(options.instances);
    if (options.memory) await this.setMemory(options.memory);
    if (options.disk) await this.setDiskQuota(options.disk);
    if (options.buildpack) await this.selectBuildpack(options.buildpack);
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
  // Deployment Monitoring
  // ============================================

  /**
   * Wait for deployment to complete
   */
  async waitForDeploymentComplete(timeout: number = 120000): Promise<void> {
    await this.page.waitForURL(/.*\/applications\/.*\/summary.*/, { timeout });
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(): Promise<string> {
    return await this.deploymentStatus.textContent() || 'Unknown';
  }

  /**
   * Check if deployment is in progress
   */
  async isDeploying(): Promise<boolean> {
    return await this.deploymentProgress.isVisible().catch(() => false);
  }

  /**
   * Get error message if deployment failed
   */
  async getErrorMessage(): Promise<string | null> {
    const isVisible = await this.errorMessage.isVisible().catch(() => false);
    return isVisible ? await this.errorMessage.textContent() : null;
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Check if on deployment wizard
   */
  async isOnDeploymentWizard(): Promise<boolean> {
    return await this.stepper.isVisible().catch(() => false);
  }

  /**
   * Get current step index
   */
  async getCurrentStepIndex(): Promise<number> {
    const activeStep = this.stepper.locator('.mat-step-header[aria-selected="true"]');
    const allSteps = this.stepper.locator('.mat-step-header');
    const count = await allSteps.count();

    for (let i = 0; i < count; i++) {
      const isActive = await allSteps.nth(i).getAttribute('aria-selected');
      if (isActive === 'true') return i;
    }

    return 0;
  }
}
