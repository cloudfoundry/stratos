import { SetResultCount } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

export function paginationSetResultCount(state: PaginationEntityState, action: SetResultCount) {
  if (state.totalResults === action.count && state.clientPagination.totalResults === action.count) {
    return state;
  }
  return {
    ...state,
    error: false,
    totalResults: action.count,
    clientPagination: {
      ...spreadClientPagination(state.clientPagination),
      totalResults: action.count
    }
  };
}
