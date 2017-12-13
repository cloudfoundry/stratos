import { PaginationState } from '../../types/pagination.types';
export function paginationClearType(state: PaginationState, action) {
  if (state[action.entityKey]) {
    const clearState = { ...state };
    clearState[action.entityKey] = {};
    return clearState;
  }
  return state;
}
