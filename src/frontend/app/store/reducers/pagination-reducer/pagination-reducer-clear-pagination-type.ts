import { PaginationState } from '../../types/pagination.types';
import { applicationSchemaKey, spaceSchemaKey, organizationSchemaKey, serviceSchemaKey } from '../../helpers/entity-factory';
import { EndpointAction } from '../../actions/endpoint.actions';
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
    return newState;
  }
  return state;
}
