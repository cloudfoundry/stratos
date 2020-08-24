import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Store } from '@ngrx/store';
import { RouterNav, AppState } from '@stratosui/store';
import { Observable, of as observableOf } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';

const { proxyAPIVersion } = environment;

@Injectable()
export class NotSetupGuardService implements CanActivate {

  constructor(
    private http: HttpClient,
    private store: Store<AppState>
  ) { }

  canActivate(): Observable<boolean> {

    const url = `/pp/${proxyAPIVersion}/auth/session/verify`;
    return this.http.get(url).pipe(
      map(v => {
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
          this.store.dispatch(new RouterNav({
            path: ['/not-found']
          }));
        }
      })
    );
  }

}
