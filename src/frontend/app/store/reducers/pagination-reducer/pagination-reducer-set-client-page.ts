import { SetClientPage } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

export function paginationSetClientPage(state: PaginationEntityState, action: SetClientPage) {
  return {
    ...state,
    error: false,
    clientPagination: {
      ...spreadClientPagination(state.clientPagination),
      currentPage: action.pageNumber
    }
  };
}
