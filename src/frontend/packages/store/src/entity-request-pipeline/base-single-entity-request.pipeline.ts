import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { AppState, InternalAppState } from '../app-state';
import { EntityRequestAction } from '../types/request.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import {
  handleJetstreamResponsePipeFactory,
  handleNonJetstreamResponsePipeFactory
} from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { mapMultiEndpointResponses } from './entity-request-base-handlers/map-multi-endpoint.pipes';
import { BasePipelineConfig, EntityRequestPipeline, PipelineResult } from './entity-request-pipeline.types';
import { singleRequestToPaged, isJetstreamRequest } from './pipeline-helpers';
import { PipelineHttpClient } from './pipline-http-client.service';

export interface SingleRequestPipelineConfig<T extends AppState = InternalAppState> extends BasePipelineConfig<T> {
  action: EntityRequestAction;
}

function getPreRequestFunction(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  return definition.preRequest || definition.endpoint.globalPreRequest || null;
}

export const baseRequestPipelineFactory: EntityRequestPipeline = (
  store: Store<AppState>,
  httpClient: PipelineHttpClient,
  { action, requestType, catalogueEntity }: SingleRequestPipelineConfig
): Observable<PipelineResult> => {
  const preRequest = getPreRequestFunction(catalogueEntity);
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const baseRequest = buildRequestEntityPipe(requestType, action.options);
  const request = preRequest ? preRequest(baseRequest, action, catalogueEntity) : baseRequest;
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
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
    entityCatalogue.getEndpoint(action.endpointType, action.subType),
    action.endpointGuid,
    action.externalRequest
  ).pipe(
    map(response => isJetstreamEntityRequest ? singleRequestToPaged(response) : response),
    // Convert { [endpointGuid]: <raw response> } to { { errors: [], successes: [] } }
    map(handleMultiEndpointsPipe),
    // Convert { { errors: [], successes: [] } } to { response: NoramlisedResponse, success: boolean }
    map(multiEndpointResponses => mapMultiEndpointResponses(
      action,
      catalogueEntity,
      requestType,
      multiEndpointResponses,
      actionDispatcher
    ))
  );
};
