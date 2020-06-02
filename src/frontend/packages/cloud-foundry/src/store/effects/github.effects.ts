import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { LoggerService } from '../../../../core/src/core/logger.service';
import { NormalizedResponse } from '../../../../store/src/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../store/src/types/request.types';
import { FETCH_GITHUB_REPO, FetchGitHubRepoInfo } from '../../actions/github.actions';
import { CFAppState } from '../../cf-app-state';
import { gitRepoEntityType } from '../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { GitSCMService } from '../../shared/data-services/scm/scm.service';
import { createFailedGithubRequestMessage } from './deploy-app.effects';

// TODO: Remove this in favour of action builder config.
// https://github.com/cloudfoundry-incubator/stratos/issues/3770
@Injectable()
export class GithubEffects {
  // FIXME: This should be removed in favour of entity action builder config.
  // See github commit action builder for an example,
  // https://github.com/cloudfoundry-incubator/stratos/issues/3770
  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
    private scmService: GitSCMService,
    private logger: LoggerService,
    private httpClient: HttpClient
  ) { }
  @Effect()
  fetchRep$ = this.actions$.pipe(
    ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO),
    mergeMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityType: gitRepoEntityType,
        endpointType: CF_ENDPOINT_TYPE,
        type: action.type,
        guid: action.guid
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return action.meta.scm.getRepository(this.httpClient, action.meta.projectName).pipe(
        mergeMap(repoDetails => {
          const mappedData = {
            entities: { cfGitRepo: {} },
            result: []
          } as NormalizedResponse;
          mappedData.entities.cfGitRepo[action.guid] = repoDetails;
          mappedData.result.push(action.guid);
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
          ];
        }),
        catchError(err => [
          new WrapperRequestActionFailed(createFailedGithubRequestMessage(err, this.logger), apiAction, actionType)
        ]
        ));
    }));
}
