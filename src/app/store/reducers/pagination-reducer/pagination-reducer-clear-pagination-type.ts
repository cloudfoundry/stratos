import { defaultPaginationEntityState } from './pagination.reducer';
import { PaginationState } from '../../types/pagination.types';
export function paginationClearType(state: PaginationState, action) {
  if (state[action.entityKey]) {
    const clearState = { ...state };
    const entityState = clearState[action.entityKey];
    const newObject = {};
    Object.keys(entityState).forEach(key => {
      newObject[key] = defaultPaginationEntityState;
    });
    clearState[action.entityKey] = newObject;
    return clearState;
  }
  return state;
}
