import { Action, Store } from '@ngrx/store';
import { map, tap } from 'rxjs/operators';
import { StratosBaseCatalogueEntity, StratosCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { AppState, InternalAppState } from '../app-state';
import { ApiRequestTypes, getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import { EntityRequestAction } from '../types/request.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { endpointErrorsHandlerFactory } from './entity-request-base-handlers/endpoint-errors.handler';
import { failedEntityHandler } from './entity-request-base-handlers/fail-entity-request.handler';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { multiEndpointResponseMergePipe } from './entity-request-base-handlers/merge-multi-endpoint-data.pipe';
import { normalizeEntityPipeFactory } from './entity-request-base-handlers/normalize-entity-request-response.pipe';
import { startEntityHandler } from './entity-request-base-handlers/start-entity-request.handler';
import { successEntityHandler } from './entity-request-base-handlers/success-entity-request.handler';
import { EntityRequestPipeline } from './entity-request-pipeline.types';
import { PipelineHttpClient } from './pipline-http-client.service';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';



export interface PipelineFactoryConfig<T extends AppState = InternalAppState> {
  store: Store<AppState>;
  httpClient: PipelineHttpClient;
  action: EntityRequestAction;
  appState: T;
}

export interface PipelineConfig<T extends AppState = InternalAppState> {
  requestType: ApiRequestTypes;
  catalogueEntity: StratosBaseCatalogueEntity;
  action: EntityRequestAction;
  appState: T;
  postSuccessDataMapper?: SuccessfulApiRequestDataMapper;
  preRequest?: PreApiRequest;
}


function getSuccessMapper(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  return definition.successfulRequestDataMapper || definition.endpoint.globalSuccessfulRequestDataMapper || null;
}

function getPreRequestFunction(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  return definition.preRequest || definition.endpoint.globalPreRequest || null;
}

export const apiRequestPipelineFactory = (
  pipeline: EntityRequestPipeline,
  { store, httpClient, action, appState }: PipelineFactoryConfig
) => {
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const requestType = getRequestTypeFromMethod(action);
  const catalogueEntity = entityCatalogue.getEntity(action.endpointType, action.entityType);
  const postSuccessDataMapper = getSuccessMapper(catalogueEntity);
  const preRequest = getPreRequestFunction(catalogueEntity);
  startEntityHandler(actionDispatcher, catalogueEntity, requestType, action);
  return pipeline(store, httpClient, {
    action,
    requestType,
    catalogueEntity,
    appState,
    postSuccessDataMapper,
    preRequest
  }).pipe(
    tap((response) => {
      if (response.success) {
        successEntityHandler(actionDispatcher, catalogueEntity, requestType, action, response.response);
      } else {
        failedEntityHandler(actionDispatcher, catalogueEntity, requestType, action, response.response);
      }
    }),
    map(() => catalogueEntity.getRequestAction('complete', requestType))
  );
};
// action: ICFAction | PaginatedAction, state: CFAppState