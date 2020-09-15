import { EndpointActionComplete } from '../../actions/endpoint.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { PaginationState } from '../../types/pagination.types';
import { getDefaultPaginationEntityState } from './pagination-reducer-reset-pagination';

export function paginationClearAllTypes(state: PaginationState, entityKeys: string[]) {
  return entityKeys.reduce((prevState, entityKey) => {
    if (prevState[entityKey]) {
      const entityState = state[entityKey];
      const clearedEntity = Object.keys(entityState).reduce((prevEntityState, key) => {
        const defaultPaginationEntityState = getDefaultPaginationEntityState(entityState[key].maxedState.ignoreMaxed);
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

export function clearEndpointEntities(state: PaginationState, action: EndpointActionComplete) {
  const entityKeys = entityCatalog.getAllEntitiesForEndpointType(action.endpointType).map(entity => entity.entityKey);
  if (entityKeys.length > 0) {
    return paginationClearAllTypes(
      state,
      entityKeys
    );
  }
  return state;
}
