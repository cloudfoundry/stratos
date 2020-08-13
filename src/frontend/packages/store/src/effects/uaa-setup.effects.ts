import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';

import { isHttpErrorResponse } from '../jetstream';
import {
  SETUP_GET_SCOPES,
  SETUP_SAVE_CONFIG,
  SetupConsoleGetScopes,
  SetupFailed,
  SetupSaveConfig,
  SetupSuccess,
} from './../actions/setup.actions';
import { LocalAdminSetupData, UaaSetupData } from './../types/uaa-setup.types';


@Injectable()
export class UAASetupEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions
  ) { }

  getSetupScopesUrl = '/pp/v1/setup/check';
  saveSetupUrl = '/pp/v1/setup/save';

  @Effect() setupGetScopes$ = this.actions$.pipe(
    ofType<SetupConsoleGetScopes>(SETUP_GET_SCOPES),
    switchMap(({ setupData }) => {
      const params = this.getParams(setupData);
      return this.http.post(this.getSetupScopesUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).pipe(
        map(data => new SetupSuccess(data)),
        catchError((err, caught) => [new SetupFailed(`Failed to save configuration. ${this.fetchError(err)}`)])
      );
    }));

  @Effect() setupSaveConfiguration$ = this.actions$.pipe(
    ofType<SetupSaveConfig>(SETUP_SAVE_CONFIG),
    switchMap(({ setupData }) => {
      const params = this.getParams(setupData);
      return this.http.post(this.saveSetupUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).pipe(
        map(data => new SetupSuccess(data)),
        catchError((err, caught) => [new SetupFailed(`Failed to setup Administrator scope. ${this.fetchError(err)}`)])
      );
    }));

  private fetchError(err): string {
    const httpResponse = isHttpErrorResponse(err);
    if (httpResponse) {
      if (httpResponse.error.error) {
        return httpResponse.error.error;
      }
      try {
        const body = JSON.parse(httpResponse.error);
        return body;
      } catch (err) { }
    }
    return '';
  }


  private getParams(setupData: any): any {
    let params = new HttpParams();
    if ((setupData as UaaSetupData).console_client) {
      const uaaSetupData = setupData as UaaSetupData;
      params = params
        .set('console_client', uaaSetupData.console_client)
        .set('username', uaaSetupData.username)
        .set('password', uaaSetupData.password)
        .set('skip_ssl_validation', uaaSetupData.skip_ssl_validation.toString() || 'false')
        .set('uaa_endpoint', uaaSetupData.uaa_endpoint)
        .set('use_sso', uaaSetupData.use_sso.toString() || 'false');
      if (uaaSetupData.console_client_secret) {
        params = params.append('console_client_secret', uaaSetupData.console_client_secret);
      }
      if (uaaSetupData.console_admin_scope) {
        params = params.set('console_admin_scope', uaaSetupData.console_admin_scope);
      }
    } else {
      const localSetupData = setupData as LocalAdminSetupData;
      params = params.set('local_admin_password', localSetupData.local_admin_password);
    }
    return params;
  }
}
