import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of as observableOf, throwError as observableThrowError } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';

import { environment } from '../../../../core/src/environments/environment.prod';
import { AppNameFree, AppNameTaken, CHECK_NAME, IsNewAppNameFree } from '../../actions/create-applications-page.actions';
import { CFAppState } from '../../cf-app-state';
import { selectNewAppCFDetails } from '../selectors/create-application.selectors';
import { CreateNewApplicationState, NewAppCFDetails } from '../types/create-application.types';
import { HttpClient } from '@angular/common/http';



@Injectable()
export class CreateAppPageEffects {
  private http = inject(HttpClient);
  private actions$ = inject(Actions);
  private store = inject<Store<CFAppState>>(Store);
  private appRef = inject(ApplicationRef);


  constructor() {
    this.proxyAPIVersion = environment.proxyAPIVersion;
    this.cfAPIVersion = environment.cfAPIVersion;
  }

  proxyAPIVersion: string;
  cfAPIVersion: string;

   CheckAppNameIsFree$ = createEffect(() => this.actions$.pipe(
    ofType<IsNewAppNameFree>(CHECK_NAME),
    withLatestFrom(this.store.select(selectNewAppCFDetails)),
    switchMap(([action, cfDetails]: [IsNewAppNameFree, NewAppCFDetails]) => {
      const { cloudFoundry, org: _org, space } = cfDetails;
      return this.http.get<{ [guid: string]: { total_results: number } }>(`/pp/${this.proxyAPIVersion}/proxy/${this.cfAPIVersion}/apps`, {
        params: {
          q: `name:${action.name};space_guid:${space}`
        },
        headers: { 'x-cap-cnsi-list': cloudFoundry }
      }).pipe(
        map((apps: { [guid: string]: { total_results: number } }) => {
          const ourCfApps = apps[cloudFoundry];
          if (ourCfApps.total_results) {
            throw observableThrowError('Taken');
          }
          this.appRef.tick();
          return new AppNameFree(action.name);
        }),
        catchError((_err: unknown) => {
          this.appRef.tick();
          return observableOf(new AppNameTaken(action.name));
        }));
    })));
}

export const selectNewAppState = (state: CFAppState): CreateNewApplicationState => state.createApplication;
