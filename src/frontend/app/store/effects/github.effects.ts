import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { GITHUB_API_URL } from '../../core/github.helpers';
import { FETCH_GITHUB_REPO, FetchGitHubRepoInfo } from '../actions/github.actions';
import { AppState } from '../app-state';
import { githubRepoSchemaKey } from '../helpers/entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { createFailedGithubRequestMessage } from './deploy-app.effects';


@Injectable()
export class GithubEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>,
    @Inject(GITHUB_API_URL) private gitHubURL: string
  ) { }
  @Effect()
  fetchCommit$ = this.actions$
    .ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO).pipe(
      mergeMap(action => {
        const actionType = 'fetch';
        const apiAction = {
          entityKey: githubRepoSchemaKey,
          type: action.type,
          guid: action.stProject.deploySource.project
        };
        this.store.dispatch(new StartRequestAction(apiAction, actionType));
        return this.http
          .get(
            `${this.gitHubURL}/repos/${
            action.stProject.deploySource.project
            }`
          ).pipe(
            mergeMap(response => {
              const repoDetails = response.json();
              const mappedData = {
                entities: { githubRepo: {} },
                result: []
              } as NormalizedResponse;
              const id = repoDetails.full_name;
              mappedData.entities.githubRepo[id] = {
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
            ), );
      }));
}
