import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AppState, AuthState, RouterNav, RouterRedirect, SessionData, VerifySession } from '@stratosui/store';

/**
 * Signal-native projection of the `auth` ngrx slice.
 *
 * Read-through wrapper over `Store.select(s => s.auth)`. Does not write to the
 * store and does not persist to localStorage — auth state rehydrates from
 * `verify-session` on app start, so no signal mirror is needed.
 *
 * Consumers will be flipped from the legacy SessionService / Actions stream
 * to these signals in a later wave-3 slice.
 */
@Injectable({ providedIn: 'root' })
export class AuthSignalService {
  private store = inject<Store<AppState>>(Store);

  /** Raw auth slice. `undefined` until the store emits its first value. */
  readonly auth: Signal<AuthState | undefined> = toSignal(this.store.select(s => s.auth));

  readonly loggedIn: Signal<boolean> = computed(() => !!this.auth()?.loggedIn);
  readonly loggingIn: Signal<boolean> = computed(() => !!this.auth()?.loggingIn);
  readonly verifying: Signal<boolean> = computed(() => !!this.auth()?.verifying);
  readonly error: Signal<boolean> = computed(() => !!this.auth()?.error);
  readonly errorResponse: Signal<unknown> = computed(() => this.auth()?.errorResponse);
  readonly sessionData: Signal<SessionData | null> = computed(() => this.auth()?.sessionData ?? null);
  readonly sessionValid: Signal<boolean> = computed(() => !!this.sessionData()?.valid);
  readonly redirect: Signal<RouterRedirect | undefined> = computed(() => this.auth()?.redirect);

  /**
   * Timestamp (ms since epoch) of the most recent transition into a logged-in
   * state. Replaces consumers that listen to `Actions.pipe(ofType(LOGIN_SUCCESS))`
   * without dragging in `@ngrx/effects` / `Actions`.
   *
   * `0` until the first login transition is observed in the current session.
   */
  readonly loginCompletedAt: Signal<number>;

  constructor() {
    const completedAt = signal(0);
    let prevLoggedIn = false;
    effect(() => {
      const isLoggedIn = this.loggedIn();
      // Only emit on a false → true transition. Refusing the initial true value
      // (e.g. from a verified session restore) is intentional: consumers wanting
      // "fresh login" semantics should rely on the transition, not the steady state.
      if (isLoggedIn && !prevLoggedIn) {
        completedAt.set(Date.now());
      }
      prevLoggedIn = isLoggedIn;
    });
    this.loginCompletedAt = completedAt.asReadonly();
  }

  /**
   * Trigger a session-verification cycle. Wraps the legacy `VerifySession`
   * action so callers can stay Store-free; the underlying ngrx effect remains
   * responsible for the HTTP round-trip until session refresh is fully
   * signal-native.
   */
  verifySession(login: boolean = false, updateEndpoints: boolean = false): void {
    this.store.dispatch(new VerifySession(login, updateEndpoints));
  }

  /**
   * Navigate to `path` while remembering `redirect` as the post-login target.
   * Wraps the legacy `RouterNav` action — the auth reducer captures the
   * redirect into `auth.redirect` so the login page can replay it on success.
   */
  navigateAndRememberRedirect(path: string[] | string, redirect: RouterRedirect): void {
    this.store.dispatch(new RouterNav({ path }, redirect));
  }
}
