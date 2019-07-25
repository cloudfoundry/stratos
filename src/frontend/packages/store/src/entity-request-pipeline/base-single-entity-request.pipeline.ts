import { Action, Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { AppState, InternalAppState } from '../app-state';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { endpointErrorsHandlerFactory } from './entity-request-base-handlers/endpoint-errors.handler';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { multiEndpointResponseMergePipe } from './entity-request-base-handlers/merge-multi-endpoint-data.pipe';
import { normalizeEntityPipeFactory } from './entity-request-base-handlers/normalize-entity-request-response.pipe';
import { BasePipelineConfig, EntityRequestPipeline } from './entity-request-pipeline.types';
import { PipelineHttpClient } from './pipline-http-client.service';
import { EntityRequestAction } from '../types/request.types';
import { getSuccessMapper } from './pipeline-helpers';

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
  const postSuccessDataMapper = getSuccessMapper(catalogueEntity);
  const preRequest = getPreRequestFunction(catalogueEntity);
  const actionDispatcher = (actionToDispatch: Action) => store.dispatch(actionToDispatch);
  const baseRequest = buildRequestEntityPipe(requestType, action.options);
  const request = preRequest ? preRequest(baseRequest, action, catalogueEntity) : baseRequest;
  const normalizeEntityPipe = normalizeEntityPipeFactory(catalogueEntity, action.schemaKey);
  const handleMultiEndpointsPipe = handleMultiEndpointsPipeFactory(action.options.url, action, postSuccessDataMapper);
  const endpointErrorHandler = endpointErrorsHandlerFactory(actionDispatcher);
  return makeRequestEntityPipe(
    httpClient,
    request,
    action.endpointType,
    action.endpointGuid
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
