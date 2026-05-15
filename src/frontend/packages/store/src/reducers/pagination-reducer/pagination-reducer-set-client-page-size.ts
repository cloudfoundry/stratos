import { SetClientPageSize } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetClientPageSize(state: PaginationEntityState, action: SetClientPageSize) {
  if (!action.force && action.pageSize === state.clientPagination.pageSize) {
    return state;
  }
  return {
    ...state,
    error: false,
    clientPagination: {
      ...state.clientPagination,
      pageSize: action.pageSize
    }
  };
}
