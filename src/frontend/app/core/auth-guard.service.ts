import { RouterNav } from '../store/actions/router.actions';
import { Observable } from 'rxjs/Rx';

import { VerifySession } from '../store/actions/auth.actions';
import { AppState } from '../store/app-state';
import { AuthState } from '../store/reducers/auth.reducer';

import { Store } from '@ngrx/store';

import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';

import 'rxjs/add/operator/skipWhile';

@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) { }

  canActivate(): Observable<boolean> {
    return this.store.select('auth')
      .map((state: AuthState) => {
        // Upgrade in progress
        if (state.sessionData && state.sessionData.upgradeInProgress) {
          this.store.dispatch(new RouterNav({ path: ['/upgrade'], extras: { skipLocationChange: true } }));
          return false;
        }
        if (state.sessionData && state.sessionData.uaaError) {
          this.store.dispatch(new RouterNav({ path: ['/uaa'] }));
          return false;
        }
        if (!state.sessionData || !state.sessionData.valid) {
          this.store.dispatch(new RouterNav({
            path: ['/login']
          }, window.location.pathname));
          return false;
        }
        return true;
      }).first();
  }

}
