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
import {
   CheckProjectExists,
   ProjectDoesntExist,
   ProjectExists,
   PROJECT_EXISTS,
   PROJECT_DOESNT_EXIST,
   CHECK_PROJECT_EXISTS,
   FetchBranchesForProject,
   FETCH_BRANCHES_FOR_PROJECT,
   FetchCommit,
   FETCH_COMMIT,
   DeleteDeployAppSection,
   DELETE_DEPLOY_APP_SECTION,
} from '../../store/actions/deploy-applications.actions';
import { GITHUB_BRANCHES_ENTITY_KEY, GITHUB_COMMIT_ENTITY_KEY } from '../types/deploy-application.types';
import { selectDeployAppState } from '../selectors/deploy-application.selector';
import { StartRequestAction, WrapperRequestActionSuccess, IRequestAction, WrapperRequestActionFailed } from '../types/request.types';
import { NormalizedResponse } from '../types/api.types';
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
        .map(res => new ProjectExists(action.projectName, res))
        .catch(err => {
          return Observable.of(new ProjectDoesntExist(action.projectName));
        });
    });

  @Effect() fetchBranches$ =  this.actions$.ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT)
  .flatMap(action => {
    const actionType = 'fetch';
    const apiAction = {
      entityKey: GITHUB_BRANCHES_ENTITY_KEY,
      type: action.type,
      paginationKey: 'branches'
    };
    this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return this.http.get(`https://api.github.com/repos/${action.projectName}/branches`)
        .mergeMap(response => {
          const branches = response.json();
          const mappedData = {
            entities: { githubBranches: {}},
            result: []
          } as NormalizedResponse;

          branches.forEach(b => {
            const id = `${action.projectName}-${b.name}`;
            b.projectId = action.projectName;
            b.entityId = id;
            mappedData.entities[GITHUB_BRANCHES_ENTITY_KEY][id] = b;
            mappedData.result.push(id);
          });
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType),
          ];
        })
        .catch(err => [new WrapperRequestActionFailed(err.message, apiAction, actionType)]);
    });

  @Effect() fetchCommit$ =  this.actions$.ofType<FetchCommit>(FETCH_COMMIT)
  .flatMap(action => {
    const actionType = 'fetch';
    const apiAction = {
      entityKey: GITHUB_COMMIT_ENTITY_KEY,
      type: action.type,
    };
    this.store.dispatch(new StartRequestAction(apiAction, actionType));
    return this.http.get(action.commit.url)
    .mergeMap(response => {
          const commit = response.json();
          const mappedData = {
            entities: { githubCommits: {}},
            result: []
          } as NormalizedResponse;
          const commitId = commit.sha;
          mappedData.entities.githubCommits[commitId] = commit;
          mappedData.result.push(commitId);
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType),
          ];
        })
        .catch(err => [new WrapperRequestActionFailed(err.message, apiAction, actionType)]);
    });

}
