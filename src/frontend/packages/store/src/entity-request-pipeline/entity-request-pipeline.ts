import { Action, Store } from '@ngrx/store';
import { map, tap, catchError } from 'rxjs/operators';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { AppState, InternalAppState } from '../app-state';
import { ApiRequestTypes, getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import { EntityRequestAction } from '../types/request.types';
import { failedEntityHandler } from './entity-request-base-handlers/fail-entity-request.handler';
import { startEntityHandler } from './entity-request-base-handlers/start-entity-request.handler';
import { successEntityHandler } from './entity-request-base-handlers/success-entity-request.handler';
import { EntityRequestPipeline, PreApiRequest, SuccessfulApiResponseDataMapper } from './entity-request-pipeline.types';
import { PipelineHttpClient } from './pipline-http-client.service';
import { RecursiveDelete } from '../effects/recursive-entity-delete.effect';
import { jetstreamErrorHandler } from './entity-request-base-handlers/jetstream-error.handler';
import { of } from 'rxjs';

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
  postSuccessDataMapper?: SuccessfulApiResponseDataMapper;
  preRequest?: PreApiRequest;
}

function shouldRecursivelyDelete(requestType: string, apiAction: EntityRequestAction) {
  return requestType === 'delete' && !apiAction.updatingKey;
}

export const apiRequestPipelineFactory = (
  pipeline: EntityRequestPipeline,
  { store, httpClient, action, appState }: PipelineFactoryConfig
) => {
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const requestType = getRequestTypeFromMethod(action);
  const catalogueEntity = entityCatalogue.getEntity(action.endpointType, action.entityType);
  const recursivelyDelete = shouldRecursivelyDelete(requestType, action);

  if (recursivelyDelete) {
    store.dispatch(
      new RecursiveDelete(action.guid, catalogueEntity.getSchema(action.schemaKey)),
    );
  }

  startEntityHandler(actionDispatcher, catalogueEntity, requestType, action);
  return pipeline(store, httpClient, {
    action,
    requestType,
    catalogueEntity,
    appState
  }).pipe(
    tap((response) => {
      // TODO Failure of a single endpoint (with many connected) doesn't seem to work - investigate.
      if (response.success) {
        successEntityHandler(actionDispatcher, catalogueEntity, requestType, action, response.response, recursivelyDelete);
      } else {
        failedEntityHandler(actionDispatcher, catalogueEntity, requestType, action, response.response, recursivelyDelete);
      }
    }),
    map(() => catalogueEntity.getRequestAction('complete', requestType)),
    catchError(error => {
      // TODO We should pass the endpoint ids to this so we can correctly map the error to the endpoint.
      jetstreamErrorHandler(
        error,
        action,
        catalogueEntity,
        requestType,
        actionDispatcher,
        recursivelyDelete
      );
      console.warn(error);
      return of({ type: 'Stratos error handled.', error });
    }),
  );
};

