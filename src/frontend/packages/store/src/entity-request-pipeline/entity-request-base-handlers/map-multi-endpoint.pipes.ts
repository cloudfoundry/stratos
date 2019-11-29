import { Action } from '@ngrx/store';
import { normalize } from 'normalizr';

import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { IStratosEntityDefinition } from '../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../../types/api.types';
import { EntityRequestAction } from '../../types/request.types';
import { PipelineResult } from '../entity-request-pipeline.types';
import { getSuccessMapper } from '../pipeline-helpers';
import { endpointErrorsHandlerFactory } from './endpoint-errors.handler';
import { patchActionWithForcedConfig } from './forced-action-type.helpers';
import { HandledMultiEndpointResponse, JetstreamError, MultiEndpointResponse } from './handle-multi-endpoints.pipe';
import { multiEndpointResponseMergePipe } from './merge-multi-endpoint-data.pipe';

const baseErrorHandler = () => 'Api Request Failed';

function createErrorMessage(definition: IStratosEntityDefinition, errors: JetstreamError[]) {
  const errorMessageHandler = definition.errorMessageHandler || definition.endpoint.globalErrorMessageHandler || baseErrorHandler;
  return errorMessageHandler(errors);
}

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
            [newGuid]: entity
          };
        }, {}
      ) : Object.values(endpointResponse.normalizedEntities[entityKey]);
      return {
        ...newEntities,
        [entityKey]: entities
      };
    }, {});
}

// TODO: Type the output of this pipe. #3976
function getNormalizedEntityData(
  entities: any[],
  action: EntityRequestAction,
  catalogueEntity: StratosBaseCatalogueEntity) {
  // Can patchActionWithForcedConfig be done outside of the pipe?
  // This pipe shouldn't have to worry about the multi entity lists.
  const patchedAction = patchActionWithForcedConfig(action);
  const schema = patchedAction.entity || catalogueEntity.getSchema(patchedAction.schemaKey);
  const arraySafeSchema = Array.isArray(schema) ? schema[0] : schema;
  return normalize(entities, Array.isArray(entities) ? [arraySafeSchema] : arraySafeSchema);
}

export function mapMultiEndpointResponses(
  action: EntityRequestAction,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  multiEndpointResponses: HandledMultiEndpointResponse,
  actionDispatcher: (actionToDispatch: Action) => void
): PipelineResult {
  const endpointErrorHandler = endpointErrorsHandlerFactory(actionDispatcher);
  endpointErrorHandler(
    action,
    catalogueEntity,
    requestType,
    multiEndpointResponses.errors
  );

  if (multiEndpointResponses.errors && multiEndpointResponses.errors.length) {
    const errorMessage = createErrorMessage(catalogueEntity.definition as IStratosEntityDefinition, multiEndpointResponses.errors);
    return {
      success: false,
      errorMessage
    };
  } else {
    const responses = multiEndpointResponses.successes
      .map((responseData: MultiEndpointResponse<any>) => ({
        normalizedEntities: getNormalizedEntityData(responseData.entities, action, catalogueEntity),
        endpointGuid: responseData.endpointGuid,
        totalResults: responseData.totalResults,
        totalPages: responseData.totalPages
      }))
      .map(endpointResponse => {
        const entities = getEntities(endpointResponse, action);
        const parentEntities = entities[catalogueEntity.entityKey];
        return {
          response: {
            entities,
            // If we changed the guid of the entities then make sure this is reflected in the result array.
            result: parentEntities ? Object.keys(parentEntities) : endpointResponse.normalizedEntities.result,
          },
          totalPages: endpointResponse.totalPages,
          totalResults: endpointResponse.totalResults,
          success: null
        };
      });
    const response = multiEndpointResponseMergePipe(responses);
    return {
      ...response,
      success: true,
    };
  }
}
