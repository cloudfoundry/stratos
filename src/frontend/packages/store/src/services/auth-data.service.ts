import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { RouterNav } from '../actions/router.actions';
import { VerifySession } from '../actions/auth.actions';
import { AppState } from '../app-state';
import { AuthState } from '../reducers/auth.reducer';
import { RouterRedirect } from '../reducers/routing.reducer';
import { SessionData } from '../types/auth.types';

/**
 * W36-C Wave 1 signal-native facade over the legacy `auth` ngrx slice.
 *
 * The auth reducer remains the canonical store of truth — it's still driven
 * by `auth.effects.ts` (verify-session HTTP, login/logout transitions) and
 * `system.actions.ts` (GET_SYSTEM_INFO_SUCCESS folds endpoints into
 * sessionData). This service is the single bridge point: it subscribes to
 * `store.select(s => s.auth)` ONCE on construction and mirrors the slice
 * into signals so downstream consumers can stay Store-free.
 *
 * Mutations that previously dispatched ngrx actions (`VerifySession`,
 * `RouterNav` with redirect) are exposed as service methods. New consumers
 * inject this service (or {@link AuthSignalService} for the legacy
 * per-field signal API) and never touch `Store` directly.
 *
 * When the reducer eventually migrates into this service, the `Store` bridge
 * is the only piece that has to go — the public signal API stays put.
 */
@Injectable({ providedIn: 'root' })
export class AuthDataService {
  private store = inject<Store<AppState>>(Store);

  /** Mirror of the `auth` slice. `undefined` until the store emits. */
  private readonly _auth = signal<AuthState | undefined>(undefined);

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

  private subscription: Subscription;

  constructor() {
    // Single bridge subscription. Long-lived (service is providedIn root)
    // so we don't need to manage teardown — the subscription dies with the
    // app. Reading via `subscribe` rather than `toSignal` keeps the data
    // service usable from non-injection contexts (e.g. effects that
    // construct it lazily) and avoids the rxjs-interop dependency here.
    this.subscription = this.store.select(s => s.auth).subscribe(next => {
      this._auth.set(next);
    });
  }

  /**
   * Trigger a session-verification cycle. Wraps the legacy `VerifySession`
   * action — `auth.effects.ts` still owns the HTTP round-trip.
   */
  verifySession(login: boolean = false, updateEndpoints: boolean = false): void {
    this.store.dispatch(new VerifySession(login, updateEndpoints));
  }

  /**
   * Navigate to `path` while remembering `redirect` as the post-login
   * target. The auth reducer captures the redirect into `auth.redirect`
   * via the `RouterActions.GO` case so the login page can replay it on
   * success.
   */
  navigateAndRememberRedirect(path: string[] | string, redirect: RouterRedirect): void {
    this.store.dispatch(new RouterNav({ path }, redirect));
  }
}
