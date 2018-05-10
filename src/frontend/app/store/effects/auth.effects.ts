import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptionsArgs, URLSearchParams } from '@angular/http';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { BrowserStandardEncoder } from '../../helper';
import { GET_ENDPOINTS_SUCCESS, GetAllEndpointsSuccess } from '../actions/endpoint.actions';
import { GetSystemInfo } from '../actions/system.actions';
import { SessionData } from '../types/auth.types';
import {
  InvalidSession,
  LOGIN,
  Login,
  LoginFailed,
  LoginSuccess,
  LOGOUT,
  Logout,
  LogoutFailed,
  LogoutSuccess,
  RESET_AUTH,
  ResetAuth,
  SESSION_INVALID,
  VerifiedSession,
  VERIFY_SESSION,
  VerifySession,
} from './../actions/auth.actions';
import { AppState } from './../app-state';

const SETUP_HEADER = 'stratos-setup-required';
const UPGRADE_HEADER = 'retry-after';

@Injectable()
export class AuthEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>,
    private router: Router,
    public dialog: MatDialog
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
      const params = new URLSearchParams('', new BrowserStandardEncoder());

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
          return [new GetSystemInfo(true), new VerifiedSession(sessionData, action.updateEndpoints)];
        })
        .catch((err, caught) => {
          let setupMode = false;
          let isUpgrading = false;
          if (err.status === 503) {
            setupMode = err.headers.has(SETUP_HEADER);
            isUpgrading = err.headers.has(UPGRADE_HEADER);
          }

          return action.login ? [new InvalidSession(setupMode, isUpgrading)] : [new ResetAuth()];
        });
    });

  @Effect() EndpointsSuccess$ = this.actions$.ofType<GetAllEndpointsSuccess>(GET_ENDPOINTS_SUCCESS)
    .mergeMap(action => {
      if (action.login) {
        return [new LoginSuccess()];
      }
      return [];
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
      // Ensure that we clear any path fro mthe location (otherwise would be stored via auth gate as redirectPath for log in)
      window.location.assign(window.location.origin);
    });

}
