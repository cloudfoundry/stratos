import { entityCatalog } from '../../entity-catalog/entity-catalog.service';
import { EndpointAction } from '../../actions/endpoint.actions';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';

export function paginationClearAllTypes(state: PaginationState, entityKeys: string[], defaultPaginationEntityState: PaginationEntityState) {
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

export function clearEndpointEntities(state: PaginationState, action: EndpointAction, defaultPaginationEntityState: PaginationEntityState) {
  const entityKeys = entityCatalog.getAllEntitiesForEndpointType(action.endpointType).map(entity => entity.entityKey);
  if (entityKeys.length > 0) {
    return paginationClearAllTypes(
      state,
      entityKeys,
      defaultPaginationEntityState
    );
  }
  return state;
}
