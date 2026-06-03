import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, Injector, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { StratosBrandingService } from '@stratosui/theme';

import { DashboardDataService } from '../../../core/src/core/dashboard-data.service';
import { AppState, DispatchOnlyAppState } from '../app-state';
import { BrowserStandardEncoder } from '../browser-encoder';
import { LocalStorageService } from '../helpers/local-storage-service';
import { AuthState, RouterRedirect, SessionData, SessionDataEnvelope } from '../types/auth.types';
import { CurrentUserRolesDataService } from './current-user-roles-data.service';
import { EndpointsDataService } from './endpoints-data.service';

const SETUP_HEADER = 'stratos-setup-required';
const UPGRADE_HEADER = 'retry-after';
const DOMAIN_HEADER = 'x-stratos-domain';
const SSO_HEADER = 'x-stratos-sso-login';

/**
 * Default auth state. `verifying` starts `true` to prevent a race during app
 * init — the authGuard waits for `verifying === false` and must not see a
 * transient "not verifying, not logged in" window before the first verify.
 */
const defaultAuthState: AuthState = {
  loggedIn: false,
  loggingIn: false,
  user: null,
  error: false,
  errorResponse: '',
  sessionData: null,
  verifying: true,
};

/**
 * W36-C signal-native owner of auth state.
 *
 * This service is now the source of truth for login/logout/verify: it owns
 * the auth state as a writable signal and performs the HTTP itself (the
 * credential POST, the verify GET, the logout POST) — work that previously
 * lived in `auth.effects.ts` driven by the `auth` ngrx reducer. Downstream
 * consumers read the projected signals and never touch `Store`.
 *
 * One tie to the legacy slice remains until the reducer is deleted:
 *  - a successful verify still dispatches `VerifiedSession` so the auth
 *    reducer keeps `state.auth.sessionData` populated for the entity-catalog
 *    framework readers (`selectSessionData`, helm `registeredLimit`) and so
 *    `cfRoleInfoFromSessionReducer` can propagate CF admin permissions.
 * It is retired when the reducer/effects are removed.
 */
@Injectable({ providedIn: 'root' })
export class AuthDataService {
  private store = inject<Store<AppState & DispatchOnlyAppState>>(Store);
  private router = inject(Router);
  private http = inject(HttpClient);
  // Verify-only collaborators are resolved lazily (only when a verify cycle
  // actually runs). Injecting them eagerly would construct branding/endpoints
  // — which fetch on init — wherever this root service is pulled in, even in
  // code paths that never authenticate.
  private injector = inject(Injector);
  private rolesData = inject(CurrentUserRolesDataService);

  /** Authoritative auth state. */
  private readonly _auth = signal<AuthState>(defaultAuthState);

  readonly auth: Signal<AuthState | undefined> = this._auth.asReadonly();

  readonly loggedIn: Signal<boolean> = computed(() => !!this._auth()?.loggedIn);
  readonly loggingIn: Signal<boolean> = computed(() => !!this._auth()?.loggingIn);
  readonly verifying: Signal<boolean> = computed(() => !!this._auth()?.verifying);
  readonly error: Signal<boolean> = computed(() => !!this._auth()?.error);
  readonly errorResponse: Signal<unknown> = computed(() => this._auth()?.errorResponse);
  readonly sessionData: Signal<SessionData | null> = computed(
    () => this._auth()?.sessionData ?? null,
  );
  readonly sessionValid: Signal<boolean> = computed(() => !!this.sessionData()?.valid);
  readonly redirect: Signal<RouterRedirect | undefined> = computed(
    () => this._auth()?.redirect,
  );

  /**
   * Timestamp (ms since epoch) of the most recent transition into a logged-in
   * state. Replaces consumers that listened to `Actions.pipe(ofType(LOGIN_SUCCESS))`
   * without dragging `@ngrx/effects` / `Actions` into this service. `0` until
   * the first false → true login transition is observed in the current session.
   */
  private readonly _loginCompletedAt = signal(0);

