import { SetPage } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetPage(state: PaginationEntityState, action: SetPage) {
  if (action.forceLocalPage) {
    return {
      ...state,
      forcedLocalPage: action.pageNumber
    };
  }
  return {
    ...state,
    error: false,
    currentPage: action.pageNumber
  };
}

