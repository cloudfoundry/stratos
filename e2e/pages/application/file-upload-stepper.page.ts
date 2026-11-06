import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * File Upload Deployment Stepper Page Object
 *
 * Handles local file upload deployment wizard
 *
 * Features:
 * - File selection (ZIP/TAR.GZ)
 * - File upload progress
 * - Manifest parsing
 * - Deployment configuration
 * - Upload validation
 */
export class FileUploadStepperPage extends BasePage {
  private readonly stepper: Locator;

  constructor(page: Page) {
    super(page);
    this.stepper = page.locator('app-steppers, mat-horizontal-stepper');
  }

  // ============================================
  // Locators
  // ============================================

  private get fileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  private get fileSelectButton(): Locator {
    return this.page.getByRole('button', { name: /select.*file|choose.*file|browse/i });
  }

  private get selectedFileName(): Locator {
    return this.page.locator('.selected-file, .file-name');
  }

  private get uploadProgress(): Locator {
    return this.page.locator('mat-progress-bar, .upload-progress');
  }

  private get uploadStatus(): Locator {
    return this.page.locator('.upload-status, .file-upload-status');
  }

  private get manifestSection(): Locator {
    return this.page.locator('.manifest-section, app-manifest-editor');
  }

  private get manifestTextArea(): Locator {
    return this.manifestSection.locator('textarea[name="manifest"], textarea[placeholder*="manifest" i]');
  }

