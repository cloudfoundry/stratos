import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState, InternalAppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IStratosEntityDefinition } from '../entity-catalog/entity-catalog.types';
import { EntityRequestAction } from '../types/request.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import {
  handleJetstreamResponsePipeFactory,
  handleNonJetstreamResponsePipeFactory,
} from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { mapMultiEndpointResponses } from './entity-request-base-handlers/map-multi-endpoint.pipes';
import { BasePipelineConfig, EntityRequestPipeline, PipelineResult } from './entity-request-pipeline.types';
import { isJetstreamRequest, singleRequestToPaged } from './pipeline-helpers';
import { PipelineHttpClient } from './pipline-http-client.service';

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
  return makeRequestEntityPipe(
    httpClient,
    request,
    entityCatalog.getEndpoint(action.endpointType, action.subType),
    action.endpointGuid,
    action.externalRequest
  ).pipe(
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
