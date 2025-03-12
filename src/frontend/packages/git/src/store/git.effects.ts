import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { AppState } from '../../../store/src/app-state';
import { entityCatalog, NormalizedResponse, WrapperRequestActionSuccess } from '../../../store/src/public-api';
import { EntityRequestAction, StartRequestAction, WrapperRequestActionFailed } from '../../../store/src/types/request.types';
import { GitCommit } from '../public_api';
import {
  FetchBranchesForProject,
  FetchBranchForProject,
  FetchCommit,
  FetchCommits,
  FetchGitHubRepoInfo,
} from './git.actions';
import {
  FETCH_BRANCH_FOR_PROJECT,
  FETCH_BRANCHES_FOR_PROJECT,
  FETCH_COMMIT,
  FETCH_COMMITS,
  FETCH_GITHUB_REPO,
} from './git.public-types';


// FIXME: This should be removed in favour of entity action builder config.
// See github commit action builder for an example,
// https://github.com/cloudfoundry-incubator/stratos/issues/3770
@Injectable()
export class GitEffects {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private httpClient: HttpClient
  ) { }

  
  fetchRep$ = createEffect(() => this.actions$.pipe(
    ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const entityConfig = entityCatalog.getEntity(action);
      return action.meta.scm.getRepository(this.httpClient, action.meta.projectName).pipe(
        mergeMap(repoDetails => {
          const mappedData: NormalizedResponse = {
            entities: { [entityConfig.entityKey]: {} },
            result: []
          };
          repoDetails.scmType = action.meta.scm.getType();
          repoDetails.projectName = action.meta.projectName;
          repoDetails.guid = action.guid;
          repoDetails.endpointGuid = action.meta.scm.endpointGuid;
          mappedData.entities[entityConfig.entityKey][repoDetails.guid] = repoDetails;
          mappedData.result.push(repoDetails.guid);
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(action.meta.scm.parseErrorAsString(err), action, actionType)
        ]
        ));
    })));

  
  fetchBranches$ = createEffect(() => this.actions$.pipe(
    ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getBranches(this.httpClient, action.projectName).pipe(
        mergeMap(branches => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };

          branches.forEach(b => {
            b.scmType = action.scm.getType();
            b.projectName = action.projectName;
            b.guid = action.entity[0].getId(b);
            b.endpointGuid = action.scm.endpointGuid;
            mappedData.entities[entityKey][b.guid] = b;
            mappedData.result.push(b.guid);
          });
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(action.scm.parseErrorAsString(err), action, actionType)
        ]));
    })));

  
  fetchBranch$ = createEffect(() => this.actions$.pipe(
    ofType<FetchBranchForProject>(FETCH_BRANCH_FOR_PROJECT),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getBranch(this.httpClient, action.projectName, action.branchName).pipe(
        mergeMap(branch => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };
          branch.scmType = action.scm.getType();
          branch.projectName = action.projectName;
          branch.guid = action.guid;
          branch.endpointGuid = action.scm.endpointGuid;
          mappedData.entities[entityKey][branch.guid] = branch;
          mappedData.result.push(branch.guid);
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(action.scm.parseErrorAsString(err), action, actionType)
        ]));
    })));

  
  fetchCommit$ = createEffect(() => this.actions$.pipe(
    ofType<FetchCommit>(FETCH_COMMIT),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getCommit(this.httpClient, action.projectName, action.commitSha).pipe(
        mergeMap(commit => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };
          this.addCommit(
            entityKey,
            mappedData,
            this.updateCommit(action.scm.getType(), action.projectName, commit, action.scm.endpointGuid, action)
          );
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(action.scm.parseErrorAsString(err), action, actionType)
        ]));
    })));

  
  fetchCommits$ = createEffect(() => this.actions$.pipe(
    ofType<FetchCommits>(FETCH_COMMITS),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getCommits(this.httpClient, action.projectName, action.sha).pipe(
        mergeMap((commits: GitCommit[]) => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };
          commits.forEach(commit => {
            this.addCommit(entityKey, mappedData, this.updateCommit(action.scm.getType(),
              action.projectName,
              commit,
              action.scm.endpointGuid,
              action
            ));
          });
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(action.scm.parseErrorAsString(err), action, actionType)
        ]));
    })));

  updateCommit(scmType: string, projectName: string, commit: GitCommit, endpointGuid: string, action: EntityRequestAction): GitCommit {
    const newCommit = {
      ...commit,
      scmType,
      projectName,
      endpointGuid,
    };
    newCommit.guid = action.entity[0].getId(newCommit);

    return newCommit;
  }

  addCommit(entityKey: string, mappedData: NormalizedResponse, commit: GitCommit) {
    mappedData.entities[entityKey][commit.guid] = commit;
    mappedData.result.push(commit.guid);
  }

}
