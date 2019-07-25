import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../cf-types';
import { FETCH_GITHUB_REPO, FetchGitHubRepoInfo } from '../../actions/github.actions';
import { CFAppState } from '../../cf-app-state';
import { gitRepoEntityType } from '../../cf-entity-factory';
import { LoggerService } from '../../../../core/src/core/logger.service';
import { GitSCMService, GitSCMType } from '../../../../core/src/shared/data-services/scm/scm.service';
import { NormalizedResponse } from '../../../../store/src/types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../../../../store/src/types/request.types';
import { createFailedGithubRequestMessage } from './deploy-app.effects';


@Injectable()
export class GithubEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<CFAppState>,
    private scmService: GitSCMService,
    private logger: LoggerService
  ) { }
  @Effect()
  fetchCommit$ = this.actions$.pipe(
    ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO),
    mergeMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityType: gitRepoEntityType,
        endpointType: CF_ENDPOINT_TYPE,
        type: action.type,
        guid: action.stProject.deploySource.project
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      const scmType = action.stProject.deploySource.scm || action.stProject.deploySource.type;
      const scm = this.scmService.getSCM(scmType as GitSCMType);
      return scm.getRepository(action.stProject.deploySource.project).pipe(
        mergeMap(repoDetails => {
          const mappedData = {
            entities: { gitRepo: {} },
            result: []
          } as NormalizedResponse;
          const id = scmType + '-' + repoDetails.full_name;
          mappedData.entities.gitRepo[id] = {
            entity: repoDetails,
            metadata: {}
          };
          mappedData.result.push(id);
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
