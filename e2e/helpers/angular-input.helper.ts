import { Page } from '@playwright/test';

/**
 * Fill an Angular input that uses OnPush change detection + ngModel.
 *
 * Playwright's fill() sets the DOM value but doesn't trigger Angular's
 * ngModel directive under OnPush. This helper uses the native
 * HTMLInputElement value setter and dispatches input/change events,
 * which Angular's event listeners pick up.
 */
export async function fillAngularInput(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel) as HTMLInputElement;
    if (!el) throw new Error(`Element not found: ${sel}`);

    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )!.set!;

    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { sel: selector, val: value });
}

/**
 * Fill username and password inputs and wait for Angular to process.
 */
export async function fillAngularLogin(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await fillAngularInput(page, 'input[name="username"]', username);
  await fillAngularInput(page, 'input[name="password"]', password);
  // Allow Angular change detection to process
  await page.waitForTimeout(200);
}
