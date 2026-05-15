import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  GeneralEntityAppState,
  PermissionValues,
  SessionData,
  getCurrentUserStratosHasScope,
  getCurrentUserStratosRole,
  selectSessionData,
} from '@stratosui/store';
import { Observable } from 'rxjs';

/**
 * Signal-native bridge over the stratos-side `currentUserRoles` selectors
 * and `selectSessionData()`.
 *
 * The `StratosUserPermissionsChecker` previously injected `Store` directly
 * to call `store.select(getCurrentUserStratosRole(...))` etc. Routing those
 * reads through this service moves the `Store` dependency out of the
 * checker, which (combined with lazy checker construction in
 * `CurrentUserPermissionsService`) lets component specs that pull in
 * `CurrentUserPermissionsService` transitively avoid providing `Store` until
 * a permission check actually runs.
 *
 * Consumers receive `Observable<...>` return values to keep the existing
 * `combineLatest` / `switchMap` pipelines in the checkers untouched.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserRolesSignalService {
  private store = inject<Store<GeneralEntityAppState>>(Store);

  /** Whether the current user holds the named stratos role (e.g. `isAdmin`). */
  stratosRole$(role: PermissionValues): Observable<boolean> {
    return this.store.select(getCurrentUserStratosRole(role));
  }

  /** Whether the current user's stratos scopes include the named scope. */
  stratosHasScope$(scope: string): Observable<boolean> {
    // `getCurrentUserStratosHasScope` is typed `(scope: UserScopeStrings)` but
    // accepts any string at runtime; the checker passes
    // `StratosScopeStrings`-typed values which match the underlying storage.
    return this.store.select(getCurrentUserStratosHasScope(scope as any));
  }

  /** Raw session data slice (for `apiKeyCheck`-style flows). */
  sessionData$(): Observable<SessionData | null> {
    return this.store.select(selectSessionData());
  }
}
