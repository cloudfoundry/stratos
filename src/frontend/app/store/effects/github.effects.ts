import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { GITHUB_REPO_ENTITY_KEY } from '../types/github.types';
import { StartRequestAction, WrapperRequestActionSuccess, WrapperRequestActionFailed } from '../types/request.types';
import { NormalizedResponse } from '../types/api.types';
import { FetchGitHubRepoInfo, FETCH_GITHUB_REPO } from '../actions/github.actions';

@Injectable()
export class GithubEffects {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {
  }
  @Effect() fetchCommit$ =  this.actions$.ofType<FetchGitHubRepoInfo>(FETCH_GITHUB_REPO)
  .flatMap(action => {
    const actionType = 'fetch';
    const apiAction = {
      entityKey: GITHUB_REPO_ENTITY_KEY,
      type: action.type,
    };
    this.store.dispatch(new StartRequestAction(apiAction, actionType));
    return this.http.get(`https://api.github.com/repos/${action.stProject.deploySource.project}`)
    .mergeMap(response => {
          const repoDetails = response.json();
          const mappedData = {
            entities: { githubRepo: {}},
            result: []
          } as NormalizedResponse;
          const id = repoDetails.full_name;
          mappedData.entities.githubRepo[id] = repoDetails;
          mappedData.result.push(id);
          return [
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType),
          ];
        })
        .catch(err => [new WrapperRequestActionFailed(err.message, apiAction, actionType)]);
    });

}