  readonly loginCompletedAt: Signal<number> = this._loginCompletedAt.asReadonly();

  /** Tracks the prior `loggedIn` value so we only stamp on false → true. */
  private prevLoggedIn = false;

  /**
   * Patch the auth state and stamp `loginCompletedAt` on a false → true login
   * transition. Refusing the initial true value (e.g. a verified-session
   * restore) is intentional: consumers wanting "fresh login" semantics rely
   * on the transition, not the steady state.
   */
  private patch(partial: Partial<AuthState>): void {
    const next = { ...this._auth(), ...partial };
    this._auth.set(next);
    if (next.loggedIn && !this.prevLoggedIn) {
      this._loginCompletedAt.set(Date.now());
    }
    this.prevLoggedIn = !!next.loggedIn;
    // No manual change-detection nudge: unlike the legacy store dispatches,
    // these are signal writes, which schedule zoneless CD on their own.
    // Calling ApplicationRef.tick() here recurses when a verify runs inside
    // an existing CD pass (NG0101).
  }

  /**
   * Begin a login: POST the credentials, then run a verify cycle (which
   * resolves the logged-in state and replays any remembered redirect).
   */
  async login(username: string, password: string): Promise<void> {
    this.patch({ loggingIn: true, loggedIn: false, error: false });

    const params = new HttpParams({
      encoder: new BrowserStandardEncoder(),
      fromObject: { username, password },
    });
    const headers = { 'x-cap-request-date': Math.floor(Date.now() / 1000).toString() };

    try {
      await firstValueFrom(
        this.http.post('/pp/v1/auth/login/uaa', params, { headers, withCredentials: true }),
      );
      await this.verifySession(true, true);
    } catch (err) {
      this.patch({ error: true, errorResponse: err, loggingIn: false, loggedIn: false });
    }
  }

