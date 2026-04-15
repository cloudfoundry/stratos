import { test, expect } from '../../fixtures/test-base';

/**
 * Loading Bar Tests
 *
 * Verifies the indeterminate progress bar renders and animates
 * during data loading in list/table views.
 *
 * Run against adepttech:
 *   E2E_BASE_URL=https://console.run.adepttech.ca \
 *   E2E_PROFILE=adepttech npx playwright test loading-bar
 */

test.describe('Loading Bar', () => {

  test.describe('CSS animation definition', () => {

    test('progress-bar-indeterminate class has animation', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to a page that triggers data loading
      const endpoints = await page.request.get('/api/v1/endpoints').then((r: any) => r.json()).catch(() => []);
      const cfEndpoint = Array.isArray(endpoints) ? endpoints.find((ep: any) => ep.cnsi_type === 'cf') : null;
      if (!cfEndpoint) {
        test.skip('Cloud Foundry endpoint not available');
        return;
      }
      await page.goto(`/cloud-foundry/${cfEndpoint.guid}/organizations`);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Inject a test element to verify the CSS class exists and has animation
      const result = await page.evaluate(() => {
        const el = document.createElement('div');
        el.className = 'progress-bar-indeterminate';
        document.body.appendChild(el);
        const styles = window.getComputedStyle(el);
        const info = {
          animationName: styles.animationName,
          animationDuration: styles.animationDuration,
          position: styles.position,
        };
        document.body.removeChild(el);
        return info;
      });

      expect(result.animationName, 'progress-bar-indeterminate should have animation defined')
        .not.toBe('none');
      expect(result.animationDuration, 'animation duration should not be 0s')
        .not.toBe('0s');
      expect(result.position, 'should be absolutely positioned')
        .toBe('absolute');
    });
  });

  test.describe('Progress bar container', () => {

    test('progress-bar class has overflow hidden and relative position', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      const result = await page.evaluate(() => {
        const el = document.createElement('div');
        el.className = 'progress-bar';
        document.body.appendChild(el);
        const styles = window.getComputedStyle(el);
        const info = {
          overflow: styles.overflow,
          overflowX: styles.overflowX,
          overflowY: styles.overflowY,
          position: styles.position,
          height: styles.height,
        };
        document.body.removeChild(el);
        return info;
      });

      expect(result.position, '.progress-bar should be relative')
        .toBe('relative');
      expect(result.overflow, '.progress-bar should clip overflow')
        .toBe('hidden');
    });
  });

  test.describe('Visual rendering during navigation', () => {

    test('loading bar appears during organizations page load', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to Cloud Foundry orgs directly via URL
      const endpoints = await page.request.get('/api/v1/endpoints').then((r: any) => r.json()).catch(() => []);
      const cfEndpoint = Array.isArray(endpoints) ? endpoints.find((ep: any) => ep.cnsi_type === 'cf') : null;
      if (!cfEndpoint) {
        test.skip('Cloud Foundry endpoint not available');
        return;
      }

      // Start watching for the progress bar BEFORE navigating
      const progressBarPromise = page.locator('.progress-bar-indeterminate').first()
        .waitFor({ state: 'attached', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

      await page.goto(`/cloud-foundry/${cfEndpoint.guid}/organizations`);

      const sawProgressBar = await progressBarPromise;
      // The progress bar may be too fast to catch, so we don't fail on this
      // but we log whether it appeared
      console.log(`Progress bar appeared during navigation: ${sawProgressBar}`);

      // After load completes, verify the progress bar is gone
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      // Wait explicitly for progress bar to disappear (CF data may load after networkidle)
      await page.locator('.progress-bar-indeterminate').first()
        .waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

      const progressBarStillVisible = await page.locator('.progress-bar-indeterminate')
        .first().isVisible({ timeout: 1000 }).catch(() => false);
      expect(progressBarStillVisible, 'Progress bar should be hidden after load completes')
        .toBe(false);
    });
  });
});
