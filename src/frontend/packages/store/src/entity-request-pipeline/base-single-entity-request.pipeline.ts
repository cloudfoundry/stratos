import { EntityRequestPipeline, BasePipelineConfig, SuccessfulApiRequestDataMapper, PreApiRequest } from './entity-request-pipeline.types';
import { Store, Action } from '@ngrx/store';
import { AppState, InternalAppState } from '../app-state';
import { PipelineHttpClient } from './pipline-http-client.service';
import { buildRequestEntityPipe } from './entity-request-base-handlers/build-entity-request.pipe';
import { normalizeEntityPipeFactory } from './entity-request-base-handlers/normalize-entity-request-response.pipe';
import { handleMultiEndpointsPipeFactory } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { endpointErrorsHandlerFactory } from './entity-request-base-handlers/endpoint-errors.handler';
import { makeRequestEntityPipe } from './entity-request-base-handlers/make-request-entity-request.pipe';
import { map } from 'rxjs/operators';
import { multiEndpointResponseMergePipe } from './entity-request-base-handlers/merge-multi-endpoint-data.pipe';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';


export interface SingleRequestPipelineConfig<T extends AppState = InternalAppState> extends BasePipelineConfig<T> {
}

function getSuccessMapper(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  return definition.successfulRequestDataMapper || definition.endpoint.globalSuccessfulRequestDataMapper || null;
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
  const handleMultiEndpointsPipe = handleMultiEndpointsPipeFactory(action.options.url, postSuccessDataMapper);
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
