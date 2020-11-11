import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { GitSCMService } from '@stratosui/git';
import { of as observableOf } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  CHECK_PROJECT_EXISTS,
  CheckProjectExists,
  ProjectDoesntExist,
  ProjectExists,
  ProjectFetchFail,
} from '../../actions/deploy-applications.actions';
import { CFAppState } from '../../cf-app-state';
import { selectDeployAppState } from '../selectors/deploy-application.selector';


@Injectable()
export class DeployAppEffects {
  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
    private httpClient: HttpClient,
    private gitSCMService: GitSCMService
  ) { }

  @Effect()
  checkAppExists$ = this.actions$.pipe(
    ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS),
    withLatestFrom(this.store.select(selectDeployAppState)),
    filter(([, state]) => {
      return state.projectExists && state.projectExists.checking;
    }),
    switchMap(([action, state]: [CheckProjectExists, any]) => {
      return action.scm.getRepository(this.httpClient, action.projectName).pipe(
        map(res => new ProjectExists(action.projectName, res)),
        catchError(err => observableOf(err.status === 404 ?
          new ProjectDoesntExist(action.projectName) :
          new ProjectFetchFail(action.projectName, action.scm.parseErrorAsString(err))
        ))
      );
    })
  );

}
