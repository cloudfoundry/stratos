import { test, expect } from '../../fixtures/test-base';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Application Deploy Docker E2E Tests
 *
 * Live coverage: the CF API path for creating Docker-lifecycle apps (via the
 * Stratos passthrough proxy). The UI wizard portion is deferred — see the
 * skipped block at the bottom for why.
 */

test.describe('Application Deploy (Docker)', () => {

  test.describe('Basic Docker Setup', () => {
    // Docker apps are a per-foundation opt-in: CF answers 403
    // CF-FeatureDisabled to every docker create while diego_docker is off.
    // Turn it on for each test and put it back after; serial keeps the flag
    // in one worker's hands.
    test.describe.configure({ mode: 'serial' });
    let dockerWasEnabled = true;

    test.beforeEach(async ({ cfApi }) => {
      dockerWasEnabled = await cfApi.isFeatureFlagEnabled('diego_docker');
      if (!dockerWasEnabled) {
        await cfApi.setFeatureFlag('diego_docker', true);
      }
    });

    test.afterEach(async ({ cfApi }) => {
      if (!dockerWasEnabled) {
        await cfApi.setFeatureFlag('diego_docker', false);
      }
    });

    test('should create Docker-based app', async ({ cfApi, secrets }) => {
      const spaceGuid = secrets.cloudFoundry[0].testSpaceGuid;

      // Docker lifecycle (type 'docker' instead of 'buildpack'). Routed through
      // cfApi.createApp so it uses the correct passthrough proxy (x-cap-cnsi-list
      // header) rather than a hand-rolled URL.
      const app = await cfApi.createApp({
        name: createCustomName('docker-app'),
        spaceGuid,
        lifecycle: { type: 'docker', data: {} },
      });

      expect(app.guid).toBeTruthy();
      expect(app.lifecycle.type).toBe('docker');
      expect(app.state).toBe('STOPPED');

      await cfApi.deleteApp(app.guid);
    });

    test('should create Docker app with environment variables', async ({ cfApi, secrets }) => {
      const spaceGuid = secrets.cloudFoundry[0].testSpaceGuid;

      const app = await cfApi.createApp({
        name: createCustomName('docker-env-app'),
        spaceGuid,
        lifecycle: { type: 'docker', data: {} },
        // Use non-reserved names: CF rejects system-managed vars like PORT
        // ("Var cannot set PORT", 422).
        environmentVariables: {
          DOCKER_IMAGE: 'nginx:latest',
          LOG_LEVEL: 'info',
        },
      });

      expect(app.guid).toBeTruthy();
      expect(app.lifecycle.type).toBe('docker');

      // CF v3 does NOT echo environment_variables on the create response (they
      // are a separate sub-resource); read them back and assert they stuck.
      const env = await cfApi.getAppEnvironment(app.guid);
      expect(env.DOCKER_IMAGE).toBe('nginx:latest');
      expect(env.LOG_LEVEL).toBe('info');

      await cfApi.deleteApp(app.guid);
    });
  });

  /**
   * Docker deploy UI e2e — DEFERRED (honest skip, tracked for a follow-up).
   *
   * The prior tests here were hollow-green: their page object navigated to
   * routes that no longer exist (/applications/deploy/docker,
   * /applications/new/:cf/:space/docker), so a try/catch feature-detect always
   * returned false and every test skipped with the misleading reason "Docker
   * deployment not available in this CF deployment". Docker deploy IS
   * available — the nav was simply dead.
   *
   * The modern flow lives at /applications/deploy and reaches the Docker image
   * field only by driving the full wizard: step 1 (CF/org/space custom
   * app-select, same heavy control as the create wizard) then picking the
   * "Docker" source type in step 2, which reveals #dockerAppName / #dockerImg
   * (placeholder "repo/image:tag"; errors "Image is required" / "Invalid Image"
   * as div.text-danger) / #dockerUsername (optional). Overrides live in the
   * Overrides step (formControlName startCmd / instances / memory /
   * healthCheckType).
   *
   * Several old tests also modelled UI that no longer exists: a private-registry
   * URL/password/checkbox (modern Docker auth is the single optional
   * #dockerUsername field + the app's CF_DOCKER_PASSWORD env var) and an
   * env-var editor (not part of the deploy wizard). Those must be dropped, not
   * re-selectored.
   */
  test.describe.skip('Docker deploy UI (deferred — needs the /applications/deploy step1+step2 drive)', () => {
    test.fixme('accept + validate Docker image (#dockerImg, "Invalid Image" error)', () => {});
    test.fixme('start command + memory overrides (Overrides step formControls)', () => {});
    test.fixme('optional Docker username — no registry URL/password/checkbox UI exists', () => {});
    test.fixme('env vars are not set through the deploy wizard — seed via cfApi instead', () => {});
  });

});
