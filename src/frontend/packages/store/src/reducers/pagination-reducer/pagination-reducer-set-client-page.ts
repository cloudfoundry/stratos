import { SetClientPage } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetClientPage(state: PaginationEntityState, action: SetClientPage) {
  return {
    ...state,
    error: false,
    clientPagination: {
      ...state.clientPagination,
      currentPage: action.pageNumber
    }
  };
}
