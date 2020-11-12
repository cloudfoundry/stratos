import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
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

function parseHttpPipeError(res: any): { message?: string; } {
  if (!res.status) {
    return res;
  }
  try {
    return res.json ? res.json() : res;
  } catch (e) {
    console.warn('Failed to parse response body', e);
  }
  return {};
}

export function createFailedGithubRequestMessage(error: any) {
  const response = parseHttpPipeError(error);
  const message = response.message || '';
  return error.status === 403 && message.startsWith('API rate limit exceeded for') ?
    'Git ' + message.substring(0, message.indexOf('(')) :
    'Git request failed';
}

@Injectable()
export class DeployAppEffects {
  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
    private httpClient: HttpClient
  ) { }

  @Effect()
  checkAppExists$ = this.actions$.pipe(
    ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS),
    withLatestFrom(this.store.select(selectDeployAppState)),
    filter(([, state]) => {
      return state.projectExists && state.projectExists.checking;
    }),
    switchMap(([action, state]: [CheckProjectExists, any]) => {
      // TODO: RC Fix We need to check the response for a 404 status... however that level of debug has been lost in the request pipeline
      // we only have the response object
      // return cfEntityCatalog.gitRepo.api.getRepoInfo<RequestInfoState>(action.projectName, null, {
      //   scm: action.scm,
      //   projectName: action.projectName
      // }).pipe(
      //   pairwise(),
      //   filter(([oldV, newV]) => oldV.fetching && !newV.fetching),
      //   map(([, newV]) => newV),
      //   map(requestInfo => {
      //     if (requestInfo.error) {
      //       requestInfo.
      //     }
      //   })
      // )
      return action.scm.getRepository(this.httpClient, action.projectName).pipe(
        map(res => new ProjectExists(action.projectName, res)),
        catchError(err => observableOf(err.status === 404 ?
          new ProjectDoesntExist(action.projectName) :
          new ProjectFetchFail(action.projectName, createFailedGithubRequestMessage(err))
        ))
      );
    })
  );
}
