
import { of as observableOf, throwError as observableThrowError, Observable } from 'rxjs';

import { catchError, map, withLatestFrom, switchMap } from 'rxjs/operators';
import { selectNewAppCFDetails } from '../selectors/create-application.selectors';
import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import {
  AppNameFree,
  AppNameTaken,
  CHECK_NAME,
  IsNewAppNameFree
} from '../actions/create-applications-page.actions';
import { AppState } from './../app-state';
import { NewAppCFDetails, CreateNewApplicationState } from '../types/create-application.types';
import { environment } from '../../../core/src/environments/environment.prod';


@Injectable()
export class CreateAppPageEffects {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {
    this.proxyAPIVersion = environment.proxyAPIVersion;
    this.cfAPIVersion = environment.cfAPIVersion;
  }

  proxyAPIVersion: string;
  cfAPIVersion: string;

  @Effect() CheckAppNameIsFree$ = this.actions$.ofType<IsNewAppNameFree>(CHECK_NAME).pipe(
    withLatestFrom(this.store.select(selectNewAppCFDetails)),
    switchMap(([action, cfDetails]: [any, NewAppCFDetails]) => {
      const { cloudFoundry, org, space } = cfDetails;
      const headers = new Headers({ 'x-cap-cnsi-list': cloudFoundry });
      return this.http.get(`/pp/${this.proxyAPIVersion}/proxy/${this.cfAPIVersion}/apps`, {
        params: {
          'q': `name:${action.name};space_guid:${space}`
        },
        headers
      }).pipe(
        map(res => {
          const apps = res.json();
          const ourCfApps = apps[cloudFoundry];
          if (ourCfApps.total_results) {
            throw observableThrowError('Taken');
          }
          return new AppNameFree(action.name);
        }),
        catchError(err => {
          return observableOf(new AppNameTaken(action.name));
        }));
    }));
}

export const selectNewAppState = (state: AppState): CreateNewApplicationState => state.createApplication;
