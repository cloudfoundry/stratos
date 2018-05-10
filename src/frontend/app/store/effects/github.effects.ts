import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { FETCH_GITHUB_REPO, FetchGitHubRepoInfo } from '../actions/github.actions';
import { AppState } from '../app-state';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { githubRepoSchemaKey } from '../helpers/entity-factory';

@Injectable()
export class GithubEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }
  @Effect()
  fetchCommit$ = this.actions$
    .ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO)
    .flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: githubRepoSchemaKey,
        type: action.type,
        guid: action.stProject.deploySource.project
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return this.http
        .get(
          `https://api.github.com/repos/${
          action.stProject.deploySource.project
          }`
        )
        .mergeMap(response => {
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
        })
        .catch(err => [
          new WrapperRequestActionFailed(err.message, apiAction, actionType)
        ]);
    });
}
