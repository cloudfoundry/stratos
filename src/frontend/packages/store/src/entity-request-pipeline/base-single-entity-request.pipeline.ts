import { Action, Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { AppState, InternalAppState } from '../app-state';
import { EntityRequestAction } from '../types/request.types';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { mapMultiEndpointResponses } from './entity-request-base-handlers/map-multi-endpoint.pipes';
import { BasePipelineConfig, EntityRequestPipeline } from './entity-request-pipeline.types';
import { singleRequestToPaged } from './pipeline-helpers';
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
) => {
  const preRequest = getPreRequestFunction(catalogueEntity);
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const baseRequest = buildRequestEntityPipe(requestType, action.options);
  const request = preRequest ? preRequest(baseRequest, action, catalogueEntity) : baseRequest;
  const handleMultiEndpointsPipe = handleMultiEndpointsPipeFactory(action.options.url);
  return makeRequestEntityPipe(
    httpClient,
    request,
    action.endpointType,
    action.endpointGuid
  ).pipe(
    map(response => singleRequestToPaged(response)),
    map(handleMultiEndpointsPipe),
    map(multiEndpointResponses => mapMultiEndpointResponses(
      action,
      catalogueEntity,
      requestType,
      multiEndpointResponses,
      actionDispatcher
    ))
  );
};
