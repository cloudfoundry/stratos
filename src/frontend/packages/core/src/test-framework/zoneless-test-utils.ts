import { ComponentFixture } from '@angular/core/testing';

/**
 * Zoneless Testing Utilities
 *
 * These utilities provide explicit change detection management for Angular applications
 * running in zoneless mode (without Zone.js). In zoneless mode, change detection is NOT
 * triggered automatically - you must manually trigger it after any operations that modify state.
 *
 * @see zoneless-test-guide.md for comprehensive usage examples and patterns
 */

/**
 * Manually trigger change detection in zoneless tests
 *
 * Use this instead of relying on automatic Zone.js detection.
 * Call this after ANY operation that modifies component state:
 * - Setting component properties
 * - Emitting events
 * - Completing async operations
 * - Triggering user interactions
 *
 * IMPORTANT for zoneless mode:
 * - Call fixture.detectChanges() directly, not appRef.tick()
 * - appRef.tick() schedules async work; fixture.detectChanges() runs immediately
 * - In zoneless mode with no Zone.js, appRef.tick() is unnecessary
 *
 * @example
 * ```typescript
 * component.title = 'New Title';
 * detectChanges(fixture);
 * expect(element.textContent).toContain('New Title');
 * ```
 */
export function detectChanges<T>(fixture: ComponentFixture<T>): void {
  // In zoneless mode, we only need fixture.detectChanges()
  // Do NOT call appRef.tick() - it causes NG0100 errors by scheduling
  // change detection asynchronously when we need it synchronously
  fixture.detectChanges();
}

/**
 * Wait for async operations and trigger change detection
 *
 * Use this for operations that involve promises or async/await.
 * This ensures all microtasks complete before detecting changes.
 *
 * @example
 * ```typescript
 * await waitForAsync(fixture, async () => {
 *   await component.loadData();
 * });
 * expect(component.data).toBeDefined();
 * ```
 */
export async function waitForAsync<T>(
  fixture: ComponentFixture<T>,
  fn: () => void | Promise<void>
): Promise<void> {
  await Promise.resolve(fn());
  detectChanges(fixture);
}

/**
 * Wait for a condition with timeout
 *
 * Useful for waiting on async state updates, such as:
 * - Observable emissions
 * - NgRx store updates
 * - Async validation
 * - Network request completion (in tests with mocked responses)
 *
 * @param fixture - The component fixture
 * @param condition - Function that returns true when condition is met
 * @param timeoutMs - Maximum time to wait (default: 5000ms)
 * @param checkIntervalMs - How often to check condition (default: 50ms)
 *
 * @example
 * ```typescript
 * await waitForCondition(
 *   fixture,
 *   () => component.loading === false,
 *   5000
 * );
 * expect(component.data).toBeDefined();
 * ```
 */
export async function waitForCondition<T>(
  fixture: ComponentFixture<T>,
  condition: () => boolean,
  timeoutMs: number = 5000,
  checkIntervalMs: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    detectChanges(fixture);
  }
}

/**
 * Helper to get element by selector from fixture
 *
 * Shorthand for fixture.nativeElement.querySelector()
 *
 * @example
 * ```typescript
 * const button = getElement(fixture, 'button.submit');
 * expect(button).toBeTruthy();
 * ```
 */
export function getElement<T>(
  fixture: ComponentFixture<T>,
  selector: string
): HTMLElement | null {
  return fixture.nativeElement.querySelector(selector);
}

/**
 * Helper to get all elements by selector from fixture
 *
 * Shorthand for fixture.nativeElement.querySelectorAll() that returns an array
 *
 * @example
 * ```typescript
 * const items = getAllElements(fixture, '.list-item');
 * expect(items.length).toBe(3);
 * ```
 */
export function getAllElements<T>(
  fixture: ComponentFixture<T>,
  selector: string
): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll(selector));
}

/**
 * Simulate async operation with proper change detection
 *
 * Runs an operation, waits for next tick, then triggers change detection.
 * Useful for simulating async operations in tests.
 *
 * @example
 * ```typescript
 * await simulateAsync(fixture, () => {
 *   component.handleClick();
 * });
 * expect(component.clickCount).toBe(1);
 * ```
 */
export async function simulateAsync<T>(
  fixture: ComponentFixture<T>,
  operation: () => void
): Promise<void> {
  operation();
  await Promise.resolve(); // Next tick
  detectChanges(fixture);
}

/**
 * Click an element and trigger change detection
 *
 * Simulates a user click with proper change detection handling.
 *
 * @example
 * ```typescript
 * const button = getElement(fixture, 'button');
 * await clickElement(fixture, button);
 * expect(component.clicked).toBe(true);
 * ```
 */
export async function clickElement<T>(
  fixture: ComponentFixture<T>,
  element: HTMLElement
): Promise<void> {
  element.click();
  await Promise.resolve(); // Next tick
  detectChanges(fixture);
}

/**
 * Set input value and trigger change detection
 *
 * Simulates user input with proper event dispatching and change detection.
 *
 * @example
 * ```typescript
 * const input = getElement(fixture, 'input[name="email"]') as HTMLInputElement;
 * await setInputValue(fixture, input, 'test@example.com');
 * expect(component.form.value.email).toBe('test@example.com');
 * ```
 */
export async function setInputValue<T>(
  fixture: ComponentFixture<T>,
  input: HTMLInputElement,
  value: string
): Promise<void> {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('change'));
  await Promise.resolve(); // Next tick
  detectChanges(fixture);
}

/**
 * Dispatch an event and trigger change detection
 *
 * Generic event dispatcher with change detection handling.
 *
 * @example
 * ```typescript
 * const element = getElement(fixture, '.draggable');
 * await dispatchEvent(fixture, element, new DragEvent('dragstart'));
 * ```
 */
export async function dispatchEvent<T>(
  fixture: ComponentFixture<T>,
  element: HTMLElement,
  event: Event
): Promise<void> {
  element.dispatchEvent(event);
  await Promise.resolve(); // Next tick
  detectChanges(fixture);
}

/**
 * Wait for observable to emit a value
 *
 * Useful for testing components that rely on observables.
 *
 * @example
 * ```typescript
 * const value = await waitForObservable(component.data$);
 * expect(value).toEqual({ id: 1, name: 'Test' });
 * ```
 */
export async function waitForObservable<T>(
  observable: any,
  timeoutMs: number = 5000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error(`Observable did not emit within ${timeoutMs}ms`));
    }, timeoutMs);

    const subscription = observable.subscribe({
      next: (value: T) => {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve(value);
      },
      error: (error: any) => {
        clearTimeout(timeout);
        subscription.unsubscribe();
        reject(error);
      }
    });
  });
}

/**
 * Flush microtasks and trigger change detection
 *
 * Ensures all pending promises resolve before continuing.
 * Use when you need to wait for multiple async operations.
 *
 * @example
 * ```typescript
 * component.loadMultipleResources();
 * await flushMicrotasks(fixture);
 * expect(component.allLoaded).toBe(true);
 * ```
 */
export async function flushMicrotasks<T>(
  fixture: ComponentFixture<T>
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  detectChanges(fixture);
}
