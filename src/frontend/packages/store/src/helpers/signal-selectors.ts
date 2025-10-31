import { inject, Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

/**
 * Helper to create a signal from a selector in zoneless Angular applications.
 *
 * This utility simplifies the conversion of NgRx selectors to signals for use
 * in zoneless components where automatic change detection via zone.js is not available.
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   // Using inject-based approach
 *   userData = selectAsSignal(selectCurrentUser);
 *
 *   // With initial value
 *   userData = selectAsSignal(selectCurrentUser, { initialValue: null });
 * }
 * ```
 *
 * @param selector - NgRx selector function
 * @param options - Optional configuration including initialValue
 * @returns Signal containing the selected state value
 */
export function selectAsSignal<T>(
  selector: (state: any) => T,
  options?: { initialValue?: T }
): Signal<T | undefined> {
  const store = inject(Store);
  return toSignal(store.select(selector), options);
}

/**
 * Select multiple values as signals in a single call.
 *
 * This is useful when a component needs multiple pieces of state and you want
 * to keep the signal declarations concise.
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   state = selectMultipleAsSignals({
 *     user: selectCurrentUser,
 *     organizations: selectAllOrganizations,
 *     loading: selectIsLoading
 *   });
 *
 *   // Access as: this.state.user(), this.state.organizations(), etc.
 * }
 * ```
 *
 * @param selectors - Object mapping keys to selector functions
 * @returns Object with the same keys, but values are signals
 */
export function selectMultipleAsSignals<T extends Record<string, any>>(
  selectors: { [K in keyof T]: (state: any) => T[K] }
): { [K in keyof T]: Signal<T[K] | undefined> } {
  const store = inject(Store);
  const result: any = {};
  for (const [key, selector] of Object.entries(selectors)) {
    result[key] = toSignal(store.select(selector));
  }
  return result;
}

/**
 * Create a signal from an observable (useful for selectors with parameters).
 *
 * This is a convenience wrapper around toSignal for observable streams that
 * aren't directly from store.select().
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   orgId = signal('org-123');
 *
 *   // Create parameterized selector observable
 *   org$ = computed(() =>
 *     this.store.select(selectOrganizationById(this.orgId()))
 *   );
 *
 *   // Convert to signal
 *   org = observableAsSignal(this.org$());
 * }
 * ```
 *
 * @param observable - Observable to convert to signal
 * @param options - Optional configuration including initialValue
 * @returns Signal containing the observable's value
 */
export function observableAsSignal<T>(
  observable: Observable<T>,
  options?: { initialValue?: T }
): Signal<T | undefined> {
  return toSignal(observable, options);
}

/**
 * Helper for components using manual subscription pattern with OnPush.
 *
 * In zoneless mode, even with OnPush, you need to manually mark for check
 * when state updates. This helper provides a pattern for subscription-based
 * state management.
 *
 * @example
 * ```typescript
 * class MyComponent implements OnInit, OnDestroy {
 *   private cdr = inject(ChangeDetectorRef);
 *   private subscriptions = new Subscription();
 *
 *   user: User | null = null;
 *
 *   ngOnInit() {
 *     this.subscriptions.add(
 *       subscribeWithChangeDetection(
 *         this.store.select(selectCurrentUser),
 *         this.cdr,
 *         (user) => { this.user = user; }
 *       )
 *     );
 *   }
 *
 *   ngOnDestroy() {
 *     this.subscriptions.unsubscribe();
 *   }
 * }
 * ```
 *
 * Note: Prefer signals over this pattern when possible.
 */
export function subscribeWithChangeDetection<T>(
  observable: Observable<T>,
  changeDetectorRef: { markForCheck(): void },
  callback: (value: T) => void
) {
  return observable.subscribe((value) => {
    callback(value);
    changeDetectorRef.markForCheck();
  });
}

/**
 * Type helper for selector functions.
 *
 * Use this type when passing selectors as parameters or storing them in variables.
 *
 * @example
 * ```typescript
 * function createSignalFromSelector<T>(selector: SelectorFn<T>): Signal<T | undefined> {
 *   const store = inject(Store);
 *   return toSignal(store.select(selector));
 * }
 * ```
 */
export type SelectorFn<T> = (state: any) => T;
