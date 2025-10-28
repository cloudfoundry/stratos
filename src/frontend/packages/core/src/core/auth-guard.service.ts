import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { RouterNav, InternalAppState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

export function queryParamMap(): { [key: string]: string } {
  const paramMap = {};
  const query = window.location.search.substring(1);
  if (query.length === 0) {
    return paramMap;
  }
  const vars = query.split('&');
  for (const pair of vars) {
    const vals = pair.split('=');
    paramMap[decodeURIComponent(vals[0])] = decodeURIComponent(vals[1]);
  }
  return paramMap;
}

export const authGuard: CanActivateFn = (): Observable<boolean> => {
  const store = inject(Store<InternalAppState>);

  return store.select('auth').pipe(
    map((state) => {
      if (!state.sessionData || !state.sessionData.valid) {
        store.dispatch(new RouterNav({
          path: ['/login']
        }, {
            path: window.location.pathname,
            queryParams: queryParamMap()
          }));
        return false;
      }
      return true;
    }),
    first()
  );
};

// Legacy class-based guard for backward compatibility during migration
// @deprecated Use authGuard functional guard instead
export const AuthGuardService = authGuard;
