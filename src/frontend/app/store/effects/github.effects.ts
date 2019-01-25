import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { GitSCMService, GitSCMType } from '../../shared/data-services/scm/scm.service';
import { FETCH_GITHUB_REPO, FetchGitHubRepoInfo } from '../actions/github.actions';
import { AppState } from '../app-state';
import { gitRepoSchemaKey } from '../helpers/entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { createFailedGithubRequestMessage } from './deploy-app.effects';


@Injectable()
export class GithubEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>,
    private scmService: GitSCMService
  ) { }
  @Effect()
  fetchCommit$ = this.actions$
    .ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO).pipe(
      mergeMap(action => {
        const actionType = 'fetch';
        const apiAction = {
          entityKey: gitRepoSchemaKey,
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
            new WrapperRequestActionFailed(createFailedGithubRequestMessage(err), apiAction, actionType)
          ]
          ));
      }));
}
