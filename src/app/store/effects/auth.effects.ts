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
  VerifiedSession,
  VERIFY_SESSION,
  VerifySession,
  SESSION_VERIFIED,
  LogoutFailed,
  Logout,
  LOGOUT,
  LogoutSuccess,
  LOGOUT_SUCCESS,
  ResetAuth,
  RESET_AUTH,
} from './../actions/auth.actions';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams, RequestOptionsArgs } from '@angular/http';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import { Router } from '@angular/router';
import { MdDialog } from '@angular/material';
import { SessionData } from '../types/auth.types';


@Injectable()
export class AuthEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>,
    private router: Router,
    public dialog: MdDialog
  ) { }

  @Effect() loginRequest$ = this.actions$.ofType<Login>(LOGIN)
    .switchMap(({ username, password }) => {
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-cap-request-date': Math.floor(Date.now() / 1000)
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
    .switchMap((action) => {
      const options: RequestOptionsArgs = {
        headers: new Headers({ 'x-cap-request-date': Math.floor(Date.now() / 1000) }),
        withCredentials: true
      };
      return this.http.get('/pp/v1/auth/session/verify', options)
        .mergeMap(data => {
          const sessionData: SessionData = data.json();
          sessionData.sessionExpiresOn = parseInt(data.headers.get('x-cap-session-expires-on'), 10) * 1000;
          return [new VerifiedSession(sessionData, action.updateCNSIs)];
        })
        .catch((err, caught) => {
          return action.login ? [new InvalidSession(err.status === 503, window.location.pathname)] : [new ResetAuth()];
        });
    });

  @Effect() verifiedAuth$ = this.actions$.ofType<VerifiedSession>(SESSION_VERIFIED)
    .mergeMap(action => {
      if (action.updateCNSIs) {
        return [new GetAllCNSIS(true)];
      }
      return [];
    });


  @Effect() CnsisSuccess$ = this.actions$.ofType<GetAllCNSISSuccess>(GET_CNSIS_SUCCESS)
    .mergeMap(action => {
      if (action.login) {
        return [new LoginSuccess()];
      }
      return [];
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

  @Effect() logoutRequest$ = this.actions$.ofType<Logout>(LOGOUT)
    .switchMap(() => {
      return this.http.post('/pp/v1/auth/logout', {})
        .mergeMap(data => [new LogoutSuccess(), new ResetAuth()])
        .catch((err, caught) => [new LogoutFailed(err)]);
    });

  @Effect({ dispatch: false }) resetAuth$ = this.actions$.ofType<ResetAuth>(RESET_AUTH)
    .do(() => {
      window.location.reload();
      // this.dialog.closeAll();
      // this.router.navigateByUrl('/login');
    });

}
