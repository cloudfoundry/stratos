import { Injectable, inject } from '@angular/core';
import {
  AuthDataService,
  CurrentUserRolesDataService,
  PermissionValues,
  SessionData,
} from '@stratosui/store';
import { Observable, distinctUntilChanged } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * W36-C Wave 2 — thin facade over {@link CurrentUserRolesDataService}
 * and {@link AuthDataService}.
 *
 * Preserves the existing observable surface the
 * `StratosUserPermissionsChecker` (and any other checker importing this
 * service) was written against. The single `Store` bridge moved into
 * `CurrentUserRolesDataService` (for the `currentUserRoles` slice) and
 * `AuthDataService` (for the `auth.sessionData` slice). This service no
 * longer touches `Store`.
 *
 * Consumers receive `Observable<...>` return values to keep the existing
 * `combineLatest` / `switchMap` pipelines in the checkers untouched. New
 * code should inject the data services directly for signal-shaped APIs.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserRolesSignalService {
  private rolesData = inject(CurrentUserRolesDataService);
  private authData = inject(AuthDataService);

  /**
   * Bridge `AuthDataService.sessionData` (Signal) back to an Observable so
   * the existing `apiKeyCheck` pipeline stays observable-shaped. Field-init
   * runs in the injection context so `toObservable` works without an
   * explicit injector.
   */
  private readonly sessionData$$: Observable<SessionData | null> =
    toObservable(this.authData.sessionData);

  /** Whether the current user holds the named stratos role (e.g. `isAdmin`). */
  stratosRole$(role: PermissionValues): Observable<boolean> {
    return this.rolesData.stratosRole$(role);
  }

  /** Whether the current user's stratos scopes include the named scope. */
  stratosHasScope$(scope: string): Observable<boolean> {
    return this.rolesData.stratosHasScope$(scope);
  }

  /** Raw session data slice (for `apiKeyCheck`-style flows). */
  sessionData$(): Observable<SessionData | null> {
    return this.sessionData$$.pipe(distinctUntilChanged());
  }
}
