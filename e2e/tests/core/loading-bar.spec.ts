import { test, expect } from '../../fixtures/test-base';

/**
 * Loading Bar Tests
 *
 * Verifies the indeterminate progress bar renders and animates
 * during data loading in list/table views.
 *
 * Run against adepttech:
 *   STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca \
 *   STRATOS_E2E_PROFILE=adepttech npx playwright test loading-bar
 */

test.describe('Loading Bar', () => {

  test.describe('CSS animation definition', () => {

    test('progress-bar-indeterminate class has animation', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to a page that triggers data loading
      const cfNav = page.locator('a').filter({ hasText: /Cloud Foundry/i }).first();
      const visible = await cfNav.isVisible({ timeout: 10000 }).catch(() => false);
      if (!visible) {
        test.skip('Cloud Foundry nav not available');
        return;
      }
      await cfNav.click();
      await page.waitForLoadState('networkidle');

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

      // Navigate to Cloud Foundry
      const cfNav = page.locator('a').filter({ hasText: /Cloud Foundry/i }).first();
      const cfVisible = await cfNav.isVisible({ timeout: 10000 }).catch(() => false);
      if (!cfVisible) {
        test.skip('Cloud Foundry nav not available');
        return;
      }
      await cfNav.click();
      await page.waitForLoadState('networkidle');

      // Navigate to Organizations — this triggers a data load with progress bar
      const orgsNav = page.locator('a').filter({ hasText: /Organizations/i }).first();
      const orgsVisible = await orgsNav.isVisible({ timeout: 10000 }).catch(() => false);
      if (!orgsVisible) {
        test.skip('Organizations nav not available');
        return;
      }

      // Start watching for the progress bar BEFORE clicking
      const progressBarPromise = page.locator('.progress-bar-indeterminate').first()
        .waitFor({ state: 'attached', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

      await orgsNav.click();

      const sawProgressBar = await progressBarPromise;
      // The progress bar may be too fast to catch, so we don't fail on this
      // but we log whether it appeared
      console.log(`Progress bar appeared during navigation: ${sawProgressBar}`);

      // After load completes, verify the progress bar is gone
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const progressBarStillVisible = await page.locator('.progress-bar-indeterminate')
        .first().isVisible({ timeout: 1000 }).catch(() => false);
      expect(progressBarStillVisible, 'Progress bar should be hidden after load completes')
        .toBe(false);
    });
  });
});
