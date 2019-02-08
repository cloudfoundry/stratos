import { PaginationEntityState } from './../../types/pagination.types';
import { PaginationState } from '../../types/pagination.types';
export function paginationResetPagination(state: PaginationState, action): PaginationState {
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
      pageCount: 0,
      currentPage: 1,
      totalResults: 0
    } as PaginationEntityState
  };
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}