  private get useManifestCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"]').filter({ hasText: /use.*manifest/i });
  }

  private get overrideManifestCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"]').filter({ hasText: /override.*manifest/i });
  }

  private get configurationForm(): Locator {
    return this.page.locator('form[name="uploadConfig"], app-upload-config-step form');
  }

  private get buildpackSelect(): Locator {
    return this.configurationForm.locator('mat-select[placeholder*="Buildpack" i], select[name="buildpack"]');
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

  private get startCommandInput(): Locator {
    return this.configurationForm.locator('input[name="command"], input[placeholder*="start command" i]');
  }

  private get nextButton(): Locator {
    return this.page.getByRole('button', { name: /next|continue/i });
  }

  private get uploadButton(): Locator {
    return this.page.getByRole('button', { name: /upload|deploy/i });
  }

  private get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  private get validationError(): Locator {
    return this.page.locator('.mat-error, .error-message, .validation-error');
  }

  // ============================================
  // Navigation
  // ============================================

  /**
   * Navigate to file upload deployment page
   */
  async navigateTo(cfGuid: string, spaceGuid?: string): Promise<void> {
    const url = spaceGuid
      ? `/applications/new/${cfGuid}/${spaceGuid}/upload`
      : `/applications/deploy/upload`;

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
  // File Selection and Upload
  // ============================================

  /**
   * Select file for upload
   * Note: In tests, use page.setInputFiles() directly on the file input
   */
  async selectFile(filePath: string): Promise<void> {
    // Set the file directly on the input element
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Get selected file name
   */
  async getSelectedFileName(): Promise<string | null> {
    const isVisible = await this.selectedFileName.isVisible().catch(() => false);
    return isVisible ? await this.selectedFileName.textContent() : null;
  }

  /**
   * Check if file is selected
   */
  async hasFileSelected(): Promise<boolean> {
    const fileName = await this.getSelectedFileName();
    return fileName !== null && fileName.length > 0;
  }

  /**
   * Validate file format (ZIP or TAR.GZ)
   */
  async isValidFileFormat(): Promise<boolean> {
    const error = await this.getValidationError();
    return error === null || !error.toLowerCase().includes('format');
  }

  // ============================================
  // Upload Progress
  // ============================================

  /**
   * Check if upload is in progress
   */
  async isUploading(): Promise<boolean> {
    return await this.uploadProgress.isVisible().catch(() => false);
  }

  /**
   * Get upload status
   */
  async getUploadStatus(): Promise<string> {
    const isVisible = await this.uploadStatus.isVisible().catch(() => false);
    return isVisible ? await this.uploadStatus.textContent() || 'Unknown' : 'Not Started';
  }

  /**
   * Wait for upload to complete
   */
  async waitForUploadComplete(timeout: number = 60000): Promise<void> {
    // Wait for progress bar to disappear
    await this.uploadProgress.waitFor({ state: 'hidden', timeout });
  }

  // ============================================
  // Manifest Handling
  // ============================================

  /**
   * Check if manifest was detected in archive
   */
  async hasManifestDetected(): Promise<boolean> {
    return await this.manifestSection.isVisible().catch(() => false);
  }

  /**
   * Get manifest content
   */
  async getManifestContent(): Promise<string | null> {
    const isVisible = await this.manifestTextArea.isVisible().catch(() => false);
    return isVisible ? await this.manifestTextArea.inputValue() : null;
  }

  /**
   * Enable using manifest from archive
   */
  async enableUseManifest(): Promise<void> {
    const checkbox = this.useManifestCheckbox;
    const isChecked = await checkbox.isChecked().catch(() => false);

    if (!isChecked) {
      await checkbox.check();
    }
  }

  /**
   * Disable using manifest
   */
  async disableUseManifest(): Promise<void> {
    const checkbox = this.useManifestCheckbox;
    const isChecked = await checkbox.isChecked().catch(() => false);

    if (isChecked) {
      await checkbox.uncheck();
    }
  }

  /**
   * Enable manifest override
   */
  async enableManifestOverride(): Promise<void> {
    const checkbox = this.overrideManifestCheckbox;
    const isChecked = await checkbox.isChecked().catch(() => false);

    if (!isChecked) {
      await checkbox.check();
    }
  }

  /**
   * Edit manifest content
   */
  async editManifest(content: string): Promise<void> {
    await this.enableManifestOverride();
    await this.manifestTextArea.fill(content);
  }

  // ============================================
  // Deployment Configuration
  // ============================================

  /**
   * Select buildpack
   */
  async selectBuildpack(buildpackName: string): Promise<void> {
    await this.buildpackSelect.click();
    await this.page.getByRole('option', { name: new RegExp(buildpackName, 'i') }).click();
  }

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
   * Set start command
   */
  async setStartCommand(command: string): Promise<void> {
    await this.startCommandInput.fill(command);
  }

  /**
   * Fill complete deployment configuration
   */
  async fillDeploymentConfiguration(config: {
    buildpack?: string;
    instances?: number;
    memory?: number;
    disk?: number;
    startCommand?: string;
  }): Promise<void> {
    if (config.buildpack) await this.selectBuildpack(config.buildpack);
    if (config.instances) await this.setInstances(config.instances);
    if (config.memory) await this.setMemory(config.memory);
    if (config.disk) await this.setDiskQuota(config.disk);
    if (config.startCommand) await this.setStartCommand(config.startCommand);
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
   * Click upload/deploy button
   */
  async clickUpload(): Promise<void> {
    await this.uploadButton.click();
  }

  /**
   * Cancel upload
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

  /**
   * Check for specific error types
   */
  async hasError(errorType: 'format' | 'size' | 'upload' | 'staging'): Promise<boolean> {
    const error = await this.getValidationError();
    if (!error) return false;

    const errorLower = error.toLowerCase();
    switch (errorType) {
      case 'format':
        return errorLower.includes('format') || errorLower.includes('type');
      case 'size':
        return errorLower.includes('size') || errorLower.includes('large');
      case 'upload':
        return errorLower.includes('upload') || errorLower.includes('failed');
      case 'staging':
        return errorLower.includes('staging') || errorLower.includes('stage');
      default:
        return false;
    }
  }

  // ============================================
  // Deployment Monitoring
  // ============================================

  /**
   * Wait for deployment to complete
   */
  async waitForDeploymentComplete(timeout: number = 180000): Promise<void> {
    // Upload + staging can take longer
    await this.page.waitForURL(/.*\/applications\/.*\/summary.*/, { timeout });
  }

  /**
   * Get deployment status message
   */
  async getDeploymentStatus(): Promise<string> {
    const statusLocator = this.page.locator('.deploy-status, .deployment-status');
    const isVisible = await statusLocator.isVisible().catch(() => false);
    return isVisible ? await statusLocator.textContent() || 'Unknown' : 'Unknown';
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
   * Check if on file upload wizard
   */
  async isOnFileUploadWizard(): Promise<boolean> {
    return await this.fileInput.isVisible().catch(() => false);
  }
}
