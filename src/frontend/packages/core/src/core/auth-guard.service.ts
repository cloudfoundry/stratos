import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { InternalAppState, RouterNav } from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { AuthSignalService } from './signals/auth-signal.service';

export function queryParamMap(): { [key: string]: string } {
  const paramMap: { [key: string]: string } = {};
  const query = window.location.search.substring(1);
  if (query.length === 0) {
    return paramMap;
  }
  const searchParams = new URLSearchParams(query);
  searchParams.forEach((value, key) => {
    paramMap[key] = value;
  });
  return paramMap;
}

function snapshotToQueryParams(state: RouterStateSnapshot): { [key: string]: string } {
  const params: { [key: string]: string } = {};
  const queryIndex = state.url.indexOf('?');
  if (queryIndex === -1) {
    return params;
  }

  const search = state.url.substring(queryIndex + 1);
  const searchParams = new URLSearchParams(search);
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

export const authGuard: CanActivateFn = (_route, state): Observable<boolean> => {
  const store = inject(Store<InternalAppState>);
  const authSignals = inject(AuthSignalService);

  // Read the auth slice via the signal-native projection. Store remains
  // injected only for the RouterNav dispatch on redirect.
  return toObservable(authSignals.auth).pipe(
    // Wait for auth state to stabilize before evaluation
    // This prevents redirecting to /login during transient state updates
    filter(authState => !!authState && !authState.verifying),
    map((authState) => {
      if (!authState.sessionData || !authState.sessionData.valid) {
        const [pathOnly] = state.url ? state.url.split('?') : ['/'];
        const targetPath = pathOnly && pathOnly !== '/' && pathOnly.length > 0 ? pathOnly : '/home';
        store.dispatch(new RouterNav({
          path: ['/login']
        }, {
            path: targetPath,
            queryParams: snapshotToQueryParams(state)
          }));
        return false;
      }
      return true;
    }),
    take(1)
  );
};

// Legacy class-based guard for backward compatibility during migration
// @deprecated Use authGuard functional guard instead
export const AuthGuardService = authGuard;
