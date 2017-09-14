import {
  GET_CNSIS_FAILED,
  GET_CNSIS_SUCCESS,
  GetAllCNSIS,
  GetAllCNSISFailed,
  GetAllCNSISSuccess,
} from './../actions/cnsis.actions';
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
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';


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
      return this.http.get('/pp/v1/auth/session/verify', { withCredentials: true })
        .mergeMap(data => {
          return [new VerifiedSession(data.json()), new GetAllCNSIS(true)];
        })
        .catch((err, caught) => {
          return [new InvalidSession(err.status === 503)];
        });
    });

  @Effect() CnsisSuccess$ = this.actions$.ofType<GetAllCNSISSuccess>(GET_CNSIS_SUCCESS)
    .map(action => {
      if (action.login) {
        return new LoginSuccess();
      }
    });

  @Effect() CnsisFailed$ = this.actions$.ofType<GetAllCNSISFailed>(GET_CNSIS_FAILED)
    .map(action => {
      if (action.login) {
        return new LoginFailed(`Couldn't fetch cnsis.`);
      }
    });

  @Effect() invalidSessionAuth$ = this.actions$.ofType<VerifySession>(SESSION_INVALID)
    .map(() => {
      return new LoginFailed('Invalid session');
    });

}
