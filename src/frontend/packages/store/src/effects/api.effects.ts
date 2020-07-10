import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, withLatestFrom } from 'rxjs/operators';

import { EntityDeleteCompleteAction } from '../actions/entity.delete.actions';
import { baseRequestPipelineFactory } from '../entity-request-pipeline/base-single-entity-request.pipeline';
import { basePaginatedRequestPipeline } from '../entity-request-pipeline/entity-pagination-request-pipeline';
import { apiRequestPipelineFactory } from '../entity-request-pipeline/entity-request-pipeline';
import { PipelineHttpClient } from '../entity-request-pipeline/pipline-http-client.service';
import { PaginatedAction } from '../types/pagination.types';
import { ICFAction, WrapperRequestActionSuccess } from '../types/request.types';
import { ApiActionTypes, RequestTypes } from './../actions/request.actions';
import { InternalAppState } from './../app-state';

@Injectable()
export class APIEffect {
  constructor(
    private actions$: Actions,
    private store: Store<InternalAppState>,
    private httpClient: PipelineHttpClient
  ) { }

  @Effect()
  apiRequest$ = this.actions$.pipe(
    ofType<ICFAction | PaginatedAction>(ApiActionTypes.API_REQUEST_START),
    withLatestFrom(this.store),
    mergeMap(([action, appState]) => {
      if (!(action as PaginatedAction).paginationKey) {
        return apiRequestPipelineFactory(baseRequestPipelineFactory, {
          store: this.store,
          httpClient: this.httpClient,
          action,
          appState
        });
      }
      return apiRequestPipelineFactory(basePaginatedRequestPipeline, {
        store: this.store,
        httpClient: this.httpClient,
        action,
        appState
      });
    }),
  );

  // Whenever we spot a delete success operation, look to see if the action
  // fulfils the entity delete requirements and dispatch an entity delete action if it does
  // Dispatch an action to remove the favorite
  @Effect()
  apiDeleteRequest$ = this.actions$.pipe(
    ofType<WrapperRequestActionSuccess>(RequestTypes.SUCCESS),
    withLatestFrom(this.store),
    mergeMap(([action, appState]) => {
      if (action.requestType === 'delete') {
        const deleteAction = EntityDeleteCompleteAction.parse(action.apiAction);
        if (deleteAction) {
          // Dispatch a delete action for the entity
          this.store.dispatch(deleteAction);
        }
      }
      return [];
    })
  );

}
