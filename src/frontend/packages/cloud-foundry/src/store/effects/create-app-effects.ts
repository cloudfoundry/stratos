import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of as observableOf, throwError as observableThrowError } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  AppNameFree,
  AppNameTaken,
  CHECK_NAME,
  IsNewAppNameFree,
} from '../../actions/create-applications-page.actions';
import { CFAppState } from '../../cf-app-state';
import { environment } from '../../../../core/src/environments/environment.prod';
import { selectNewAppCFDetails } from '../selectors/create-application.selectors';
import { CreateNewApplicationState, NewAppCFDetails } from '../types/create-application.types';



@Injectable()
export class CreateAppPageEffects {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<CFAppState>
  ) {
    this.proxyAPIVersion = environment.proxyAPIVersion;
    this.cfAPIVersion = environment.cfAPIVersion;
  }

  proxyAPIVersion: string;
  cfAPIVersion: string;

  @Effect() CheckAppNameIsFree$ = this.actions$.pipe(
    ofType<IsNewAppNameFree>(CHECK_NAME),
    withLatestFrom(this.store.select(selectNewAppCFDetails)),
    switchMap(([action, cfDetails]: [any, NewAppCFDetails]) => {
      const { cloudFoundry, org, space } = cfDetails;
      const headers = new Headers({ 'x-cap-cnsi-list': cloudFoundry });
      return this.http.get(`/pp/${this.proxyAPIVersion}/proxy/${this.cfAPIVersion}/apps`, {
        params: {
          q: `name:${action.name};space_guid:${space}`
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

export const selectNewAppState = (state: CFAppState): CreateNewApplicationState => state.createApplication;
