import type { Action, Store } from '@ngrx/store';
import { type Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import type { AppState, InternalAppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import type { StratosBaseCatalogEntity } from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { IStratosEntityDefinition } from '../entity-catalog/entity-catalog.types';
import type { EntityRequestAction } from '../types/request.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import {
  handleJetstreamResponsePipeFactory,
  handleNonJetstreamResponsePipeFactory,
} from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { mapMultiEndpointResponses } from './entity-request-base-handlers/map-multi-endpoint.pipes';
import type { BasePipelineConfig, EntityRequestPipeline, PipelineResult } from './entity-request-pipeline.types';
import { isJetstreamRequest, singleRequestToPaged } from './pipeline-helpers';
import type { PipelineHttpClient } from './pipline-http-client.service';

export interface SingleRequestPipelineConfig<T extends AppState = InternalAppState> extends BasePipelineConfig<T> {
  action: EntityRequestAction;
}

function getPreRequestFunction(catalogEntity: StratosBaseCatalogEntity) {
  const definition = catalogEntity.definition as IStratosEntityDefinition;
  return definition.preRequest || definition.endpoint.globalPreRequest || null;
}

export const baseRequestPipelineFactory: EntityRequestPipeline = (
  store: Store<AppState>,
  httpClient: PipelineHttpClient,
  { action, requestType, catalogEntity }: SingleRequestPipelineConfig
): Observable<PipelineResult> => {
  // Defensive null checks for Angular 20 DI compatibility
  if (!store || !httpClient || !action || !catalogEntity) {
    console.error('baseRequestPipelineFactory: Missing required dependencies', {
      hasStore: !!store,
      hasHttpClient: !!httpClient,
      hasAction: !!action,
      hasCatalogEntity: !!catalogEntity
    });
    return of({
      success: false,
      errorMessage: 'Missing required dependencies in baseRequestPipelineFactory'
    } as PipelineResult);
  }

  const preRequest = getPreRequestFunction(catalogEntity);
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const baseRequest = buildRequestEntityPipe(requestType, action.options);
  const request = preRequest ? preRequest(baseRequest, action, catalogEntity) : baseRequest;
  const definition = catalogEntity.definition as IStratosEntityDefinition;
  const isJetstreamEntityRequest = isJetstreamRequest(definition);
  const handleMultiEndpointsPipe = isJetstreamEntityRequest ?
    handleJetstreamResponsePipeFactory(
      action.options.url
    ) : handleNonJetstreamResponsePipeFactory(
      action.options.url,
      definition.nonJetstreamRequestHandler
    );

  const requestPipe = makeRequestEntityPipe(
    httpClient,
    request,
    entityCatalog.getEndpoint(action.endpointType, action.subType),
    action.endpointGuid,
    action.externalRequest
  );

  // Guard against null/undefined Observable from makeRequestEntityPipe
  if (!requestPipe) {
    console.error('baseRequestPipelineFactory: makeRequestEntityPipe returned null');
    return of({
      success: false,
      errorMessage: 'Request pipe creation failed'
    } as PipelineResult);
  }

  return requestPipe.pipe(
    map(response => isJetstreamEntityRequest ? singleRequestToPaged(response) : response),
    // Convert { [endpointGuid]: <raw response> } to { { errors: [], successes: [] } }
    map(handleMultiEndpointsPipe),
    // Convert { { errors: [], successes: [] } } to { response: NoramlisedResponse, success: boolean }
    map(multiEndpointResponses => mapMultiEndpointResponses(
      action,
      catalogEntity,
      requestType,
      multiEndpointResponses,
      actionDispatcher
    ))
  );
};
