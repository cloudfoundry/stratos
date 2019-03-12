import { SetResultCount } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetResultCount(state: PaginationEntityState, action: SetResultCount) {
  if (state.totalResults === action.count && state.clientPagination.totalResults === action.count) {
    return state;
  }
  return {
    ...state,
    error: false,
    totalResults: action.count,
    clientPagination: {
      ...state.clientPagination,
      totalResults: action.count
    }
  };
}
