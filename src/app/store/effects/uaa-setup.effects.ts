import {
  SETUP_UAA,
  SETUP_UAA_SCOPE,
  SetupUAA,
  SetupUAASuccess,
  SetupUAAFailed,
  SetUAAScope
} from './../actions/setup.actions';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Actions, Effect } from '@ngrx/effects';
import { Injectable } from '@angular/core';

@Injectable()
export class UAASetupEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  baseUrl = '/pp/v1/setup';

  @Effect() uaaSetupRequest$ = this.actions$.ofType<SetupUAA>(SETUP_UAA)
    .switchMap(({ setupData }) => {

      const headers = new Headers();
      const params = new URLSearchParams();

      params.set('console_client', setupData.console_client);
      params.set('username', setupData.username);
      params.set('password', setupData.password);
      params.set('skip_ssl_validation', setupData.skip_ssl_validation.toString() || 'false');
      params.set('uaa_endpoint', setupData.uaa_endpoint);

      if (setupData.console_client_secret) {
        params.set('console_client_secret', setupData.console_client_secret);
      }

      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      return this.http.post(this.baseUrl, params, {
        headers
      })
        .map(data => new SetupUAASuccess(data.json()))
        .catch((err, caught) => [new SetupUAAFailed(err)]);
    });

  @Effect() uassSetScope = this.actions$.ofType<SetUAAScope>(SETUP_UAA_SCOPE)
    .switchMap(({ scope }) => {
      const headers = new Headers();
      const params = new URLSearchParams();

      params.set('console_admin_scope', scope);
      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      return this.http.post(`${this.baseUrl}/update`, params, {
        headers
      })
        .map(data => new SetupUAASuccess({}))
        .catch((err, caught) => [new SetupUAAFailed(err)]);
    });

}
