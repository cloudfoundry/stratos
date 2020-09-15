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
