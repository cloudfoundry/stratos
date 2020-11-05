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
      // TODO: RC... we need to check the response for a 404 status... however that level of debug has been lost(?)
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

  // @Effect()
  // fetchBranches$ = this.actions$.pipe(
  //   ofType<FetchBranchesForProject>(FETCH_BRANCHES_FOR_PROJECT),
  //   mergeMap(action => {
  //     const actionType = 'fetch';
  //     const apiAction = {
  //       entityType: gitBranchesEntityType,
  //       endpointType: CF_ENDPOINT_TYPE,
  //       type: action.type,
  //       paginationKey: action.paginationKey
  //     } as PaginatedAction;
  //     this.store.dispatch(new StartRequestAction(apiAction, actionType));
  //     return action.scm.getBranches(this.httpClient, action.projectName).pipe(
  //       mergeMap(branches => {
  //         const entityKey = entityCatalog.getEntity(apiAction).entityKey;
  //         const mappedData: NormalizedResponse = {
  //           entities: { [entityKey]: {} },
  //           result: []
  //         };

  //         const scmType = action.scm.getType();
  //         branches.forEach(b => {
  //           const id = `${scmType}-${action.projectName}-${b.name}`;
  //           b.projectId = action.projectName;
  //           b.entityId = id;
  //           // mappedData.entities[entityKey][id] = {
  //           //   entity: b,
  //           //   metadata: {}
  //           // };
  //           mappedData.entities[entityKey][id] = b;
  //           mappedData.result.push(id);
  //         });
  //         return [
  //           new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
  //         ];
  //       }),
  //       catchError(err => [
  //         new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
  //       ]));
  //   }));

  // @Effect()
  // fetchBranch$ = this.actions$.pipe(
  //   ofType<FetchBranchForProject>(FETCH_BRANCH_FOR_PROJECT),
  //   mergeMap(action => {
  //     const actionType = 'fetch';
  //     const apiAction = {
  //       entityType: gitBranchesEntityType,
  //       endpointType: CF_ENDPOINT_TYPE,
  //       type: action.type,
  //       guid: action.guid
  //     };
  //     this.store.dispatch(new StartRequestAction(apiAction, actionType));
  //     return action.scm.getBranch(this.httpClient, action.projectName, action.branchName).pipe(
  //       mergeMap(branch => {
  //         const entityKey = entityCatalog.getEntity(apiAction).entityKey;
  //         const mappedData: NormalizedResponse = {
  //           entities: { [entityKey]: {} },
  //           result: []
  //         };
  //         branch.projectId = action.projectName;
  //         branch.entityId = action.guid;
  //         mappedData.entities[entityKey][action.guid] = branch;
  //         mappedData.result.push(action.guid);
  //         return [
  //           new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
  //         ];
  //       }),
  //       catchError(err => [
  //         new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
  //       ]));
  //   }));

  // @Effect()
  // fetchCommit$ = this.actions$.pipe(
  //   ofType<FetchCommit>(FETCH_COMMIT),
  //   mergeMap(action => {
  //     const actionType = 'fetch';
  //     const apiAction = {
  //       entityType: gitCommitEntityType,
  //       endpointType: CF_ENDPOINT_TYPE,
  //       type: action.type,
  //     } as ICFAction;
  //     this.store.dispatch(new StartRequestAction(apiAction, actionType));
  //     return action.scm.getCommit(this.httpClient, action.projectName, action.commitSha).pipe(
  //       mergeMap(commit => {
  //         const entityKey = entityCatalog.getEntity(apiAction).entityKey;
  //         const mappedData = {
  //           entities: { [entityKey]: {} },
  //           result: []
  //         } as NormalizedResponse;
  //         this.addCommit(entityKey, mappedData, action.scm.getType(), action.projectName, commit);
  //         return [
  //           new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
  //         ];
  //       }),
  //       catchError(err => [
  //         new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
  //       ]));
  //   }));

  // @Effect()
  // fetchCommits$ = this.actions$.pipe(
  //   ofType<FetchCommits>(FETCH_COMMITS),
  //   mergeMap(action => {
  //     // cfEntityCatalog.gitCommit.actions.get();


  //     const actionType = 'fetch';
  //     const apiAction: PaginatedAction = {
  //       entityType: gitCommitEntityType,
  //       endpointType: CF_ENDPOINT_TYPE,
  //       type: action.type,
  //       paginationKey: action.paginationKey
  //     };
  //     this.store.dispatch(new StartRequestAction(apiAction, actionType));
  //     return action.scm.getCommits(this.httpClient, action.projectName, action.sha).pipe(
  //       mergeMap((commits: GitCommit[]) => {
  //         const entityKey = entityCatalog.getEntity(apiAction).entityKey;
  //         const mappedData: NormalizedResponse = {
  //           entities: { [entityKey]: {} },
  //           result: []
  //         };
  //         commits.forEach(commit => {
  //           this.addCommit(entityKey, mappedData, action.scm.getType(), action.projectName, commit);
  //         });
  //         return [
  //           new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
  //         ];
  //       }),
  //       catchError(err => [
  //         new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
  //       ]));
  //   }));

  // addCommit(entityKey: string, mappedData: NormalizedResponse, scmType: string, projectName: string, commit: GitCommit) {
  //   const id = scmType + '-' + projectName + '-' + commit.sha; // FIXME: get from action, see #4245
  //   mappedData.entities[entityKey][id] = commit;
  //   // mappedData.entities[entityKey][id] = {
  //   //   entity: commit,
  //   //   metadata: {}
  //   // };
  //   mappedData.result.push(id);
  // }

}
