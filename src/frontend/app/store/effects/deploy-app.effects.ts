import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';

import { GITHUB_API_URL } from '../../core/github.helpers';
import { LoggerService } from '../../core/logger.service';
import { parseHttpPipeError } from '../../core/utils.service';
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
  ProjectFetchFail,
} from '../../store/actions/deploy-applications.actions';
import { githubBranchesSchemaKey, githubCommitSchemaKey } from '../helpers/entity-factory';
import { selectDeployAppState } from '../selectors/deploy-application.selector';
import { NormalizedResponse } from '../types/api.types';
import { GithubCommit } from '../types/github.types';
import {
  ICFAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../types/request.types';
import { AppState } from './../app-state';
import { PaginatedAction } from './../types/pagination.types';

export function createFailedGithubRequestMessage(error) {
  const response = parseHttpPipeError(error);
  const message = response['message'] || '';
  return error.status === 403 && message.startsWith('API rate limit exceeded for') ?
    'Github ' + message.substring(0, message.indexOf('(')) :
    'Github request failed';
}

@Injectable()
export class DeployAppEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>,
    private logger: LoggerService,
    @Inject(GITHUB_API_URL) private gitHubURL: string
  ) { }

  @Effect()
  checkAppExists$ = this.actions$
    .ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS).pipe(
      withLatestFrom(this.store.select(selectDeployAppState)),
      filter(([action, state]) => {
        return state.projectExists && state.projectExists.checking;
      }),
      switchMap(([action, state]: any) => {
        return this.http
          .get(`${this.gitHubURL}/repos/${action.projectName}`).pipe(
            map(res => new ProjectExists(action.projectName, res)),
            catchError(err => observableOf(err.status === 404 ?
              new ProjectDoesntExist(action.projectName) :
              new ProjectFetchFail(action.projectName, createFailedGithubRequestMessage(err))
            ))
          );
      })
    );

  @Effect()
  fetchBranches$ = this.actions$
    .ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT).pipe(
      mergeMap(action => {
        const actionType = 'fetch';
        const apiAction = {
          entityKey: githubBranchesSchemaKey,
          type: action.type,
          paginationKey: 'branches'
        } as PaginatedAction;
        this.store.dispatch(new StartRequestAction(apiAction, actionType));
        return this.http
          .get(`${this.gitHubURL}/repos/${action.projectName}/branches`).pipe(
            mergeMap(response => {
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
            }),
            catchError(err => [
              new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
            ]), );
      }));

  @Effect()
  fetchCommit$ = this.actions$
    .ofType<FetchCommit>(FETCH_COMMIT).pipe(
      mergeMap(action => {
        const actionType = 'fetch';
        const apiAction = {
          entityKey: githubCommitSchemaKey,
          type: action.type
        } as ICFAction;
        this.store.dispatch(new StartRequestAction(apiAction, actionType));
        return this.http
          .get(action.commit.url).pipe(
            mergeMap(response => {
              const commit = response.json();
              const mappedData = {
                entities: { [githubCommitSchemaKey]: {} },
                result: []
              } as NormalizedResponse;
              this.addCommit(mappedData, action.projectName, commit);
              return [
                new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
              ];
            }),
            catchError(err => [
              new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
            ]), );
      }));

  @Effect()
  fetchCommits$ = this.actions$
    .ofType<FetchCommits>(FETCH_COMMITS).pipe(
      mergeMap(action => {
        const actionType = 'fetch';
        const apiAction = {
          entityKey: githubCommitSchemaKey,
          type: action.type,
          paginationKey: action.paginationKey
        } as PaginatedAction;
        this.store.dispatch(new StartRequestAction(apiAction, actionType));
        return this.http
          .get(`${this.gitHubURL}/repos/${action.projectName}/commits?sha=${action.sha}`).pipe(
            mergeMap(response => {
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
            }),
            catchError(err => [
              new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
            ]), );
      }));

  addCommit(mappedData: NormalizedResponse, projectName: string, commit: GithubCommit) {
    const id = projectName + '-' + commit.sha;
    mappedData.entities[githubCommitSchemaKey][id] = {
      entity: commit,
      metadata: {}
    };
    mappedData.result.push(id);
  }

}
