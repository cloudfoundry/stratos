import { SetClientPage } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetClientPage(state: PaginationEntityState, action: SetClientPage): PaginationEntityState {
  if (state.clientPagination.currentPage === action.pageNumber) {
    return state;
  }
  return {
    ...state,
    clientPagination: {
      ...state.clientPagination,
      currentPage: action.pageNumber
    }
  };
}
