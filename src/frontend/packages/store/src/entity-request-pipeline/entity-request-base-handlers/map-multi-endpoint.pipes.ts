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
import { NormalizedResponse } from '../../types/api.types';
function getEntities(
  endpointResponse: {
    normalizedEntities: NormalizedResponse<any>;
    endpointGuid: string;
  },
  action: EntityRequestAction
): { [entityKey: string]: any[] } {
  return Object.keys(endpointResponse.normalizedEntities.entities).reduce(
    (newEntities, entityKey) => {
      const innerCatalogueEntity = entityCatalogue.getEntityFromKey(entityKey) as StratosBaseCatalogueEntity;
      const entitySuccessMapper = getSuccessMapper(innerCatalogueEntity);
      const entities = entitySuccessMapper ? Object.keys(endpointResponse.normalizedEntities.entities[entityKey]).reduce(
        (newEntitiesOfType, guid) => {
          const entity = entitySuccessMapper(
            endpointResponse.normalizedEntities.entities[entityKey][guid],
            endpointResponse.endpointGuid,
            guid,
            entityKey,
            action.endpointType,
            action
          );
          const newGuid = entity ? innerCatalogueEntity.getGuidFromEntity(entity) || guid : guid;
          return {
            ...newEntitiesOfType,
            [newGuid]: entitySuccessMapper(
              endpointResponse.normalizedEntities.entities[entityKey][guid],
              endpointResponse.endpointGuid,
              guid,
              entityKey,
              action.endpointType,
              action
            )
          };
        }, {}
      ) : Object.values(endpointResponse.normalizedEntities[entityKey]);
      return {
        ...newEntities,
        [entityKey]: entities
      };
    }, {});
}

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
  if (multiEndpointResponses.errors && multiEndpointResponses.errors.length) {
    return {
      success: false,
      errorMessage: 'Request Failed'
    };
  } else {
    const responses = multiEndpointResponses.successes.map(normalizeEntityPipe);
    const mapped = responses.map(endpointResponse => {
      const entities = getEntities(endpointResponse, action);
      const parentEntities = entities[catalogueEntity.entityKey];
      return {
        entities,
        // If we changed the guid of the entities then make sure this is reflected in the result array.
        result: parentEntities ? Object.keys(parentEntities) : endpointResponse.normalizedEntities.result
      };
    });
    // NormalizedResponse
    const response = multiEndpointResponseMergePipe(mapped);
    return {
      success: true,
      response
    };
  }
}
