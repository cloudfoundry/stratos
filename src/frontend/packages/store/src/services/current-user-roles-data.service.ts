import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription, distinctUntilChanged, map } from 'rxjs';

import { CurrentUserRolesAppState } from '../app-state';
import { PermissionValues } from '../selectors/current-user-role.selectors';
import {
  ICurrentUserRolesState,
  IStratosRolesState,
} from '../types/current-user-roles.types';
import { UserScopeStrings } from '../types/endpoint.types';

/**
 * W36-C Wave 2 signal-native facade over the legacy `currentUserRoles`
 * ngrx slice.
 *
 * The reducer (`current-user-roles.reducer.ts` plus per-endpoint reducers
 * such as `permission.reducer.ts`) remains the canonical store of truth —
 * it's still driven by `permission-fetcher.service` and the auth
 * `VerifySession` cycle. This service is the single bridge point: it
 * subscribes to `store.select(s => s.currentUserRoles)` ONCE on
 * construction and mirrors the slice into signals so downstream consumers
 * (the stratos + cf permission checkers, the cf-side data service in the
 * cloud-foundry package, list config helpers, etc.) can stay Store-free.
 *
 * Mirrors the W36-C Wave 1 `AuthDataService` shape:
 *   - signal-out for new consumers
 *   - parametric `*$` observable getters preserved so the legacy
 *     rxjs-shaped checker pipelines (`combineLatest`, `switchMap`,
 *     `distinctUntilChanged`) keep compiling unchanged through the
 *     facade in {@link CurrentUserRolesSignalService}
 *
 * When the underlying reducer eventually migrates into a future wave's
 * data service, the `Store` bridge is the only piece that has to go —
 * the public signal + observable API stays put.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserRolesDataService {
  private store = inject<Store<CurrentUserRolesAppState>>(Store);

  /** Mirror of the `currentUserRoles` slice. `undefined` until the store emits. */
  private readonly _state = signal<ICurrentUserRolesState | undefined>(undefined);

  readonly state: Signal<ICurrentUserRolesState | undefined> = this._state.asReadonly();

  readonly stratos: Signal<IStratosRolesState | undefined> = computed(
    () => this._state()?.internal,
  );

  /** Long-lived source observable; data services in dependent packages reuse it. */
  readonly state$: Observable<ICurrentUserRolesState | undefined>;

  private subscription: Subscription;

  constructor() {
    // Single bridge subscription. Long-lived (service is providedIn root)
    // so we don't need to manage teardown.
    this.state$ = this.store
      .select((s: CurrentUserRolesAppState) => s.currentUserRoles)
      .pipe(distinctUntilChanged());
    this.subscription = this.state$.subscribe(next => {
      this._state.set(next);
    });
  }

  /** Per-role boolean signal — replaces `getCurrentUserStratosRole(role)`. */
  stratosRole(role: PermissionValues): Signal<boolean> {
    return computed(() => {
      const internal = this._state()?.internal as Record<string, any> | undefined;
      if (!internal) {
        return false;
      }
      // Mirrors `selectCurrentUserStratosRoles`: scopes is handled separately.
      return !!internal[role];
    });
  }

  /** Per-scope boolean signal — replaces `getCurrentUserStratosHasScope(scope)`. */
  stratosHasScope(scope: UserScopeStrings | string): Signal<boolean> {
    return computed(() => {
      const scopes = this._state()?.internal?.scopes;
      return !!scopes?.includes(scope as UserScopeStrings);
    });
  }

  /** Observable boolean — keeps legacy `combineLatest`/`switchMap` pipelines simple. */
  stratosRole$(role: PermissionValues): Observable<boolean> {
    return this.state$.pipe(
      map(state => {
        const internal = state?.internal as Record<string, any> | undefined;
        return internal ? !!internal[role] : false;
      }),
      distinctUntilChanged(),
    );
  }

  /** Observable boolean — keeps legacy `combineLatest`/`switchMap` pipelines simple. */
  stratosHasScope$(scope: UserScopeStrings | string): Observable<boolean> {
    return this.state$.pipe(
      map(state => !!state?.internal?.scopes?.includes(scope as UserScopeStrings)),
      distinctUntilChanged(),
    );
  }
}
