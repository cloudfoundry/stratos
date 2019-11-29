import { UaaSetupData, LocalAdminSetupData } from './../types/uaa-setup.types';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  SETUP_UAA,
  SetupUAA,
  SetupUAAFailed,
  SetupUAASuccess,
  SETUP_UAA_SAVE,
  SetupUAASave,
} from './../actions/setup.actions';


@Injectable()
export class UAASetupEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions
  ) { }

  baseUrl = '/pp/v1/setup';
  uaaSetupUrl = '/pp/v1/setup/check';

  @Effect() uaaSetupRequest$ = this.actions$.pipe(
    ofType<SetupUAA>(SETUP_UAA),
    switchMap(({ setupData }) => {
      const params = this.getParams(setupData);
      return this.http.post(this.uaaSetupUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).pipe(
        map(data => new SetupUAASuccess(data)),
        catchError((err, caught) => [new SetupUAAFailed(`Failed to save UAA configuration. ${this.fetchError(err)}`)])
      );
    }));

  @Effect() uaaSetupSetScope = this.actions$.pipe(
    ofType<SetupUAASave>(SETUP_UAA_SAVE),
    switchMap(({ setupData }) => {
      const params = this.getParams(setupData);
      return this.http.post(this.baseUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).pipe(
        map(data => new SetupUAASuccess(data)),
        catchError((err, caught) => [new SetupUAAFailed(`Failed to setup Administrator scope. ${this.fetchError(err)}`)])
      );
    }));

  private fetchError(err): string {
    try {
      const body = JSON.parse(err._body);
      return body.error;
    } catch (err) { }
    return '';
  }
  private getParams(setupData: any): HttpParams {
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
