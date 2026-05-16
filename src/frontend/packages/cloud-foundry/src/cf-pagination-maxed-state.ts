import { Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppState,
  AuthDataService,
  PaginatedAction,
  SessionData,
  selectSessionData,
} from '@stratosui/store';

const ENTITY_TYPE_DEFAULT_MAX = 600;

/**
 * W36-C Wave 3: session-data reads route through {@link AuthDataService}
 * (the C-W1 signal-native facade) instead of `store.select(selectSessionData())`.
 *
 * The framework still hands these handlers a `Store` (call sites are in
 * `ListDataSource` and `MaxListMessageComponent`). At runtime Angular
 * populates `store.injector`, which lets us resolve `AuthDataService`
 * and bridge its `sessionData` signal back to an observable scoped to
 * the same injector. The legacy `store.select(selectSessionData())` path
 * remains as a fallback for unit tests that construct a bare `Store`
 * mock without an Injector — it is never exercised in production.
 *
 * When the auth reducer eventually collapses into `AuthDataService`,
 * the fallback branch and the `selectSessionData` import go away
 * together.
 */
function sessionData$(store: Store<AppState>): Observable<SessionData | null> {
  const injector = (store as unknown as { injector?: Injector }).injector;
  if (injector) {
    const authData = injector.get(AuthDataService, null);
    if (authData) {
      return toObservable(authData.sessionData, { injector });
    }
  }
  return store.select(selectSessionData());
}

export const cfMaxedStateHandlers = {
  canIgnoreMaxedState: (store: Store<AppState>) =>
    sessionData$(store).pipe(
      map(sessionData => !!sessionData?.config.listAllowLoadMaxed),
    ),

  maxedStateStartAt: (store: Store<AppState>, action: PaginatedAction) => {
    if (!action.flattenPaginationMax) {
      return of(null);
    }
    const beValue$ = sessionData$(store).pipe(
      map(sessionData => sessionData?.config.listMaxSize ?? null),
    );
    const userOverride$ = of(null);
    return combineLatest([beValue$, userOverride$]).pipe(
      map(([beValue, userOverride]) => userOverride || beValue || ENTITY_TYPE_DEFAULT_MAX),
    );
  },
};
