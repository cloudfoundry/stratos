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
        if (!state.verifying && !state.sessionData) {
          this.store.dispatch(new VerifySession());
        }
        return state;
      })
      .skipWhile((state: AuthState) => {
        return !state.loggedIn && !state.error;
      })
      .map((state: AuthState) => {
        if (state.sessionData.valid) {
          return true;
        } else {
          state.sessionData.uaaError ?
            this.store.dispatch(new RouterNav({ path: ['/uaa'] })) :
            this.store.dispatch(new RouterNav({ path: ['/login'] }));
          return false;
        }
      });
  }

}
