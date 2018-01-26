import { selectNewAppCFDetails } from '../selectors/create-application.selectors';
import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { environment } from '../../../environments/environment';
import {
  AppNameFree,
  AppNameTaken,
  CHECK_NAME,
  IsNewAppNameFree
} from '../actions/create-applications-page.actions';
import { AppState } from './../app-state';
import { NewAppCFDetails, CreateNewApplicationState } from '../types/create-application.types';
import { combineAll } from 'rxjs/operator/combineAll';
import {
   CheckProjectExists,
   ProjectDoesntExist,
   ProjectExists,
   PROJECT_EXISTS,
   PROJECT_DOESNT_EXIST,
   CHECK_PROJECT_EXISTS,
   FetchBranchesForProject,
   FETCH_BRANCHES_FOR_PROJECT,
   SaveBranchesForProject,
   FetchBranchesFailed,
   DeleteCachedBranches,
   CommitFetchFailed,
   FetchCommit,
   FETCH_COMMIT,
   SaveCommitForBranch,
   DeleteDeployAppSection,
   DELETE_DEPLOY_APP_SECTION,
} from '../../store/actions/deploy-applications.actions';
import { Commit } from '../types/deploy-application.types';
import { selectDeployAppState } from '../selectors/deploy-application.selector';
@Injectable()
export class DeployAppEffects {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {
  }

  @Effect() checkAppExists$ =  this.actions$.ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS)
  .withLatestFrom(this.store.select(selectDeployAppState))
  .filter(([action, state]) => {
   return state.projectExists && state.projectExists.checking;
  })
  .switchMap(([action, state]: any) => {
      return this.http.get(`https://api.github.com/repos/${action.projectName}`)
        .mergeMap(res => {
          return [new ProjectExists(action.projectName, res), new DeleteCachedBranches()];
        })
        .catch(err => {
          return Observable.of(new ProjectDoesntExist(action.projectName));
        });
    });

  @Effect() fetchBranches$ =  this.actions$.ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT)
  .switchMap((action: any) => {
      return this.http.get(`https://api.github.com/repos/${action.projectName}/branches`)
        .map(res => {
          return new SaveBranchesForProject(res);
        })
        .catch(err => {
          return Observable.of(new FetchBranchesFailed());
        });
    });

  @Effect() fetchCommit$ =  this.actions$.ofType<FetchCommit>(FETCH_COMMIT)
  .switchMap((action: any) => {
      return this.http.get(action.commit.url)
    .map(res => {
          return new SaveCommitForBranch(res);
        })
        .catch(err => {
          return Observable.of(new CommitFetchFailed());
        });
    });
}
