import { EntityRequestHandler, EntityRequestPipeline } from './entity-request-pipeline.types';
import { state } from '@angular/animations';
import { Store, Action } from '@ngrx/store';
import { startEntityHandler } from './entity-request-base-handlers/start-entity-request.handler';
import { HttpClient } from '@angular/common/http';
import { EntityRequestAction } from '../types/request.types';
import { AppState } from '../app-state';
import { getRequestTypeFromMethod, ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { tap, map } from 'rxjs/operators';
import { successEntityHandler } from './entity-request-base-handlers/success-entity-request.handler';
import { normalizeEntityPipeFactory } from './entity-request-base-handlers/normalize-entity-request-response.pipe';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { endpointErrorsHandlerFactory } from './entity-request-base-handlers/endpoint-errors.handler';
import { multiEndpointResponseMergePipe } from './entity-request-base-handlers/merge-multi-endpoint-data.pipe';

export function handlerPipe<T extends []>(handler: EntityRequestHandler) {
  return (
    ...args: T
  ) => {
    handler(...args);
    return state;
  };
}

export interface PipelineFactoryConfig {
  store: Store<AppState>;
  httpClient: HttpClient;
  action: EntityRequestAction;
}

export interface PipelineConfig {
  requestType: ApiRequestTypes;
  catalogueEntity: StratosBaseCatalogueEntity;
  action: EntityRequestAction;
}

export const baseRequestPipelineFactory: EntityRequestPipeline = (
  store: Store<AppState>,
  httpClient: HttpClient,
  { action, requestType, catalogueEntity }: PipelineConfig
) => {
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const request = buildRequestEntityPipe(requestType, action.options);
  const normalizeEntityPipe = normalizeEntityPipeFactory(catalogueEntity, action.schemaKey);
  const handleMultiEndpointsPipe = handleMultiEndpointsPipeFactory(action.options.url);
  const endpointErrorHandler = endpointErrorsHandlerFactory(actionDispatcher);
  return makeRequestEntityPipe(httpClient, request).pipe(
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

export const apiRequestPipelineFactory = (
  pipeline: EntityRequestPipeline,
  { store, httpClient, action }: PipelineFactoryConfig
) => {
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const requestType = getRequestTypeFromMethod(action);
  const catalogueEntity = entityCatalogue.getEntity(action.endpointType, action.entityType);
  startEntityHandler(actionDispatcher, catalogueEntity, requestType, action);
  return pipeline(store, httpClient, {
    action,
    requestType,
    catalogueEntity
  }).pipe(
    tap(() => successEntityHandler(actionDispatcher, catalogueEntity, requestType))
  );
};
// action: ICFAction | PaginatedAction, state: CFAppState