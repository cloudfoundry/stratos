import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { RouterNav, AppState } from '@stratosui/store';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';

const { proxyAPIVersion } = environment;

export const notSetupGuard: CanActivateFn = (): Observable<boolean> => {
  const http = inject(HttpClient);
  const store = inject(Store<AppState>);

  const url = `/api/${proxyAPIVersion}/auth/verify`;
  return http.get(url).pipe(
    map(_v => {
      // If the requests succeeds, then the user has a session, so everything must be setup already
      return false;
    }),
    catchError(err => {
      const needsSetup = err.status === 503 && err.headers.has('stratos-setup-required');
      return observableOf(needsSetup);
    }),
    tap(result => {
      // False means already setup, so should not be able to access /uaa endpoint
      if (!result) {
        store.dispatch(new RouterNav({
          path: ['/not-found']
        }));
      }
    })
  );
};

// Legacy class-based guard for backward compatibility during migration
// @deprecated Use notSetupGuard functional guard instead
export const NotSetupGuardService = notSetupGuard;
