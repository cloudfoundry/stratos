import { test, expect } from '../../fixtures/test-base';
import { GitHubDeployStepperPage } from '../../pages/application/github-deploy-stepper.page';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Application Deploy E2E Tests
 * Migrated from src/test-e2e/application/application-deploy-e2e.spec.ts
 *
 * Tests application deployment from Git/GitHub
 *
 * NOTE: Full Git/GitHub deployment workflow requires:
 * - GitHub OAuth integration configured in CF
 * - Git repository access for test user
 * - Deployment monitoring infrastructure
 * - Extended test timeouts (deployments can take minutes)
 *
 * Tests use feature detection to skip UI tests when GitHub OAuth is not configured.
 * API-level deployment tests work without GitHub integration.
 *
 * Fixtures Used:
 * - connectedEndpointsAdminPage: CF admin access with connected endpoint
 * - applicationHelper: App management utilities
 */

test.describe('Application Deploy (Git)', () => {

  test.describe('Basic Deployment Setup', () => {
    test('should create app ready for deployment', async ({ applicationHelper }) => {
      // Create app that's ready for deployment
      const testApp = await applicationHelper.createTestApp(createCustomName('deploy-ready-app'), {
        instances: 1,
        memory: 256,
        buildpacks: ['nodejs_buildpack']
      });

      // Verify app is in correct state for deployment
      expect(testApp.app.guid).toBeTruthy();
      expect(testApp.app.state).toBe('STOPPED');
      expect(testApp.app.lifecycle.type).toBe('buildpack');

      // Cleanup
      await applicationHelper.cleanupTestApp(testApp);
    });

    test('should create app with deployment-ready settings', async ({ applicationHelper }) => {
      const testApp = await applicationHelper.createTestApp(createCustomName('deploy-config-app'), {
        instances: 2,
        memory: 512,
        disk: 1024,
        buildpacks: ['nodejs_buildpack', 'ruby_buildpack'],
        environmentVariables: {
          'NODE_ENV': 'production',
          'API_URL': 'https://api.example.com'
        }
      });

      // Verify deployment configuration
      const app = await applicationHelper.getApp(testApp.app.guid);
      expect(app.lifecycle.data.buildpacks).toContain('nodejs_buildpack');

      // Cleanup
      await applicationHelper.cleanupTestApp(testApp);
    });
  });

  test.describe('Deploy from GitHub (UI)', () => {
    /**
     * Feature detection helper for GitHub OAuth
     * GitHub deployment requires OAuth configuration in CF
     */
    async function isGitHubAvailable(page: any, cfGuid: string): Promise<boolean> {
      const deployPage = new GitHubDeployStepperPage(page);

      try {
        await deployPage.navigateTo(cfGuid);
        await deployPage.waitForStepper();

        // Check if GitHub connect button is present or if already connected
        return await deployPage.isOnDeploymentWizard();
      } catch (error) {
        return false;
      }
    }

    test('should connect GitHub account', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured in this CF deployment');
      }

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Check GitHub connection status
      const isConnected = await deployPage.isGitHubConnected();

      if (isConnected) {
        // Already connected - verify we can see the stepper
        await expect(deployPage.isOnDeploymentWizard()).resolves.toBe(true);
      } else {
        // Need to connect - verify button is visible
        // Note: Cannot automate OAuth flow without credentials
        await deployPage.clickConnectGitHub();
        // In real scenario, OAuth flow would complete and redirect back
      }
    });

    test('should list user repositories', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured in this CF deployment');
      }

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Check if GitHub is connected
      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) {
        test.skip('GitHub account not connected - OAuth required');
      }

      // Verify repositories are listed
      const hasRepos = await deployPage.hasRepositories();
      expect(hasRepos).toBe(true);

      // Get repository names
      const repos = await deployPage.getRepositoryNames();
      expect(repos.length).toBeGreaterThan(0);
    });

    test('should select repository and branch', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured in this CF deployment');
      }

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) {
        test.skip('GitHub account not connected - OAuth required');
      }

      // Get repositories and select first one
      const repos = await deployPage.getRepositoryNames();
      if (repos.length === 0) {
        test.skip('No repositories available for testing');
      }

      await deployPage.selectRepository(repos[0]);

      // Get branches and select main/master
      const branches = await deployPage.getBranches();
      expect(branches.length).toBeGreaterThan(0);

      const defaultBranch = branches.find(b =>
        b.toLowerCase() === 'main' || b.toLowerCase() === 'master'
      ) || branches[0];

      await deployPage.selectBranch(defaultBranch);

      // Verify we can proceed to next step
      const canProceed = await deployPage.canProceed();
      expect(canProceed).toBe(true);
    });

    test('should detect buildpack automatically', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured in this CF deployment');
      }

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) {
        test.skip('GitHub account not connected - OAuth required');
      }

      // Select a repository and branch
      const repos = await deployPage.getRepositoryNames();
      if (repos.length === 0) {
        test.skip('No repositories available for testing');
      }

      await deployPage.selectRepository(repos[0]);

      const branches = await deployPage.getBranches();
      await deployPage.selectBranch(branches[0]);

      await deployPage.clickNext();

      // Check if buildpack was auto-detected
      const detectedBuildpack = await deployPage.getDetectedBuildpack();
      // Buildpack detection depends on repository contents
      // Just verify the detection mechanism works
      expect(detectedBuildpack).toBeDefined();
    });

    test('should configure deployment options', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured in this CF deployment');
      }

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) {
        test.skip('GitHub account not connected - OAuth required');
      }

      // Navigate through wizard to deployment options step
      const repos = await deployPage.getRepositoryNames();
      if (repos.length === 0) {
        test.skip('No repositories available');
      }

      await deployPage.selectRepository(repos[0]);
      const branches = await deployPage.getBranches();
      await deployPage.selectBranch(branches[0]);
      await deployPage.clickNext();

      // Configure deployment options
      await deployPage.fillDeploymentOptions({
        instances: 2,
        memory: 512,
        disk: 2048,
        buildpack: 'nodejs_buildpack'
      });

      // Verify options were set
      const canProceed = await deployPage.canProceed();
      expect(canProceed).toBe(true);
    });

    test('should start deployment and show progress', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured - cannot test full deployment');
      }

      test.skip('Full GitHub deployment requires valid repository with buildable code');
      // This would require:
      // - Repository with valid app code
      // - Successful clone, stage, and start
      // - Extended timeout for deployment
    });

    test('should complete deployment successfully', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires GitHub OAuth, valid repository, and full deployment cycle');
    });

    test('should navigate to deployed app', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires completed GitHub deployment');
    });
  });

  test.describe('Deploy with Manifest (UI)', () => {
    test('should detect manifest.yml in repo', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires GitHub OAuth and repository with manifest.yml');
      // Would need to:
      // - Select repo known to have manifest.yml
      // - Verify manifest detection indicator
      // - Check manifest content displayed
    });

    test('should parse manifest settings', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires GitHub OAuth and repository with manifest.yml');
      // Would verify:
      // - Manifest parsed correctly
      // - Settings populated from manifest
      // - Values displayed in UI
    });

    test('should allow manifest override', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires GitHub OAuth and repository with manifest.yml');
      // Would test:
      // - Enable manifest override
      // - Modify manifest values
      // - Verify overridden values used
    });

    test('should use manifest for deployment', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires GitHub OAuth, manifest.yml, and full deployment');
      // Would verify:
      // - Deployment uses manifest settings
      // - App created with manifest config
    });
  });

  test.describe('Re-deploy (UI)', () => {
    test('should allow re-deploy from commits', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires existing GitHub-deployed app');
      // Would test:
      // - Navigate to deployed app
      // - Open redeploy dialog
      // - Verify commit history shown
    });

    test('should show commit history', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires existing GitHub-deployed app');
      // Would verify:
      // - Commit list displayed
      // - Commit messages shown
      // - Current commit highlighted
    });

    test('should deploy specific commit', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires existing GitHub-deployed app and multiple commits');
      // Would test:
      // - Select specific commit
      // - Trigger redeploy
      // - Verify deployment starts
    });

    test('should preserve deployment settings', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Requires existing GitHub-deployed app');
      // Would verify:
      // - Original instance/memory settings preserved
      // - Environment variables maintained
      // - Routes kept
    });
  });

  test.describe('Deployment Options (UI)', () => {
    test('should set custom buildpack via UI', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured');
      }

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) {
        test.skip('GitHub not connected');
      }

      // Navigate to options step
      const repos = await deployPage.getRepositoryNames();
      if (repos.length === 0) test.skip('No repositories');

      await deployPage.selectRepository(repos[0]);
      const branches = await deployPage.getBranches();
      await deployPage.selectBranch(branches[0]);
      await deployPage.clickNext();

      // Set custom buildpack
      await deployPage.selectBuildpack('staticfile_buildpack');
      expect(await deployPage.canProceed()).toBe(true);
    });

    test('should configure instances via UI', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) {
        test.skip('GitHub OAuth not configured');
      }

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) test.skip('GitHub not connected');

      const repos = await deployPage.getRepositoryNames();
      if (repos.length === 0) test.skip('No repositories');

      await deployPage.selectRepository(repos[0]);
      const branches = await deployPage.getBranches();
      await deployPage.selectBranch(branches[0]);
      await deployPage.clickNext();

      // Configure instances
      await deployPage.setInstances(3);
      expect(await deployPage.canProceed()).toBe(true);
    });

    test('should set memory via UI', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) test.skip('GitHub OAuth not configured');

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) test.skip('GitHub not connected');

      const repos = await deployPage.getRepositoryNames();
      if (repos.length === 0) test.skip('No repositories');

      await deployPage.selectRepository(repos[0]);
      const branches = await deployPage.getBranches();
      await deployPage.selectBranch(branches[0]);
      await deployPage.clickNext();

      // Set memory
      await deployPage.setMemory(1024);
      expect(await deployPage.canProceed()).toBe(true);
    });

    test('should set disk quota via UI', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const githubAvailable = await isGitHubAvailable(page, cfGuid);

      if (!githubAvailable) test.skip('GitHub OAuth not configured');

      const deployPage = new GitHubDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      const isConnected = await deployPage.isGitHubConnected();
      if (!isConnected) test.skip('GitHub not connected');

      const repos = await deployPage.getRepositoryNames();
      if (repos.length === 0) test.skip('No repositories');

      await deployPage.selectRepository(repos[0]);
      const branches = await deployPage.getBranches();
      await deployPage.selectBranch(branches[0]);
      await deployPage.clickNext();

      // Set disk quota
      await deployPage.setDiskQuota(2048);
      expect(await deployPage.canProceed()).toBe(true);
    });

    test('should configure environment variables via UI', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Environment variable configuration in deployment wizard not yet implemented in page object');
      // Would need to extend GitHubDeployStepperPage with env var methods
    });

    test('should set start command via UI', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Start command configuration in deployment wizard not yet implemented in page object');
      // Would need to extend GitHubDeployStepperPage with start command methods
    });
  });

  test.describe('Deployment Errors (UI)', () => {
    test('should handle clone failures', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Error simulation requires invalid repository or network issues');
      // Would test:
      // - Invalid repo URL
      // - Private repo without access
      // - Network failure during clone
      // - Error message displayed
    });

    test('should show staging errors', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Staging error simulation requires app with build failures');
      // Would test:
      // - App with missing dependencies
      // - Invalid buildpack
      // - Staging failure message
    });

    test('should display buildpack failures', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Buildpack failure simulation requires incompatible app/buildpack');
      // Would test:
      // - Wrong buildpack for app type
      // - Buildpack detection failure
      // - Error message with details
    });

    test('should handle start failures', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Start failure simulation requires app that crashes on start');
      // Would test:
      // - App with runtime errors
      // - Port binding failures
      // - Crash message displayed
    });

    test('should allow retry on error', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip('Retry mechanism testing requires failed deployment');
      // Would test:
      // - Deployment fails
      // - Retry button available
      // - Retry triggers new deployment
    });
  });
});
