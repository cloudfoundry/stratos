import { HttpRequest } from '@angular/common/http';
import { Action, Store } from '@ngrx/store';
import { map, first, switchMap, tap } from 'rxjs/operators';
import { StratosCatalogueEntity, StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { AppState, InternalAppState } from '../app-state';
import { PaginationFlattenerConfig } from '../helpers/paginated-request-helpers';
import { PaginatedAction } from '../types/pagination.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { endpointErrorsHandlerFactory } from './entity-request-base-handlers/endpoint-errors.handler';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { multiEndpointResponseMergePipe } from './entity-request-base-handlers/merge-multi-endpoint-data.pipe';
import { normalizeEntityPipeFactory } from './entity-request-base-handlers/normalize-entity-request-response.pipe';
import { BasePipelineConfig, EntityRequestPipeline, ActionDispatcher } from './entity-request-pipeline.types';
import { getPaginationParamsPipe } from './pagination-request-base-handlers/get-params.pipe';
import { PaginationPageIterator } from './pagination-request-base-handlers/pagination-iterator.pipe';
import { PipelineHttpClient } from './pipline-http-client.service';
import { getSuccessMapper, mergeHttpParams } from './pipeline-helpers';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { Observable, isObservable, of } from 'rxjs';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';

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
  const postSuccessDataMapper = getSuccessMapper(catalogueEntity);
  const prePaginatedRequestFunction = getPrePaginatedRequestFunction(catalogueEntity);
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const entity = catalogueEntity as StratosCatalogueEntity;
  const flattenerConfig = entity.definition.paginationPageIteratorConfig ||
    entity.definition.endpoint ? entity.definition.endpoint.paginationPageIteratorConfig : null;
  const paramsFromStore = getPaginationParamsPipe(action, catalogueEntity, appState);
  const requestFromAction = buildRequestEntityPipe(requestType, action.options);
  const allParams = mergeHttpParams(paramsFromStore, requestFromAction.params);
  const requestFromStore = requestFromAction.clone({
    params: allParams
  });
  const request = prePaginatedRequestFunction ? prePaginatedRequestFunction(requestFromStore, action, catalogueEntity) : requestFromStore;

  const normalizeEntityPipe = normalizeEntityPipeFactory(catalogueEntity, action.schemaKey);
  const handleMultiEndpointsPipe = handleMultiEndpointsPipeFactory(action.options.url, action);
  const endpointErrorHandler = endpointErrorsHandlerFactory(actionDispatcher);
  return getRequestObjectObservable(request).pipe(
    first(),
    switchMap(requestObject => {
      const pageIterator = flattenerConfig ?
        new PaginationPageIterator(httpClient, requestObject, action, actionDispatcher, flattenerConfig, postSuccessDataMapper) : null;
      return getRequestObservable(
        httpClient,
        action,
        requestObject,
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
    })
  );
};
