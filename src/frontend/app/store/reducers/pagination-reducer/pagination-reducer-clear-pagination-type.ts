import { EndpointAction } from '../../actions/endpoint.actions';
import {
  applicationSchemaKey,
  cfUserSchemaKey,
  organizationSchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  serviceInstancesSchemaKey,
} from '../../helpers/entity-factory';
import { PaginationState } from '../../types/pagination.types';

export function paginationClearType(state: PaginationState, entityKey, defaultPaginationEntityState) {
  if (state[entityKey]) {
    const clearState = { ...state };
    const entityState = clearState[entityKey];
    const newObject = {};
    Object.keys(entityState).forEach(key => {
      newObject[key] = defaultPaginationEntityState;
    });
    clearState[entityKey] = newObject;
    return clearState;
  }
  return state;
}

export function clearEndpointEntities(state: PaginationState, action: EndpointAction, defaultPaginationEntityState) {
  if (action.endpointType === 'cf') {
    let newState = paginationClearType(state, applicationSchemaKey, defaultPaginationEntityState);
    newState = paginationClearType(newState, spaceSchemaKey, defaultPaginationEntityState);
    newState = paginationClearType(newState, organizationSchemaKey, defaultPaginationEntityState);
    newState = paginationClearType(newState, serviceSchemaKey, defaultPaginationEntityState);
    newState = paginationClearType(newState, cfUserSchemaKey, defaultPaginationEntityState);
    newState = paginationClearType(newState, serviceInstancesSchemaKey, defaultPaginationEntityState);
    return newState;
  }
  return state;
}
