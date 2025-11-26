import type { Action } from '@ngrx/store';
import { normalize } from 'normalizr';

import type { IRequestEntityTypeState } from '../../app-state';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import type { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { IStratosEntityDefinition } from '../../entity-catalog/entity-catalog.types';
import type { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import type { NormalizedResponse } from '../../types/api.types';
import type { EntityRequestAction } from '../../types/request.types';
import type { PipelineResult } from '../entity-request-pipeline.types';
import { getSuccessMapper } from '../pipeline-helpers';
import { endpointErrorsHandlerFactory } from './endpoint-errors.handler';
import { patchActionWithForcedConfig } from './forced-action-type.helpers';
import type { HandledMultiEndpointResponse, JetstreamError, MultiEndpointResponse } from './handle-multi-endpoints.pipe';
import { multiEndpointResponseMergePipe } from './merge-multi-endpoint-data.pipe';

const baseErrorHandler = () => 'Api Request Failed';

function createErrorMessage(definition: IStratosEntityDefinition, errors: JetstreamError[]) {
  const errorMessageHandler = definition.errorMessageHandler || definition.endpoint.globalErrorMessageHandler || baseErrorHandler;
  return errorMessageHandler(errors);
}

function getEntities(
  endpointResponse: {
    normalizedEntities: NormalizedResponse<unknown>;
    endpointGuid: string;
  },
  action: EntityRequestAction
): Record<string, IRequestEntityTypeState<unknown>> {
  return Object.keys(endpointResponse.normalizedEntities.entities).reduce(
    (newEntities, entityKey) => {
      const innerCatalogEntity = entityCatalog.getEntityFromKey(entityKey) as StratosBaseCatalogEntity;
      const entitySuccessMapper = getSuccessMapper(innerCatalogEntity);
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
          const newGuid = entity ? innerCatalogEntity.getGuidFromEntity(entity) || guid : guid;
          return {
            ...newEntitiesOfType,
            [newGuid]: entity
          };
        }, {} as Record<string, unknown>
      ) : endpointResponse.normalizedEntities.entities[entityKey] as IRequestEntityTypeState<unknown>;
      return {
        ...newEntities,
        [entityKey]: entities
      };
    }, {} as Record<string, IRequestEntityTypeState<unknown>>);
}

// TODO: Type the output of this pipe. #3976
function getNormalizedEntityData(
  entities: unknown[],
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity | null) {
  if (!catalogEntity) {
    throw new Error(
      `Cannot normalize entity data: catalog entity not found for endpoint '${action.endpointType}' and entity '${action.entityType}'`
    );
  }
  // Can patchActionWithForcedConfig be done outside of the pipe?
  // This pipe shouldn't have to worry about the multi entity lists.
  const patchedAction = patchActionWithForcedConfig(action);
  const schema = patchedAction.entity || catalogEntity.getSchema(patchedAction.schemaKey);
  const arraySafeSchema = Array.isArray(schema) ? schema[0] : schema;
  return normalize(entities, Array.isArray(entities) ? [arraySafeSchema] : arraySafeSchema);
}

export function mapMultiEndpointResponses(
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity | null,
  requestType: ApiRequestTypes,
  multiEndpointResponses: HandledMultiEndpointResponse,
  actionDispatcher: (actionToDispatch: Action) => void
): PipelineResult {
  if (!catalogEntity) {
    return {
      success: false,
      errorMessage: `Cannot process multi-endpoint response: catalog entity not found for endpoint '${action.endpointType}' and entity '${action.entityType}'`
    };
  }
  const endpointErrorHandler = endpointErrorsHandlerFactory(actionDispatcher);
  endpointErrorHandler(
    action,
    catalogEntity,
    requestType,
    multiEndpointResponses.errors
  );

  if (multiEndpointResponses.errors?.length) {
    const errorMessage = createErrorMessage(catalogEntity.definition as IStratosEntityDefinition, multiEndpointResponses.errors);
    return {
      success: false,
      errorMessage
    };
  } else {
    const responses = multiEndpointResponses.successes
      .map((responseData: MultiEndpointResponse<unknown>) => ({
        normalizedEntities: getNormalizedEntityData(responseData.entities as unknown[], action, catalogEntity),
        endpointGuid: responseData.endpointGuid,
        totalResults: responseData.totalResults,
        totalPages: responseData.totalPages
      }))
      .map(endpointResponse => {
        const entities = getEntities(endpointResponse, action);
        const parentEntities = entities[catalogEntity.entityKey];
        return {
          response: {
            entities,
            // If we changed the guid of the entities then make sure this is reflected in the result array.
            result: parentEntities ? Object.keys(parentEntities) : endpointResponse.normalizedEntities.result,
          },
          totalPages: endpointResponse.totalPages,
          totalResults: endpointResponse.totalResults,
          success: true
        } as PipelineResult;
      });
    const response = multiEndpointResponseMergePipe(responses);
    return {
      ...response,
      success: true,
    };
  }
}
