import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import type { GitSCMService } from '@stratosui/git';
import { of as observableOf } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  CHECK_PROJECT_EXISTS,
  type CheckProjectExists,
  ProjectDoesntExist,
  ProjectExists,
  ProjectFetchFail,
} from '../../actions/deploy-applications.actions';
import type { CFAppState } from '../../cf-app-state';
import { selectDeployAppState } from '../selectors/deploy-application.selector';
import type { DeployApplicationState } from '../types/deploy-application.types';


@Injectable({
  providedIn: 'root'
})
export class DeployAppEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private httpClient: HttpClient,_gitSCMService: GitSCMService,
    private appRef: ApplicationRef
  ) { }

  
  checkAppExists$ = createEffect(() => this.actions$.pipe(
    ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS),
    withLatestFrom(this.store.select(selectDeployAppState)),
    filter(([, state]) => {
      return state.projectExists?.checking;
    }),
    switchMap(([action, _state]: [CheckProjectExists, DeployApplicationState]) => {
      return action.scm.getRepository(this.httpClient, action.projectName).pipe(
        map(res => {
          this.appRef.tick();
          return new ProjectExists(action.projectName, res);
        }),
        catchError(err => {
          this.appRef.tick();
          return observableOf(err.status === 404 ?
            new ProjectDoesntExist(action.projectName) :
            new ProjectFetchFail(action.projectName, action.scm.parseErrorAsString(err))
          );
        })
      );
    })
  ));

}
