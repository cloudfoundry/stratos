import { PaginationState, PaginationEntityTypeState } from '../../types/pagination.types';
import { getDefaultPaginationEntityState } from './pagination-reducer.helper';
import { ResetPagination } from '../../actions/pagination.actions';
export function paginationResetPagination(state: PaginationState, action: ResetPagination): PaginationState {
  if (!state[action.entityKey] || !state[action.entityKey][action.paginationKey]) {
    return state;
  }
  const { ids, pageRequests, pageCount, currentPage, totalResults } = getDefaultPaginationEntityState();
  const newState = { ...state };
  const entityState = {
    ...newState[action.entityKey],
    [action.paginationKey]: {
      ...newState[action.entityKey][action.paginationKey],
      ids,
      pageRequests,
      pageCount,
      currentPage,
      totalResults,
    }
  } as PaginationEntityTypeState;
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}
