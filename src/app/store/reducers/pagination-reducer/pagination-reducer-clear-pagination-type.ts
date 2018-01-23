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

export function clearEndpointEntities(state: PaginationState, defaultPaginationEntityState) {
  let newState = {};
  newState = paginationClearType(state, 'application', defaultPaginationEntityState);
  newState = paginationClearType(newState, 'space', defaultPaginationEntityState);
  newState = paginationClearType(newState, 'organization', defaultPaginationEntityState);
  return newState;
}
