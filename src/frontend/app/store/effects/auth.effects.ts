import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { mergeMap, tap, switchMap, catchError, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';

import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { BrowserStandardEncoder } from '../../helper';
import { GET_ENDPOINTS_SUCCESS, GetAllEndpointsSuccess } from '../actions/endpoint.actions';
import { GetSystemInfo } from '../actions/system.actions';
import { AppState } from '../app-state';
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
  ResetSSOAuth,
  RESET_SSO_AUTH,
} from './../actions/auth.actions';

const SETUP_HEADER = 'stratos-setup-required';
const UPGRADE_HEADER = 'retry-after';
const DOMAIN_HEADER = 'x-stratos-domain';
const SSO_HEADER = 'x-stratos-sso-login';

@Injectable()
export class AuthEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
    private router: Router,
    public dialog: MatDialog
  ) { }

  @Effect() loginRequest$ = this.actions$.ofType<Login>(LOGIN).pipe(
    switchMap(({ username, password }) => {
      const encoder = new BrowserStandardEncoder();
      const headers = new HttpHeaders();
      const params = new HttpParams({
        encoder: new BrowserStandardEncoder(),
        fromObject: {
          username: username,
          password: password
        }
      });

      headers.set('Content-Type', 'application/x-www-form-urlencoded');
      headers.set('x-cap-request-date', (Math.floor(Date.now() / 1000)).toString());
      return this.http.post('/pp/v1/auth/login/uaa', params, {
        headers: headers,
      }).pipe(
        map(data => new VerifySession()),
        catchError((err, caught) => [new LoginFailed(err)]), );
    }));

  @Effect() verifyAuth$ = this.actions$.ofType<VerifySession>(VERIFY_SESSION).pipe(
    switchMap(action => {
      const headers = new HttpHeaders();
      headers.set('x-cap-request-date', (Math.floor(Date.now() / 1000)).toString());
      return this.http.get<SessionData>('/pp/v1/auth/session/verify', {
        headers: headers,
        observe: 'response',
        withCredentials: true,
      }).pipe(
        mergeMap(response => {
          const sessionData = response.body;
          sessionData.sessionExpiresOn = parseInt(response.headers.get('x-cap-session-expires-on'), 10) * 1000;
          return [new GetSystemInfo(true), new VerifiedSession(sessionData, action.updateEndpoints)];
        }),
        catchError((err, caught) => {
          let setupMode = false;
          let isUpgrading = false;
          const ssoOptions = err.headers.get(SSO_HEADER) as string;
          if (err.status === 503) {
            setupMode = err.headers.has(SETUP_HEADER);
            isUpgrading = err.headers.has(UPGRADE_HEADER);
          }

          // Check for cookie domain mismatch with the requesting URL
          const isDomainMismatch = this.isDomainMismatch(err.headers);
          return action.login ? [new InvalidSession(setupMode, isUpgrading, isDomainMismatch, ssoOptions)] : [new ResetAuth()];
        }));
    }));

  @Effect() EndpointsSuccess$ = this.actions$.ofType<GetAllEndpointsSuccess>(GET_ENDPOINTS_SUCCESS).pipe(
    mergeMap(action => {
      if (action.login) {
        return [new LoginSuccess()];
      }
      return [];
    }));

  @Effect() invalidSessionAuth$ = this.actions$.ofType<VerifySession>(SESSION_INVALID).pipe(
    map(() => {
      return new LoginFailed('Invalid session');
    }));

  @Effect() logoutRequest$ = this.actions$.ofType<Logout>(LOGOUT).pipe(
    switchMap(() => {
      return this.http.post('/pp/v1/auth/logout', {}).pipe(
        mergeMap((data: any) => {
          if (data.isSSO) {
            return [new LogoutSuccess(), new ResetSSOAuth()];
          } else {
            return [new LogoutSuccess(), new ResetAuth()];
          }
        }),
        catchError((err, caught) => [new LogoutFailed(err)]), );
    }));

  @Effect({ dispatch: false }) resetAuth$ = this.actions$.ofType<ResetAuth>(RESET_AUTH).pipe(
    tap(() => {
      // Ensure that we clear any path from the location (otherwise would be stored via auth gate as redirectPath for log in)
      window.location.assign(window.location.origin);
    }));

    @Effect({ dispatch: false }) resetSSOAuth$ = this.actions$.ofType<ResetSSOAuth>(RESET_SSO_AUTH).pipe(
      tap((action) => {
        // Ensure that we clear any path from the location (otherwise would be stored via auth gate as redirectPath for log in)
        const returnUrl = encodeURI(window.location.origin);
        window.open('/pp/v1/auth/sso_logout?state=' + returnUrl , '_self');
      }));

  private isDomainMismatch(headers): boolean {
    if (headers.has(DOMAIN_HEADER)) {
      const expectedDomain = headers.get(DOMAIN_HEADER);
      const okay = window.location.hostname.endsWith(expectedDomain);
      return !okay;
    }
    return false;
  }
}
