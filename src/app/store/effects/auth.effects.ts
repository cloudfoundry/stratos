import { AppState } from './../app-state';
import {
  InvalidSession,
  Login,
  LOGIN,
  LoginFailed,
  LoginSuccess,
  SESSION_INVALID,
  SessionData,
  VerifiedSession,
  VERIFY_SESSION,
  VerifySession,
} from './../actions/auth.actions';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';

import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/switchMap';


@Injectable()
export class AuthEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() loginRequest$ = this.actions$.ofType<Login>(LOGIN)
    .switchMap(({ username, password }) => {
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      const headers = new Headers();
      const params = new URLSearchParams();

      params.set('username', username);
      params.set('password', password);

      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      return this.http.post('/pp/v1/auth/login/uaa', params, {
        headers
      })
        .map(data => new VerifySession())
        .catch((err, caught) => [new LoginFailed(err)]);
    });

  @Effect() verifyAuth$ = this.actions$.ofType<VerifySession>(VERIFY_SESSION)
    .switchMap(() => {
      return this.http.get('/pp/v1/auth/session/verify')
        .mergeMap(data => {
          return [new VerifiedSession(data.json()), new LoginSuccess()];
        })
        .catch((err, caught) => {
          return [new InvalidSession(err.status === 503)];
        });
    });

  @Effect() invalidSessionAuth$ = this.actions$.ofType<VerifySession>(SESSION_INVALID)
    .map(() => {
      return new LoginFailed('Invalid session');
    });

}
