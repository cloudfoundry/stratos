import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { getSuccessMapper } from '../pipeline-helpers';
import { multiEndpointResponseMergePipe } from './merge-multi-endpoint-data.pipe';
import { normalizeEntityPipeFactory } from './normalize-entity-request-response.pipe';
import { endpointErrorsHandlerFactory } from './endpoint-errors.handler';
import { EntityRequestAction } from '../../types/request.types';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { HandledMultiEndpointResponse } from './handle-multi-endpoints.pipe';
import { Action } from '@ngrx/store';

export function mapMultiEndpointResponses(
  action: EntityRequestAction,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  multiEndpointResponses: HandledMultiEndpointResponse,
  actionDispatcher: (actionToDispatch: Action) => void
) {
  const normalizeEntityPipe = normalizeEntityPipeFactory(catalogueEntity, action.schemaKey);
  const endpointErrorHandler = endpointErrorsHandlerFactory(actionDispatcher);
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
    const responses = multiEndpointResponses.successes.map(normalizeEntityPipe);
    const mapped = responses.map(endpointResponse => ({
      entities: Object.keys(endpointResponse.normalizedEntities.entities).reduce(
        (newEntities, entityKey) => {
          const innerCatalogueEntity = entityCatalogue.getEntityFromKey(entityKey);
          const entitySuccessMapper = getSuccessMapper(innerCatalogueEntity);
          const entities = entitySuccessMapper ? Object.keys(endpointResponse.normalizedEntities.entities[entityKey]).reduce(
            (newEntitiesOfType, guid) => {
              return {
                ...newEntitiesOfType,
                [guid]: entitySuccessMapper(
                  endpointResponse.normalizedEntities.entities[entityKey][guid],
                  endpointResponse.endpointGuid,
                  guid,
                  entityKey,
                  action.endpointType,
                  action
                )
              };
            }, {}
          ) : endpointResponse.normalizedEntities[entityKey];
          return {
            ...newEntities,
            [entityKey]: entities
          };
        }, {}),
      result: endpointResponse.normalizedEntities.result
    }));
    // NormalizedResponse
    const response = multiEndpointResponseMergePipe(mapped);
    return {
      success: true,
      response
    };
  }
}