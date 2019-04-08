import { SetPage } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetPage(state: PaginationEntityState, action: SetPage) {
  if (action.forceLocalPage) {
    if (state.forcedLocalPage === action.pageNumber) {
      return state;
    }
    return {
      ...state,
      forcedLocalPage: action.pageNumber
    };
  }
  if (state.currentPage === action.pageNumber) {
    return state;
  }
  return {
    ...state,
    currentPage: action.pageNumber
  };
}

