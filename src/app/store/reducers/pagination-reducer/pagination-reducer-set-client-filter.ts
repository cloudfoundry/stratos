import { SetClientFilter } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetClientFilter(state: PaginationEntityState, action: SetClientFilter) {
  return {
    ...state,
    error: false,
    clientPagination: {
      ...state.clientPagination,
      filter: action.filter
    }
  };
}
