import { PaginationState } from '../../types/pagination.types';
export function paginationResetPagination(state: PaginationState, action) {
  if (!state[action.entityKey] || !state[action.entityKey][action.paginationKey]) {
    return state;
  }
  const newState = { ...state };
  const entityState = {
    ...newState[action.entityKey],
    [action.paginationKey]: {
      ...newState[action.entityKey][action.paginationKey],
      ids: {},
      pageRequests: {},
      fetching: false,
      pageCount: 0,
      currentPage: 1,
      totalResults: 0,
      error: false,
      message: ''
    }
  };
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}
