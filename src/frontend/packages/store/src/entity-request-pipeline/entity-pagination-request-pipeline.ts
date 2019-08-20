import { HttpRequest } from '@angular/common/http';
import { Action, Store } from '@ngrx/store';
import { isObservable, Observable, of } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import {
  StratosBaseCatalogueEntity,
  StratosCatalogueEntity,
} from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { AppState, InternalAppState } from '../app-state';
import { PaginationFlattenerConfig } from '../helpers/paginated-request-helpers';
import { PaginatedAction } from '../types/pagination.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { mapMultiEndpointResponses } from './entity-request-base-handlers/map-multi-endpoint.pipes';
import { BasePipelineConfig, EntityRequestPipeline, PagedJetstreamResponse } from './entity-request-pipeline.types';
import { getPaginationParamsPipe } from './pagination-request-base-handlers/get-params.pipe';
import { PaginationPageIterator } from './pagination-request-base-handlers/pagination-iterator.pipe';
import { mergeHttpParams, singleRequestToPaged } from './pipeline-helpers';
import { PipelineHttpClient } from './pipline-http-client.service';

function getRequestObjectObservable(request: HttpRequest<any> | Observable<HttpRequest<any>>): Observable<HttpRequest<any>> {
  return isObservable(request) ? request : of(request);
}

function getPrePaginatedRequestFunction(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  return definition.prePaginationRequest || definition.endpoint.globalPrePaginationRequest || null;
}

function getRequestObservable(
  httpClient: PipelineHttpClient,
  action: PaginatedAction,
  request: HttpRequest<any>,
  paginationPageIterator?: PaginationPageIterator
): Observable<PagedJetstreamResponse> {
  const initialRequest = makeRequestEntityPipe(
    httpClient,
    request,
    action.endpointType,
    action.endpointGuid
  );
  if (action.flattenPagination && !paginationPageIterator) {
    console.warn('Action requires all request pages but no page flattener was given.');
  }
  if (!action.flattenPagination || !paginationPageIterator) {
    return initialRequest.pipe(map(response => singleRequestToPaged(response)));
  }
  return paginationPageIterator.mergeAllPagesEntities();
}
export interface PaginatedRequestPipelineConfig<T extends AppState = InternalAppState> extends BasePipelineConfig<T> {
  action: PaginatedAction;
  pageFlattenerConfig: PaginationFlattenerConfig;
}
export const basePaginatedRequestPipeline: EntityRequestPipeline = (
  store: Store<AppState>,
  httpClient: PipelineHttpClient,
  { action, requestType, catalogueEntity, appState }: PaginatedRequestPipelineConfig
) => {
  const prePaginatedRequestFunction = getPrePaginatedRequestFunction(catalogueEntity);
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const entity = catalogueEntity as StratosCatalogueEntity;
  const flattenerConfig = entity.definition.paginationConfig ? entity.definition.paginationConfig :
    entity.definition.endpoint ? entity.definition.endpoint.paginationConfig : null;
  const paramsFromStore = getPaginationParamsPipe(action, catalogueEntity, appState);
  const requestFromAction = buildRequestEntityPipe(requestType, action.options);
  const allParams = mergeHttpParams(paramsFromStore, requestFromAction.params);
  const requestFromStore = requestFromAction.clone({
    params: allParams
  });
  const request = prePaginatedRequestFunction ? prePaginatedRequestFunction(requestFromStore, action, catalogueEntity) : requestFromStore;


  const handleMultiEndpointsPipe = handleMultiEndpointsPipeFactory(
    action.options.url,
    flattenerConfig.getEntitiesFromResponse
  );
  return getRequestObjectObservable(request).pipe(
    first(),
    switchMap(requestObject => {
      const pageIterator = flattenerConfig ?
        new PaginationPageIterator(httpClient, requestObject, action, actionDispatcher, flattenerConfig) : null;
      return getRequestObservable(
        httpClient,
        action,
        requestObject,
        pageIterator
      ).pipe(
        map(handleMultiEndpointsPipe),
        map(multiEndpointResponses => mapMultiEndpointResponses(
          action,
          catalogueEntity,
          requestType,
          multiEndpointResponses,
          actionDispatcher
        ))
      );
    })
  );
};
