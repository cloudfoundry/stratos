import { Action, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { isHttpErrorResponse } from '../../../core/src/jetstream.helpers';
import { AppState, InternalAppState } from '../app-state';
import { RecursiveDelete } from '../effects/recursive-entity-delete.effect';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ApiRequestTypes, getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import { PaginatedAction } from '../types/pagination.types';
import { EntityRequestAction } from '../types/request.types';
import { failedEntityHandler } from './entity-request-base-handlers/fail-entity-request.handler';
import { patchActionWithForcedConfig } from './entity-request-base-handlers/forced-action-type.helpers';
import { jetstreamErrorHandler } from './entity-request-base-handlers/jetstream-error.handler';
import { startEntityHandler } from './entity-request-base-handlers/start-entity-request.handler';
import { successEntityHandler } from './entity-request-base-handlers/success-entity-request.handler';
import {
  EntityRequestPipeline,
  PipelineResult,
  PreApiRequest,
  SuccessfulApiResponseDataMapper,
} from './entity-request-pipeline.types';
import { PipelineHttpClient } from './pipline-http-client.service';

export interface PipelineFactoryConfig<T extends AppState = InternalAppState> {
  store: Store<AppState>;
  httpClient: PipelineHttpClient;
  action: EntityRequestAction;
  appState: T;
}

export interface PipelineConfig<T extends AppState = InternalAppState> {
  requestType: ApiRequestTypes;
  catalogEntity: StratosBaseCatalogEntity;
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
  const patchedAction = patchActionWithForcedConfig(action as PaginatedAction);

  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const requestType = getRequestTypeFromMethod(patchedAction);

  const catalogEntity = entityCatalog.getEntity(patchedAction);
  const recursivelyDelete = shouldRecursivelyDelete(requestType, patchedAction);

  if (recursivelyDelete) {
    store.dispatch(
      new RecursiveDelete(action.guid, catalogEntity.getSchema(patchedAction.schemaKey)),
    );
  }

  startEntityHandler(actionDispatcher, catalogEntity, requestType, action);
  return pipeline(store, httpClient, {
    action,
    requestType,
    catalogEntity,
    appState
  }).pipe(
    tap((response) => {
      if (response.success) {
        successEntityHandler(actionDispatcher, catalogEntity, requestType, action, response, recursivelyDelete);
      } else {
        failedEntityHandler(actionDispatcher, catalogEntity, requestType, action, response, recursivelyDelete);
      }
    }),
    map(() => catalogEntity.getRequestAction('complete', action, requestType)),
    catchError(error => {
      const httpResponse = isHttpErrorResponse(error);
      const response: PipelineResult = {
        success: false,
        errorMessage: httpResponse ? httpResponse.error : null
      };
      failedEntityHandler(actionDispatcher, catalogEntity, requestType, action, response, recursivelyDelete);
      jetstreamErrorHandler(
        error,
        patchedAction,
        catalogEntity,
        requestType,
        actionDispatcher,
        recursivelyDelete
      );
      console.warn(error);
      return of({ type: 'Stratos error handled.', error });
    }),
  );
};

