import { HttpRequest } from '@angular/common/http';
import { Action, Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { StratosCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { AppState, InternalAppState } from '../app-state';
import { PaginationFlattenerConfig } from '../helpers/paginated-request-helpers';
import { PaginatedAction } from '../types/pagination.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { endpointErrorsHandlerFactory } from './entity-request-base-handlers/endpoint-errors.handler';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { multiEndpointResponseMergePipe } from './entity-request-base-handlers/merge-multi-endpoint-data.pipe';
import { normalizeEntityPipeFactory } from './entity-request-base-handlers/normalize-entity-request-response.pipe';
import { BasePipelineConfig, EntityRequestPipeline } from './entity-request-pipeline.types';
import { fetchUrlParamsFromStore } from './pagination-request-base-handlers/fetch-params-from-store.pipe';
import { PaginationPageIterator } from './pagination-request-base-handlers/pagination-iterator.pipe';
import { PipelineHttpClient } from './pipline-http-client.service';

function getRequestObservable(
  httpClient: PipelineHttpClient,
  action: PaginatedAction,
  request: HttpRequest<any>,
  paginationPageIterator?: PaginationPageIterator
) {
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
    return initialRequest;
  }
  return paginationPageIterator.mergeAllPages();
}
export interface PaginatedRequestPipelineConfig<T extends AppState = InternalAppState> extends BasePipelineConfig<T> {
  action: PaginatedAction;
  pageFlattenerConfig: PaginationFlattenerConfig;
}
export const basePaginatedRequestPipeline: EntityRequestPipeline = (
  store: Store<AppState>,
  httpClient: PipelineHttpClient,
  { action, requestType, catalogueEntity, appState, pageFlattenerConfig }: PaginatedRequestPipelineConfig
) => {
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const entity = catalogueEntity as StratosCatalogueEntity;
  const flattenerConfig = entity.definition.paginationPageIteratorConfig ||
    entity.definition.endpoint ? entity.definition.endpoint.paginationPageIteratorConfig : null;
  const paramsFromStore = fetchUrlParamsFromStore(action, catalogueEntity, appState);
  const requestFromAction = buildRequestEntityPipe(requestType, action.options);
  const request = requestFromAction.clone({
    params: paramsFromStore
  });
  const normalizeEntityPipe = normalizeEntityPipeFactory(catalogueEntity, action.schemaKey);
  const handleMultiEndpointsPipe = handleMultiEndpointsPipeFactory(action.options.url);
  const endpointErrorHandler = endpointErrorsHandlerFactory(actionDispatcher);
  const pageIterator = flattenerConfig ? new PaginationPageIterator(httpClient, request, action, flattenerConfig) : null;
  return getRequestObservable(
    httpClient,
    action,
    request,
    pageIterator
  ).pipe(
    map(handleMultiEndpointsPipe),
    map(multiEndpointResponses => {
      endpointErrorHandler(
        action,
        catalogueEntity,
        requestType,
        multiEndpointResponses.errors
      );
      if (!multiEndpointResponses.successes || !multiEndpointResponses.successes.length) {
        return {
          success: false,
          errorMessage: 'Request Failed'
        };
      } else {
        return {
          success: true,
          response: multiEndpointResponseMergePipe(multiEndpointResponses.successes.map(normalizeEntityPipe))
        };
      }
    })
  );
};
