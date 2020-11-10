import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { AppState } from '../../../store/src/app-state';
import { entityCatalog, NormalizedResponse, WrapperRequestActionSuccess } from '../../../store/src/public-api';
import { StartRequestAction, WrapperRequestActionFailed } from '../../../store/src/types/request.types';
import { GitCommit } from '../public_api';
import { GitSCMService } from '../shared/scm/scm.service';
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

// const { proxyAPIVersion } = environment;
// const commonPrefix = `/pp/${proxyAPIVersion}/autoscaler`;

// FIXME: This should be removed in favour of entity action builder config.
// See github commit action builder for an example,
// https://github.com/cloudfoundry-incubator/stratos/issues/3770
@Injectable()
export class GitEffects {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private scmService: GitSCMService,
    private httpClient: HttpClient
  ) { }

  @Effect()
  fetchRep$ = this.actions$.pipe(
    ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const entityConfig = entityCatalog.getEntity(action);
      return action.meta.scm.getRepository(this.httpClient, action.endpointGuid, action.meta.projectName).pipe(
        mergeMap(repoDetails => {
          const mappedData: NormalizedResponse = {
            entities: { [entityConfig.entityKey]: {} },
            result: []
          };
          mappedData.entities[entityConfig.entityKey][action.guid] = repoDetails;
          mappedData.result.push(action.guid);
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(this.scmService.parseErrorAsString(err, action.meta.scm.getType()), action, actionType)
        ]
        ));
    }));

  @Effect()
  fetchBranches$ = this.actions$.pipe(
    ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getBranches(this.httpClient, action.endpointGuid, action.projectName).pipe(
        mergeMap(branches => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };

          const scmType = action.scm.getType();
          branches.forEach(b => {
            const id = `${scmType}-${action.projectName}-${b.name}`;
            b.projectId = action.projectName;
            b.entityId = id;
            mappedData.entities[entityKey][id] = b;
            mappedData.result.push(id);
          });
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(this.scmService.parseErrorAsString(err, action.scm.getType()), action, actionType)
        ]));
    }));

  @Effect()
  fetchBranch$ = this.actions$.pipe(
    ofType<FetchBranchForProject>(FETCH_BRANCH_FOR_PROJECT),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getBranch(this.httpClient, action.endpointGuid, action.projectName, action.branchName).pipe(
        mergeMap(branch => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };
          branch.projectId = action.projectName;
          branch.entityId = action.guid;
          mappedData.entities[entityKey][action.guid] = branch;
          mappedData.result.push(action.guid);
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(this.scmService.parseErrorAsString(err, action.scm.getType()), action, actionType)
        ]));
    }));

  @Effect()
  fetchCommit$ = this.actions$.pipe(
    ofType<FetchCommit>(FETCH_COMMIT),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getCommit(this.httpClient, action.endpointGuid, action.projectName, action.commitSha).pipe(
        mergeMap(commit => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };
          this.addCommit(entityKey, mappedData, action.scm.getType(), action.projectName, commit);
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(this.scmService.parseErrorAsString(err, action.scm.getType()), action, actionType)
        ]));
    }));

  @Effect()
  fetchCommits$ = this.actions$.pipe(
    ofType<FetchCommits>(FETCH_COMMITS),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return action.scm.getCommits(this.httpClient, action.endpointGuid, action.projectName, action.sha).pipe(
        mergeMap((commits: GitCommit[]) => {
          const entityKey = entityCatalog.getEntity(action).entityKey;
          const mappedData: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };
          commits.forEach(commit => {
            this.addCommit(entityKey, mappedData, action.scm.getType(), action.projectName, commit);
          });
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(this.scmService.parseErrorAsString(err, action.scm.getType()), action, actionType)
        ]));
    }));

  addCommit(entityKey: string, mappedData: NormalizedResponse, scmType: string, projectName: string, commit: GitCommit) {
    const id = scmType + '-' + projectName + '-' + commit.sha; // FIXME: get from action, see #4245
    mappedData.entities[entityKey][id] = commit;
    // mappedData.entities[entityKey][id] = {
    //   entity: commit,
    //   metadata: {}
    // };
    mappedData.result.push(id);
  }

}
