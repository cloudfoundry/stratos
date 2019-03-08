import { PaginationState } from '../../types/pagination.types';
export function paginationClearPages(state: PaginationState, action) {
  if (!state[action.entityKey] || !state[action.entityKey][action.paginationKey]) {
    return state;
  }
  const newState = { ...state };
  const entityState = {
    ...newState[action.entityKey],
    [action.paginationKey]: {
      ...newState[action.entityKey][action.paginationKey],
      ids: {},
      currentPage: 1
    }
  };
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}
