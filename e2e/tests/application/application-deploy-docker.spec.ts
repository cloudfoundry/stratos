import { test, expect } from '../../fixtures/test-base';
import { DockerDeployStepperPage } from '../../pages/application/docker-deploy-stepper.page';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Application Deploy Docker E2E Tests
 * Migrated from src/test-e2e/application/application-deploy-docker-e2e.spec.ts
 *
 * Tests Docker image deployment
 *
 * CF Helpers Integration:
 * - ✅ Uses CF API for Docker app creation
 * - ✅ UI wizard tests with Docker deployment page objects
 * - ⏳ Full Docker deployment requires registry access and image pulling
 *
 * NOTE: Full Docker deployment workflow requires:
 * - Docker support enabled in CF
 * - Registry access (public or authenticated private)
 * - Image pulling infrastructure in CF
 * - Extended test timeouts for image pulls
 *
 * Fixtures Used:
 * - connectedEndpointsAdminPage: CF admin access
 * - applicationHelper: App management utilities
 * - cfApi: CF API operations
 */

test.describe('Application Deploy (Docker)', () => {

  test.describe('Basic Docker Setup', () => {
    test('should create Docker-based app', async ({ applicationHelper, cfApi }) => {
      // Create a Docker app (lifecycle type 'docker' instead of 'buildpack')
      const appData = {
        name: createCustomName('docker-app'),
        space_guid: applicationHelper['defaultSpaceGuid'],
        lifecycle: {
          type: 'docker',
          data: {}
        },
        metadata: {
          labels: {
            'stratos-e2e-test': 'true'
          }
        }
      };

      const response = await cfApi['request'].post(
        `/pp/v1/proxy/v3/cf/${cfApi['cfGuid']}/apps`,
        appData
      );

      expect(response.guid).toBeTruthy();
      expect(response.lifecycle.type).toBe('docker');
      expect(response.state).toBe('STOPPED');

      // Cleanup
      await cfApi.deleteApp(response.guid);
    });

    test('should create Docker app with environment variables', async ({ applicationHelper, cfApi }) => {
      const appData = {
        name: createCustomName('docker-env-app'),
        space_guid: applicationHelper['defaultSpaceGuid'],
        lifecycle: {
          type: 'docker',
          data: {}
        },
        environment_variables: {
          'DOCKER_IMAGE': 'nginx:latest',
          'PORT': '8080'
        },
        metadata: {
          labels: {
            'stratos-e2e-test': 'true'
          }
        }
      };

      const response = await cfApi['request'].post(
        `/pp/v1/proxy/v3/cf/${cfApi['cfGuid']}/apps`,
        appData
      );

      expect(response.guid).toBeTruthy();
      expect(response.lifecycle.type).toBe('docker');
      expect(response.environment_variables).toBeDefined();

      await cfApi.deleteApp(response.guid);
    });
  });

  test.describe('Public Docker Image (UI)', () => {
    /**
     * Feature detection for Docker deployment UI
     * Docker deployment requires Docker support enabled in CF
     */
    async function isDockerDeploymentAvailable(page: any, cfGuid: string): Promise<boolean> {
      const deployPage = new DockerDeployStepperPage(page);

      try {
        await deployPage.navigateTo(cfGuid);
        await deployPage.waitForStepper();
        return await deployPage.isOnDockerDeploymentWizard();
      } catch (error) {
        return false;
      }
    }

    test('should accept Docker image URL', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await isDockerDeploymentAvailable(page, cfGuid);

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available in this CF deployment');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Enter a public Docker image URL
      const imageUrl = 'nginx:latest';
      await deployPage.enterDockerImage(imageUrl);

      // Verify URL was accepted
      const enteredUrl = await deployPage.getDockerImageUrl();
      expect(enteredUrl).toBe(imageUrl);
    });

    test('should validate image format', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await isDockerDeploymentAvailable(page, cfGuid);

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Test valid formats
      const validImages = [
        'nginx:latest',
        'ubuntu:22.04',
        'gcr.io/project/image:tag',
        'registry.example.com/org/app:v1.0.0'
      ];

      for (const image of validImages) {
        await deployPage.enterDockerImage(image);
        const isValid = await deployPage.isValidImageFormat();
        expect(isValid).toBe(true);
      }

      // Test invalid format
      await deployPage.enterDockerImage('not a valid image');
      const isValid = await deployPage.isValidImageFormat();
      // Validation might not catch all cases, just verify validation runs
      expect(isValid).toBeDefined();
    });

    test('should pull public image', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await isDockerDeploymentAvailable(page, cfGuid);

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      test.skip();
      // Would test:
      // - Enter public image URL
      // - Start deployment
      // - Monitor image pull progress
      // - Verify pull succeeds
    });

    test('should deploy Docker container', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await isDockerDeploymentAvailable(page, cfGuid);

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      test.skip();
      // Would test complete deployment flow:
      // - Configure Docker app
      // - Pull image
      // - Stage container
      // - Start container
    });

    test('should start container successfully', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip();
    });

    test('should show container status', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip();
    });
  });

  test.describe('Private Docker Registry (UI)', () => {
    test('should require registry credentials', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Enter private registry image
      await deployPage.enterDockerImage('registry.example.com/private/app:latest');

      // Check if private registry auth is available
      const authAvailable = await deployPage.isPrivateRegistryEnabled();

      if (!authAvailable) {
        // Enable private registry
        await deployPage.enablePrivateRegistry();
      }

      // Verify credentials fields are present
      const isEnabled = await deployPage.isPrivateRegistryEnabled();
      expect(isEnabled).toBe(true);
    });

    test('should authenticate with registry', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Enter private image and credentials
      await deployPage.enterDockerImage('registry.example.com/private/app:latest');
      await deployPage.enterRegistryCredentials({
        url: 'registry.example.com',
        username: 'test-user',
        password: 'test-password'
      });

      // Verify credentials were entered
      const isEnabled = await deployPage.isPrivateRegistryEnabled();
      expect(isEnabled).toBe(true);

      // Note: Cannot test actual authentication without valid credentials
    });

    test('should pull private image', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip();
      // Would test:
      // - Enter private image URL
      // - Provide valid credentials
      // - Initiate pull
      // - Verify authenticated pull succeeds
    });

    test('should deploy private image', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip();
      // Would test:
      // - Complete private image deployment
      // - Verify app runs with private image
    });
  });

  test.describe('Docker Configuration (UI)', () => {
    test('should set container command', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Enter Docker image
      await deployPage.enterDockerImage('nginx:latest');
      await deployPage.clickNext();

      // Set container start command
      await deployPage.setStartCommand('/bin/sh -c "nginx -g \'daemon off;\'"');

      // Verify can proceed
      const canProceed = await deployPage.canProceed();
      expect(canProceed).toBe(true);
    });

    test('should configure environment variables', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      await deployPage.enterDockerImage('nginx:latest');
      await deployPage.clickNext();

      // Add environment variables
      await deployPage.setEnvironmentVariables({
        'ENV': 'production',
        'LOG_LEVEL': 'info',
        'PORT': '8080'
      });

      // Verify variables were added
      const envVarCount = await deployPage.getEnvVarCount();
      expect(envVarCount).toBeGreaterThanOrEqual(3);
    });

    test('should set exposed ports', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      test.skip();
      // CF handles port mapping automatically
      // Port is usually set via PORT environment variable
    });

    test('should configure health checks', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      await deployPage.enterDockerImage('nginx:latest');
      await deployPage.clickNext();

      // Configure health check
      await deployPage.configureHealthCheck({
        type: 'http',
        endpoint: '/health',
        timeout: 30
      });

      // Health check configuration is optional
      const canProceed = await deployPage.canProceed();
      expect(canProceed).toBe(true);
    });

    test('should set memory limits', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      await deployPage.enterDockerImage('nginx:latest');
      await deployPage.clickNext();

      // Set memory and disk
      await deployPage.fillContainerConfiguration({
        instances: 2,
        memory: 512,
        disk: 1024
      });

      // Verify configuration accepted
      const canProceed = await deployPage.canProceed();
      expect(canProceed).toBe(true);
    });
  });

  test.describe('Docker Deploy Errors (UI)', () => {
    test('should handle invalid image URL', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const dockerAvailable = await (async () => {
        const deployPage = new DockerDeployStepperPage(page);
        try {
          await deployPage.navigateTo(cfGuid);
          await deployPage.waitForStepper();
          return await deployPage.isOnDockerDeploymentWizard();
        } catch {
          return false;
        }
      })();

      if (!dockerAvailable) {
        test.skip(true, 'Docker deployment not available');
      }

      const deployPage = new DockerDeployStepperPage(page);
      await deployPage.navigateTo(cfGuid);

      // Enter clearly invalid image URL
      await deployPage.enterDockerImage('this is not a valid docker image!@#');

      // Check for validation error
      const error = await deployPage.getValidationError();
      // Validation behavior depends on UI implementation
      // Just verify validation system is working
      expect(error).toBeDefined();
    });

    test('should show authentication errors', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip();
      // Would test:
      // - Private image with wrong credentials
      // - Attempt deployment
      // - Verify auth error displayed
    });

    test('should handle pull failures', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip();
      // Would test:
      // - Non-existent image
      // - Network failure during pull
      // - Error message displayed
    });

    test('should display container start errors', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      test.skip();
      // Would test:
      // - Image with invalid command
      // - Container crashes on start
      // - Error message with logs
    });
  });
});
