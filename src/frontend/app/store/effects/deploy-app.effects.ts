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
  FETCH_COMMITS,
  FetchBranchesForProject,
  FetchCommit,
  FetchCommits,
  ProjectDoesntExist,
  ProjectExists,
} from '../../store/actions/deploy-applications.actions';
import { githubBranchesSchemaKey, githubCommitSchemaKey } from '../helpers/entity-factory';
import { selectDeployAppState } from '../selectors/deploy-application.selector';
import { NormalizedResponse } from '../types/api.types';
import { GithubCommit } from '../types/github.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { AppState } from './../app-state';

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
          this.addCommit(mappedData, action.projectName, commit);
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
          ];
        })
        .catch(err => [
          new WrapperRequestActionFailed(err.message, apiAction, actionType)
        ]);
    });

  @Effect()
  fetchCommits$ = this.actions$
    .ofType<FetchCommits>(FETCH_COMMITS)
    .flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: githubCommitSchemaKey,
        type: action.type,
        paginationKey: action.paginationKey
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return this.http
        .get(`https://api.github.com/repos/${action.projectName}/commits?sha=${action.sha}`)
        .mergeMap(response => {
          const commits: GithubCommit[] = response.json();
          const mappedData = {
            entities: { [githubCommitSchemaKey]: {} },
            result: []
          } as NormalizedResponse;
          commits.forEach(commit => {
            this.addCommit(mappedData, action.projectName, commit);
          });
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
          ];
        })
        .catch(err => [
          new WrapperRequestActionFailed(err.message, apiAction, actionType)
        ]);
    });

  addCommit(mappedData: NormalizedResponse, projectName: string, commit: GithubCommit) {
    const id = projectName + '-' + commit.sha;
    mappedData.entities[githubCommitSchemaKey][id] = {
      entity: commit,
      metadata: {}
    };
    mappedData.result.push(id);
  }
}
