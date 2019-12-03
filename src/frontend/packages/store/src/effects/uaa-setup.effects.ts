import { Injectable } from '@angular/core';
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
import { HttpClient } from '@angular/common/http';


@Injectable()
export class UAASetupEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions
  ) { }

  baseUrl = '/pp/v1/setup';

  @Effect() uaaSetupRequest$ = this.actions$.pipe(
    ofType<SetupUAA>(SETUP_UAA),
    switchMap(({ setupData }) => {
      const params = {
        console_client: setupData.console_client,
        username: setupData.username,
        password: setupData.password,
        skip_ssl_validation: setupData.skip_ssl_validation.toString() || 'false',
        uaa_endpoint: setupData.uaa_endpoint,
        use_sso: setupData.use_sso.toString() || 'false',
        console_client_secret: setupData.console_client_secret,
      };
      return this.http.post(`${this.baseUrl}/check`, null, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
        params
      }).pipe(
        map(data => new SetupUAASuccess(data)),
        catchError((err, caught) => [new SetupUAAFailed(`Failed to setup UAA endpoint. ${this.fetchError(err)}`)])
      );
    }));


  @Effect() uassSetScope = this.actions$.pipe(
    ofType<SetupUAASave>(SETUP_UAA_SAVE),
    switchMap(({ setupData }) => {
      const params = {
        console_client: setupData.console_client,
        username: setupData.username,
        password: setupData.password,
        skip_ssl_validation: setupData.skip_ssl_validation.toString() || 'false',
        uaa_endpoint: setupData.uaa_endpoint,
        use_sso: setupData.use_sso.toString() || 'false',
        console_admin_scope: setupData.console_admin_scope,

      };
      return this.http.post(this.baseUrl, null, {
        params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
      }).pipe(
        map(data => new SetupUAASuccess({})),
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
}
