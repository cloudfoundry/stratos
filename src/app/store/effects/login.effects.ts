import { AppState } from './../app-state';
import { Login, LOGIN, LoginSuccess, LoginFailed } from './../actions/auth.actions';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';

import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/switchMap';


@Injectable()
export class LoginEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  @Effect() apiRequest$ = this.actions$.ofType<Login>(LOGIN)
    .switchMap(({ username, password }) => {
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      const headers = new Headers();
      const params = new URLSearchParams();

      params.set('username', 'admin');
      params.set('password', 'hscadmin');

      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      return this.http.post('/pp/v1/auth/login/uaa', params, {
        headers
      })
      .map(data => new LoginSuccess(data.json()))
      .catch((err, caught) => [new LoginFailed(err)]);
    });
}
