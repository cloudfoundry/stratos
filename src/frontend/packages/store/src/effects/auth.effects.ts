import { HttpClient, HttpParams } from '@angular/common/http';
import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { from } from 'rxjs';
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
  SESSION_VERIFIED,
  VerifiedSession,
  VERIFY_SESSION,
  VerifySession,
} from '../actions/auth.actions';
import { DispatchOnlyAppState } from '../app-state';
import { BrowserStandardEncoder } from '../browser-encoder';
import { LocalStorageService } from '../helpers/local-storage-service';
import { EndpointsDataService } from '../services/endpoints-data.service';
import { SessionDataEnvelope } from '../types/auth.types';
import { StratosBrandingService } from '@stratosui/theme';
import { DashboardDataService } from '../../../core/src/core/dashboard-data.service';

const SETUP_HEADER = 'stratos-setup-required';
const UPGRADE_HEADER = 'retry-after';
const DOMAIN_HEADER = 'x-stratos-domain';
const SSO_HEADER = 'x-stratos-sso-login';

@Injectable({
  providedIn: 'root'
})
export class AuthEffect {
  private http = inject(HttpClient);
  private actions$ = inject(Actions);
  private store = inject<Store<DispatchOnlyAppState>>(Store);
  private appRef = inject(ApplicationRef);
  private branding = inject(StratosBrandingService);
  private dashboardData = inject(DashboardDataService);
  private endpointsService = inject(EndpointsDataService);


   loginRequest$ = createEffect(() => this.actions$.pipe(
    ofType<Login>(LOGIN),
    switchMap(({ username, password }: { username: string; password: string }) => {
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
        withCredentials: true
      }).pipe(
        map(_data => {
          this.appRef.tick();
          return new VerifySession();
        }),
        catchError((err, _caught) => {
          this.appRef.tick();
          return [new LoginFailed(err)];
        }));
    })));

   verifyAuth$ = createEffect(() => this.actions$.pipe(
    ofType<VerifySession>(VERIFY_SESSION),
    switchMap(action => {
      const headers = {
        'x-cap-request-date': (Math.floor(Date.now() / 1000)).toString()
      };

      return this.http.get<SessionDataEnvelope>('/api/v1/auth/verify', {
        headers,
        observe: 'response',
        withCredentials: true,
      }).pipe(
        mergeMap(response => {
          const envelope = response.body;
          if (envelope.status === 'error') {
            const ssoOptions = response.headers.get(SSO_HEADER) as string;
            // Check for cookie domain mismatch with the requesting URL
            const isDomainMismatch = this.isDomainMismatch(response.headers);
            this.appRef.tick();
            return action.login ? [new InvalidSession(false, false, isDomainMismatch, ssoOptions)] : [new ResetAuth()];
          } else {
            const sessionData = envelope.data;
            sessionData.sessionExpiresOn = parseInt(response.headers.get('x-cap-session-expires-on'), 10) * 1000;
            LocalStorageService.localStorageToStore(this.store, sessionData, this.dashboardData);
            this.branding.activateUserPreferences();
            this.appRef.tick();
            // Wave 5 (W36-B): replaces the legacy
            // `stratosEntityCatalog.systemInfo.actions.getSystemInfo(true)`
            // dispatch + `EndpointsSuccess$` listener pair. The
            // EndpointsDataService.getAll(true) call hydrates the
            // endpoints map and (on success) triggers LoginSuccess
            // directly — collapsing the legacy two-action saga into a
            // single Promise chain per audit decision B.
            const verified: Action = new VerifiedSession(sessionData, action.updateEndpoints);
            return from(
              this.endpointsService.getAll(true)
                .then(() => {
                  this.appRef.tick();
                  return action.login
                    ? [verified, new LoginSuccess()]
                    : [verified];
                })
                .catch(() => [verified])
            ).pipe(mergeMap(actions => actions));
          }
        }),
        catchError((err, _caught) => {
          let setupMode = false;
          let isUpgrading = false;
          const ssoOptions = err.headers.get(SSO_HEADER) as string;
          if (err.status === 503) {
            setupMode = err.headers.has(SETUP_HEADER);
            isUpgrading = err.headers.has(UPGRADE_HEADER);
          }

          // Check for cookie domain mismatch with the requesting URL
          const isDomainMismatch = this.isDomainMismatch(err.headers);
          this.appRef.tick();
          return action.login ? [new InvalidSession(setupMode, isUpgrading, isDomainMismatch, ssoOptions)] : [new ResetAuth()];
        }));
    })));

   invalidSessionAuth$ = createEffect(() => this.actions$.pipe(
    ofType<VerifySession>(SESSION_INVALID),
    map(() => {
      this.appRef.tick();
      return new LoginFailed('Invalid session');
    })));

  // Trigger change detection after session is verified and endpoints are loaded into store
  // This ensures zoneless change detection updates components that depend on endpoint data
   sessionVerified$ = createEffect(() => this.actions$.pipe(
    ofType<VerifiedSession>(SESSION_VERIFIED),
    tap(() => {
      // The SESSION_VERIFIED reducer has already updated the store with endpoint data
      // Trigger change detection so components can react to the state changes
      this.appRef.tick();
    })), { dispatch: false });

   logoutRequest$ = createEffect(() => this.actions$.pipe(
    ofType<Logout>(LOGOUT),
    switchMap(() => {
      return this.http.post('/pp/v1/auth/logout', {}, {
        withCredentials: true
      }).pipe(
        mergeMap((data: any) => {
          this.appRef.tick();
          if (data.isSSO) {
            return [new LogoutSuccess(), new ResetSSOAuth()];
          } else {
            return [new LogoutSuccess(), new ResetAuth()];
          }
        }),
        catchError((err, _caught) => {
          this.appRef.tick();
          return [new LogoutFailed(err)];
        }));
    })));

   resetAuth$ = createEffect(() => this.actions$.pipe(
    ofType<ResetAuth>(RESET_AUTH),
    tap(() => {
      // Ensure that we clear any path from the location (otherwise would be stored via auth gate as redirectPath for log in)
      window.location.assign(window.location.origin);
      this.appRef.tick();
    })), { dispatch: false });

   resetSSOAuth$ = createEffect(() => this.actions$.pipe(
    ofType<ResetSSOAuth>(RESET_SSO_AUTH),
    tap(() => {
      // Ensure that we clear any path from the location (otherwise would be stored via auth gate as redirectPath for log in)
      const returnUrl = encodeURI(window.location.origin);
      window.open('/pp/v1/auth/sso_logout?state=' + returnUrl, '_self');
      this.appRef.tick();
    })), { dispatch: false });

  private isDomainMismatch(headers: any): boolean {
    if (headers.has(DOMAIN_HEADER)) {
      const expectedDomain = headers.get(DOMAIN_HEADER);
      const okay = window.location.hostname.endsWith(expectedDomain);
      return !okay;
    }
    return false;
  }


}
