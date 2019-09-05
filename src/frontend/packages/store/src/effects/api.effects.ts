import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, withLatestFrom } from 'rxjs/operators';

import { baseRequestPipelineFactory } from '../entity-request-pipeline/base-single-entity-request.pipeline';
import { basePaginatedRequestPipeline } from '../entity-request-pipeline/entity-pagination-request-pipeline';
import { apiRequestPipelineFactory } from '../entity-request-pipeline/entity-request-pipeline';
import { PipelineHttpClient } from '../entity-request-pipeline/pipline-http-client.service';
import { PaginatedAction } from '../types/pagination.types';
import { ICFAction } from '../types/request.types';
import { ApiActionTypes } from './../actions/request.actions';
import { InternalAppState } from './../app-state';

@Injectable()
export class APIEffect {
  constructor(
    private actions$: Actions,
    private store: Store<InternalAppState>,
    private httpClient: PipelineHttpClient
  ) {

  }

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

}
