import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import {
  CHECK_PROJECT_EXISTS,
  CheckProjectExists,
  FETCH_BRANCHES_FOR_PROJECT,
  FETCH_COMMIT,
  FetchBranchesForProject,
  FetchCommit,
  ProjectDoesntExist,
  ProjectExists,
} from '../../store/actions/deploy-applications.actions';
import { selectDeployAppState } from '../selectors/deploy-application.selector';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { AppState } from './../app-state';
import { githubBranchesSchemaKey, githubCommitSchemaKey } from '../helpers/entity-factory';

@Injectable()
export class DeployAppEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect()
  checkAppExists$ = this.actions$
    .ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS)
    .withLatestFrom(this.store.select(selectDeployAppState))
    .filter(([action, state]) => {
      return state.projectExists && state.projectExists.checking;
    })
    .switchMap(([action, state]: any) => {
      return this.http
        .get(`https://api.github.com/repos/${action.projectName}`)
        .map(res => new ProjectExists(action.projectName, res))
        .catch(err => {
          return Observable.of(new ProjectDoesntExist(action.projectName));
        });
    });

  @Effect()
  fetchBranches$ = this.actions$
    .ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT)
    .flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: githubBranchesSchemaKey,
        type: action.type,
        paginationKey: 'branches'
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return this.http
        .get(`https://api.github.com/repos/${action.projectName}/branches`)
        .mergeMap(response => {
          const branches = response.json();
          const mappedData = {
            entities: { githubBranches: {} },
            result: []
          } as NormalizedResponse;

          branches.forEach(b => {
            const id = `${action.projectName}-${b.name}`;
            b.projectId = action.projectName;
            b.entityId = id;
            mappedData.entities[githubBranchesSchemaKey][id] = {
              entity: b,
              metadata: {}
            };
            mappedData.result.push(id);
          });
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
          ];
        })
        .catch(err => [
          new WrapperRequestActionFailed(err.message, apiAction, actionType)
        ]);
    });

  @Effect()
  fetchCommit$ = this.actions$
    .ofType<FetchCommit>(FETCH_COMMIT)
    .flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: githubCommitSchemaKey,
        type: action.type
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return this.http
        .get(action.commit.url)
        .mergeMap(response => {
          const commit = response.json();
          const mappedData = {
            entities: { [githubCommitSchemaKey]: {} },
            result: []
          } as NormalizedResponse;
          const commitId = commit.sha;
          mappedData.entities[githubCommitSchemaKey][commitId] = {
            entity: commit,
            metadata: {}
          };
          mappedData.result.push(commitId);
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
          ];
        })
        .catch(err => [
          new WrapperRequestActionFailed(err.message, apiAction, actionType)
        ]);
    });
}