  /**
   * Log out: POST the logout, then reset the session via a full navigation
   * (SSO uses the dedicated sso_logout endpoint). A failure surfaces as an
   * error while keeping the user logged in.
   */
  async logout(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.post<{ isSSO?: boolean }>('/pp/v1/auth/logout', {}, { withCredentials: true }),
      );
      if (data?.isSSO) {
        // Clear any path from the location (otherwise stored via auth gate as
        // redirectPath for log in) by handing off to the SSO logout endpoint.
        const returnUrl = encodeURI(window.location.origin);
        window.open('/pp/v1/auth/sso_logout?state=' + returnUrl, '_self');
      } else {
        window.location.assign(window.location.origin);
      }
    } catch (err) {
      console.error(err);
      this.patch({ loggingIn: false, loggedIn: true, error: true, errorResponse: err });
    }
  }

  /**
   * Run a session-verification cycle against `/api/v1/auth/verify`. On success
   * it hydrates session data, local storage and branding, loads endpoints, and
   * (when `login`) marks the session logged-in. On failure it either records an
   * invalid/error session (when `login`) or resets to the default state.
   */
  async verifySession(login: boolean = false, updateEndpoints: boolean = false): Promise<void> {
    this.patch({ error: false, errorResponse: undefined, verifying: true });

    const headers = { 'x-cap-request-date': Math.floor(Date.now() / 1000).toString() };

    try {
      const response = await firstValueFrom(
        this.http.get<SessionDataEnvelope>('/api/v1/auth/verify', {
          headers,
          observe: 'response',
          withCredentials: true,
        }),
      );

      const envelope = response.body;
      if (envelope.status === 'error') {
        const ssoOptions = response.headers.get(SSO_HEADER);
        const isDomainMismatch = this.isDomainMismatch(response.headers);
        if (login) {
          this.setInvalidSession(false, false, isDomainMismatch, ssoOptions);
        } else {
          this.resetAuth();
        }
        return;
      }

      const sessionData = envelope.data;
      sessionData.sessionExpiresOn =
        parseInt(response.headers.get('x-cap-session-expires-on'), 10) * 1000;
      const dashboardData = this.injector.get(DashboardDataService);
      const branding = this.injector.get(StratosBrandingService);
      const endpointsService = this.injector.get(EndpointsDataService);
      LocalStorageService.localStorageToStore(this.store, sessionData, dashboardData);
      branding.activateUserPreferences();

      try {
        await endpointsService.getAll(true);
      } catch {
        // Endpoint load failures are surfaced on EndpointsDataService; the
        // session is still verified, but login does not complete.
        this.setVerifiedSession(sessionData, updateEndpoints, false);
        return;
      }
      this.setVerifiedSession(sessionData, updateEndpoints, login);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      let setupMode = false;
      let isUpgrading = false;
      const ssoOptions = httpErr?.headers?.get(SSO_HEADER);
      if (httpErr?.status === 503) {
        setupMode = httpErr.headers.has(SETUP_HEADER);
        isUpgrading = httpErr.headers.has(UPGRADE_HEADER);
      }
      const isDomainMismatch = this.isDomainMismatch(httpErr?.headers);
      if (login) {
        this.setInvalidSession(setupMode, isUpgrading, isDomainMismatch, ssoOptions);
      } else {
        this.resetAuth();
      }
    }
  }

  /**
   * Navigate to `path` while remembering `redirect` as the post-login target.
   * The redirect is replayed by the login page on success.
   */
  navigateAndRememberRedirect(path: string[] | string, redirect: RouterRedirect): void {
    this._auth.update(s => ({ ...s, redirect: redirect || s.redirect }));
    this.router.navigate(typeof path === 'string' ? path.split('/') : path);
  }

  /** Verified session (+ logged-in when `login`). */
  // `_updateEndpoints` is retained for call-site symmetry with verifySession;
  // endpoints are always (re)loaded via endpointsService.getAll(true) now.
  private setVerifiedSession(sessionData: SessionData, _updateEndpoints: boolean, login: boolean): void {
    // Apply the verified session user's internal admin scopes directly to the
    // signal source of truth (replaces the former SESSION_VERIFIED reducer
    // case). CF endpoint admin scopes are propagated separately by
    // CfEndpointRoleSyncService observing the sessionData signal.
    this.rolesData.applySessionScopes(sessionData.user);
    this.patch({
      error: false,
      errorResponse: '',
      sessionData: { ...sessionData, valid: true, uaaError: false, upgradeInProgress: false },
      verifying: false,
      ...(login ? { loggingIn: false, loggedIn: true } : {}),
    });
  }

  /** SESSION_INVALID followed by the LOGIN_FAILED the effect chained on it. */
  private setInvalidSession(
    uaaError: boolean,
    upgradeInProgress: boolean,
    domainMismatch: boolean,
    ssoOptions: string,
  ): void {
    this.patch({
      sessionData: {
        valid: false,
        uaaError,
        upgradeInProgress,
        domainMismatch,
        ssoOptions,
        sessionExpiresOn: null,
        plugins: { demo: false },
        config: {},
      },
      verifying: false,
      // invalidSessionAuth$ chained LOGIN_FAILED('Invalid session') on SESSION_INVALID.
      error: true,
      errorResponse: 'Invalid session',
      loggingIn: false,
      loggedIn: false,
    });
  }

  /** RESET_AUTH — back to the default state. */
  private resetAuth(): void {
    this.prevLoggedIn = false;
    this._auth.set(defaultAuthState);
  }

  private isDomainMismatch(headers: { has: (h: string) => boolean; get: (h: string) => string } | undefined): boolean {
    if (headers && headers.has(DOMAIN_HEADER)) {
      const expectedDomain = headers.get(DOMAIN_HEADER);
      return !window.location.hostname.endsWith(expectedDomain);
    }
    return false;
  }
}
