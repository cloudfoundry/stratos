import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';

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
  RESET_SSO_AUTH,
  ResetAuth,
  ResetSSOAuth,
  SESSION_INVALID,
  VerifiedSession,
  VERIFY_SESSION,
  VerifySession,
} from '../actions/auth.actions';
import { HydrateDashboardStateAction } from '../actions/dashboard-actions';
import { GET_ENDPOINTS_SUCCESS, GetAllEndpointsSuccess } from '../actions/endpoint.actions';
import { DispatchOnlyAppState } from '../app-state';
import { BrowserStandardEncoder } from '../browser-encoder';
import { getDashboardStateSessionId } from '../helpers/store-helpers';
import { stratosEntityCatalog } from '../stratos-entity-catalog';
import { SessionData } from '../types/auth.types';

const SETUP_HEADER = 'stratos-setup-required';
const UPGRADE_HEADER = 'retry-after';
const DOMAIN_HEADER = 'x-stratos-domain';
const SSO_HEADER = 'x-stratos-sso-login';

@Injectable()
export class AuthEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<DispatchOnlyAppState>,
  ) { }

  @Effect() loginRequest$ = this.actions$.pipe(
    ofType<Login>(LOGIN),
    switchMap(({ username, password }) => {
      const params = new HttpParams({
        encoder: new BrowserStandardEncoder(),
        fromObject: {
          username,
          password
        }
      });
      const headers = {
        'x-cap-request-date': (Math.floor(Date.now() / 1000)).toString()
      };

      return this.http.post('/pp/v1/auth/login/uaa', params, {
        headers,
      }).pipe(
        map(data => new VerifySession()),
        catchError((err, caught) => [new LoginFailed(err)]));
    }));

  @Effect() verifyAuth$ = this.actions$.pipe(
    ofType<VerifySession>(VERIFY_SESSION),
    switchMap(action => {
      const headers = {
        'x-cap-request-date': (Math.floor(Date.now() / 1000)).toString()
      };

      return this.http.get<SessionData>('/pp/v1/auth/session/verify', {
        headers,
        observe: 'response',
        withCredentials: true,
      }).pipe(
        mergeMap(response => {
          const sessionData = response.body;
          sessionData.sessionExpiresOn = parseInt(response.headers.get('x-cap-session-expires-on'), 10) * 1000;
          this.rehydrateDashboardState(this.store, sessionData);
          return [
            stratosEntityCatalog.systemInfo.actions.getSystemInfo(true),
            new VerifiedSession(sessionData, action.updateEndpoints)
          ];
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

  @Effect() EndpointsSuccess$ = this.actions$.pipe(
    ofType<GetAllEndpointsSuccess>(GET_ENDPOINTS_SUCCESS),
    mergeMap(action => {
      if (action.login) {
        return [new LoginSuccess()];
      }
      return [];
    }));

  @Effect() invalidSessionAuth$ = this.actions$.pipe(
    ofType<VerifySession>(SESSION_INVALID),
    map(() => {
      return new LoginFailed('Invalid session');
    }));

  @Effect() logoutRequest$ = this.actions$.pipe(
    ofType<Logout>(LOGOUT),
    switchMap(() => {
      return this.http.post('/pp/v1/auth/logout', {}).pipe(
        mergeMap((data: any) => {
          if (data.isSSO) {
            return [new LogoutSuccess(), new ResetSSOAuth()];
          } else {
            return [new LogoutSuccess(), new ResetAuth()];
          }
        }),
        catchError((err, caught) => [new LogoutFailed(err)]));
    }));

  @Effect({ dispatch: false }) resetAuth$ = this.actions$.pipe(
    ofType<ResetAuth>(RESET_AUTH),
    tap(() => {
      // Ensure that we clear any path from the location (otherwise would be stored via auth gate as redirectPath for log in)
      window.location.assign(window.location.origin);
    }));

  @Effect({ dispatch: false }) resetSSOAuth$ = this.actions$.pipe(
    ofType<ResetSSOAuth>(RESET_SSO_AUTH),
    tap(() => {
      // Ensure that we clear any path from the location (otherwise would be stored via auth gate as redirectPath for log in)
      const returnUrl = encodeURI(window.location.origin);
      window.open('/pp/v1/auth/sso_logout?state=' + returnUrl, '_self');
    }));

  private isDomainMismatch(headers): boolean {
    if (headers.has(DOMAIN_HEADER)) {
      const expectedDomain = headers.get(DOMAIN_HEADER);
      const okay = window.location.hostname.endsWith(expectedDomain);
      return !okay;
    }
    return false;
  }

  private rehydrateDashboardState(store: Store<DispatchOnlyAppState>, sessionData: SessionData) {
    const storage = localStorage || window.localStorage;
    // We use the username to key the session storage. We could replace this with the users id?
    if (storage && sessionData.user) {
      const sessionId = getDashboardStateSessionId(sessionData.user.name);
      if (sessionId) {
        try {
          const dashboardData = JSON.parse(storage.getItem(sessionId));
          store.dispatch(new HydrateDashboardStateAction(dashboardData));
        } catch (e) {
          console.warn('Failed to parse user settings from session storage, consider clearing them manually', e);
        }
      }
    }
  }
}
