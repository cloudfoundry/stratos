import { Injectable, Signal, inject } from '@angular/core';
import { AuthDataService, AuthState, RouterRedirect, SessionData } from '@stratosui/store';

/**
 * W36-C Wave 1 — thin signal-native facade over {@link AuthDataService}.
 *
 * Preserves the per-field signal API the existing consumer surface
 * (session.service, endpoints, login/logout pages, profile, restore,
 * about/diagnostics, wizards) was written against. New code should inject
 * `AuthDataService` directly; the indirection here is only worth the
 * compile-time stability for the dozen-plus call sites.
 *
 * The single bridge to `store.select(s => s.auth)` lives in
 * `AuthDataService` now — this service does not touch `Store`.
 */
@Injectable({ providedIn: 'root' })
export class AuthSignalService {
  private authData = inject(AuthDataService);

  /** Raw auth slice. `undefined` until the data service mirrors its first value. */
  readonly auth: Signal<AuthState | undefined> = this.authData.auth;

  readonly loggedIn: Signal<boolean> = this.authData.loggedIn;
  readonly loggingIn: Signal<boolean> = this.authData.loggingIn;
  readonly verifying: Signal<boolean> = this.authData.verifying;
  readonly error: Signal<boolean> = this.authData.error;
  readonly errorResponse: Signal<unknown> = this.authData.errorResponse;
  readonly sessionData: Signal<SessionData | null> = this.authData.sessionData;
  readonly sessionValid: Signal<boolean> = this.authData.sessionValid;
  readonly redirect: Signal<RouterRedirect | undefined> = this.authData.redirect;

  /**
   * Timestamp (ms since epoch) of the most recent transition into a logged-in
   * state. Replaces consumers that listen to `Actions.pipe(ofType(LOGIN_SUCCESS))`
   * without dragging in `@ngrx/effects` / `Actions`. Sourced from
   * {@link AuthDataService}, which owns the false → true transition logic.
   *
   * `0` until the first login transition is observed in the current session.
   */
  readonly loginCompletedAt: Signal<number> = this.authData.loginCompletedAt;

  /**
   * Begin a login. Delegates to {@link AuthDataService}, which dispatches the
   * `Login` action; the underlying ngrx effect still owns the credential POST
   * and the verify/redirect saga.
   */
  login(username: string, password: string): void {
    this.authData.login(username, password);
  }

  /**
   * Log out. Delegates to {@link AuthDataService}, which dispatches the
   * `Logout` action; the underlying ngrx effect still owns the logout POST
   * and the reset/redirect.
   */
  logout(): void {
    this.authData.logout();
  }

  /**
   * Trigger a session-verification cycle. Delegates to {@link AuthDataService}
   * so callers can stay Store-free; the underlying ngrx effect remains
   * responsible for the HTTP round-trip until session refresh is fully
   * signal-native.
   */
  verifySession(login: boolean = false, updateEndpoints: boolean = false): void {
    this.authData.verifySession(login, updateEndpoints);
  }

  /**
   * Navigate to `path` while remembering `redirect` as the post-login target.
   * Delegates to {@link AuthDataService}, which dispatches `RouterNav`; the
   * auth reducer captures the redirect so the login page can replay it on
   * success.
   */
  navigateAndRememberRedirect(path: string[] | string, redirect: RouterRedirect): void {
    this.authData.navigateAndRememberRedirect(path, redirect);
  }
}
