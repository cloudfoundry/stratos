import { SetResultCount } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetResultCount(state: PaginationEntityState, action: SetResultCount) {
  console.log('setting result count')
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
