import {
  GET_ENDPOINTS_FAILED,
  GET_ENDPOINTS_SUCCESS,
  GetAllEndpoints,
  GetAllEndpointsFailed,
  GetAllEndpointsSuccess,
} from '../actions/endpoint.actions';
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
import { MatDialog } from '@angular/material';
import { SessionData } from '../types/auth.types';


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
          return [new VerifiedSession(sessionData, action.updateEndpoints)];
        })
        .catch((err, caught) => {
          return action.login ? [new InvalidSession(err.status === 503)] : [new ResetAuth()];
        });
    });

  @Effect() verifiedAuth$ = this.actions$.ofType<VerifiedSession>(SESSION_VERIFIED)
    .mergeMap(action => {
      if (action.updateEndpoints) {
        return [new GetAllEndpoints(true)];
      }
      return [];
    });


  @Effect() EndpointsSuccess$ = this.actions$.ofType<GetAllEndpointsSuccess>(GET_ENDPOINTS_SUCCESS)
    .mergeMap(action => {
      if (action.login) {
        return [new LoginSuccess()];
      }
      return [];
    });

  @Effect() EndpointsFailed$ = this.actions$.ofType<GetAllEndpointsFailed>(GET_ENDPOINTS_FAILED)
    .map(action => {
      if (action.login) {
        return new LoginFailed(`Couldn't fetch endpoints.`);
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
      // Ensure that we clear any path fro mthe location (otherwise would be stored via auth gate as redirectPath for log in)
      window.location.assign(window.location.origin);
    });

}
