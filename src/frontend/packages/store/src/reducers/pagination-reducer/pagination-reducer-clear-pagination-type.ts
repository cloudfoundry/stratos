import { getEndpointSchemeKeys } from '../../../../core/src/core/extension/extension-service';
import { EndpointAction } from '../../actions/endpoint.actions';
import {
  applicationSchemaKey,
  cfUserSchemaKey,
  organizationSchemaKey,
  serviceInstancesSchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  userProvidedServiceInstanceSchemaKey,
} from '../../helpers/entity-factory';
import { PaginationState } from '../../types/pagination.types';

export function paginationClearAllTypes(state: PaginationState, entityKeys: string[], defaultPaginationEntityState) {
  return entityKeys.reduce((prevState, entityKey) => {
    if (prevState[entityKey]) {
      const entityState = state[entityKey];
      const clearedEntity = Object.keys(entityState).reduce((prevEntityState, key) => {
        return {
          ...prevEntityState,
          [key]: defaultPaginationEntityState
        };
      }, entityState);
      return {
        ...prevState,
        [entityKey]: clearedEntity
      };
    }
    return prevState;
  }, state);
}

export function clearEndpointEntities(state: PaginationState, action: EndpointAction, defaultPaginationEntityState) {
  if (action.endpointType === 'cf') {
    return paginationClearAllTypes(
      state,
      [
        applicationSchemaKey,
        spaceSchemaKey,
        organizationSchemaKey,
        serviceSchemaKey,
        cfUserSchemaKey,
        serviceInstancesSchemaKey,
        userProvidedServiceInstanceSchemaKey
      ],
      defaultPaginationEntityState
    );
  }

  // Check extensions
  const entityKeys = getEndpointSchemeKeys(action.endpointType);
  if (entityKeys.length > 0) {
    return paginationClearAllTypes(
      state,
      entityKeys,
      defaultPaginationEntityState
    );
  }
  return state;
}
