import { test, expect } from '../../fixtures/test-base';

/**
 * Endpoints — Register Endpoint Modal close behavior
 *
 * Regression coverage for a class of bugs where closing the register-endpoint
 * modal via certain paths (Cancel button, X close button, Escape key) caused
 * the "Add endpoint" (+) button on the Endpoints page to disappear until a
 * hard browser refresh. Root cause was a structural directive (`*appUserPermission`)
 * driven by an async-piped observable that was sensitive to change detection
 * timing under zoneless Angular 21. The fix replaces it with a signal-backed
 * `@if` that is tied purely to the permission result, independent of modal state.
 *
 * This test pins down the invariant: **the Add button must remain visible
 * across any modal open/close cycle**, regardless of how the modal is closed.
 */
test.describe('Endpoints — Register modal close paths', () => {
  const ADD_BUTTON = '#stratos-add-endpoint';
  // The <app-endpoint-register-modal> host element collapses to 0x0 (the modal
  // content is fixed-positioned, taken out of flow). Use toHaveCount to check
  // presence instead of toBeVisible on the host.
  const MODAL_HOST = 'app-endpoint-register-modal';
  // The fixed-positioned modal content — this is what the user actually sees.
  const MODAL_OVERLAY = 'app-endpoint-register-modal > div.fixed';
  const MODAL_CANCEL = `${MODAL_HOST} button:has-text("Cancel")`;
  // Header close icon — the only <button> inside the modal whose icon text is "close"
  const MODAL_X = `${MODAL_HOST} button:has(.material-icons:text-is("close"))`;

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/endpoints', { waitUntil: 'domcontentloaded' });
    // Give the permission signal a beat to resolve before asserting visibility.
    await adminPage.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await expect(adminPage.locator(ADD_BUTTON)).toBeVisible({ timeout: 10_000 });
  });

  test('Add button stays visible after closing via Cancel', async ({ adminPage }) => {
    const addButton = adminPage.locator(ADD_BUTTON);
    const modalHost = adminPage.locator(MODAL_HOST);
    const modalOverlay = adminPage.locator(MODAL_OVERLAY);

    await addButton.click();
    await expect(modalHost).toHaveCount(1);
    await expect(modalOverlay).toBeVisible();

    await adminPage.locator(MODAL_CANCEL).click();
    await expect(modalHost).toHaveCount(0);

    await expect(addButton).toBeVisible();
  });

  test('Add button stays visible after closing via X', async ({ adminPage }) => {
    const addButton = adminPage.locator(ADD_BUTTON);
    const modalHost = adminPage.locator(MODAL_HOST);
    const modalOverlay = adminPage.locator(MODAL_OVERLAY);

    await addButton.click();
    await expect(modalHost).toHaveCount(1);
    await expect(modalOverlay).toBeVisible();

    await adminPage.locator(MODAL_X).click();
    await expect(modalHost).toHaveCount(0);

    await expect(addButton).toBeVisible();
  });

  test('Add button stays visible after closing via Escape key', async ({ adminPage }) => {
    const addButton = adminPage.locator(ADD_BUTTON);
    const modalHost = adminPage.locator(MODAL_HOST);
    const modalOverlay = adminPage.locator(MODAL_OVERLAY);

    await addButton.click();
    await expect(modalHost).toHaveCount(1);
    await expect(modalOverlay).toBeVisible();

    await adminPage.keyboard.press('Escape');
    await expect(modalHost).toHaveCount(0);

    await expect(addButton).toBeVisible();
  });

  test('Add button survives consecutive open/close cycles', async ({ adminPage }) => {
    const addButton = adminPage.locator(ADD_BUTTON);
    const modalHost = adminPage.locator(MODAL_HOST);
    const modalOverlay = adminPage.locator(MODAL_OVERLAY);

    // Cancel → X → Escape in one run to catch state pollution between cycles
    const closeMethods: Array<() => Promise<void>> = [
      async () => adminPage.locator(MODAL_CANCEL).click(),
      async () => adminPage.locator(MODAL_X).click(),
      async () => adminPage.keyboard.press('Escape'),
    ];

    for (const close of closeMethods) {
      await addButton.click();
      await expect(modalHost).toHaveCount(1);
      await expect(modalOverlay).toBeVisible();
      await close();
      await expect(modalHost).toHaveCount(0);
      await expect(addButton).toBeVisible();
    }
  });
});
