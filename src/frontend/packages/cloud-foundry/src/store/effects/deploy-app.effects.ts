import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';

import { entityCatalogue } from './../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from './../../../cf-types';

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
} from '../../actions/deploy-applications.actions';
import { CFAppState } from '../../cf-app-state';
import { gitBranchesEntityType, gitCommitEntityType } from '../../cf-entity-factory';
import { LoggerService } from '../../../../core/src/core/logger.service';
import { parseHttpPipeError } from '../../../../core/src/core/utils.service';
import { selectDeployAppState } from '../selectors/deploy-application.selector';
import { NormalizedResponse } from '../../../../store/src/types/api.types';
import { GitCommit } from '../types/git.types';
import {
  ICFAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../store/src/types/request.types';
import { PaginatedAction } from '../../../../store/src/types/pagination.types';

export function createFailedGithubRequestMessage(error: any, logger: LoggerService) {
  const response = parseHttpPipeError(error, logger);
  const message = response.message || '';
  return error.status === 403 && message.startsWith('API rate limit exceeded for') ?
    'Github ' + message.substring(0, message.indexOf('(')) :
    'Github request failed';
}

@Injectable()
export class DeployAppEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<CFAppState>,
    private logger: LoggerService,
  ) { }

  @Effect()
  checkAppExists$ = this.actions$.pipe(
    ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS),
    withLatestFrom(this.store.select(selectDeployAppState)),
    filter(([action, state]) => {
      return state.projectExists && state.projectExists.checking;
    }),
    switchMap(([action, state]: any) => {
      return action.scm.getRepository(action.projectName).pipe(
        map(res => new ProjectExists(action.projectName, res)),
        catchError(err => observableOf(err.status === 404 ?
          new ProjectDoesntExist(action.projectName) :
          new ProjectFetchFail(action.projectName, createFailedGithubRequestMessage(err, this.logger))
        ))
      );
    })
  );

  @Effect()
  fetchBranches$ = this.actions$.pipe(
    ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT),
    mergeMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityType: gitBranchesEntityType,
        endpointType: CF_ENDPOINT_TYPE,
        type: action.type,
        paginationKey: 'branches'
      } as PaginatedAction;
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return action.scm.getBranches(action.projectName).pipe(
        mergeMap(branches => {
          const entityKey = entityCatalogue.getEntity(apiAction).entityKey;
          const mappedData = {
            entities: { [entityKey]: {} },
            result: []
          } as NormalizedResponse;

          const scmType = action.scm.getType();
          branches.forEach(b => {
            const id = `${scmType}-${action.projectName}-${b.name}`;
            b.projectId = action.projectName;
            b.entityId = id;
            mappedData.entities[entityKey][id] = {
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
          new WrapperRequestActionFailed(createFailedGithubRequestMessage(err, this.logger), apiAction, actionType)
        ]));
    }));

  @Effect()
  fetchCommit$ = this.actions$.pipe(
    ofType<FetchCommit>(FETCH_COMMIT),
    mergeMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityType: gitCommitEntityType,
        endpointType: CF_ENDPOINT_TYPE,
        type: action.type
      } as ICFAction;
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return action.scm.getCommit(action.projectName, action.commitSha).pipe(
        mergeMap(commit => {
          const entityKey = entityCatalogue.getEntity(apiAction).entityKey;
          const mappedData = {
            entities: { [entityKey]: {} },
            result: []
          } as NormalizedResponse;
          this.addCommit(entityKey, mappedData, action.scm.getType(), action.projectName, commit);
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(createFailedGithubRequestMessage(err, this.logger), apiAction, actionType)
        ]));
    }));

  @Effect()
  fetchCommits$ = this.actions$.pipe(
    ofType<FetchCommits>(FETCH_COMMITS),
    mergeMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityType: gitCommitEntityType,
        endpointType: CF_ENDPOINT_TYPE,
        type: action.type,
        paginationKey: action.paginationKey
      } as PaginatedAction;
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return action.scm.getCommits(action.projectName, action.sha).pipe(
        mergeMap((commits: GitCommit[]) => {
          const entityKey = entityCatalogue.getEntity(apiAction).entityKey;
          const mappedData = {
            entities: { [entityKey]: {} },
            result: []
          } as NormalizedResponse;
          commits.forEach(commit => {
            this.addCommit(entityKey, mappedData, action.scm.getType(), action.projectName, commit);
          });
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(createFailedGithubRequestMessage(err, this.logger), apiAction, actionType)
        ]));
    }));

  addCommit(entityKey: string, mappedData: NormalizedResponse, scmType: string, projectName: string, commit: GitCommit) {
    const id = scmType + '-' + projectName + '-' + commit.sha;
    mappedData.entities[entityKey][id] = {
      entity: commit,
      metadata: {}
    };
    mappedData.result.push(id);
  }

}
