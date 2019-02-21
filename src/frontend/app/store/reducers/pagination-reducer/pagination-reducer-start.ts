import { PaginationEntityState } from '../../types/pagination.types';

export function paginationStart(state, action): PaginationEntityState {
  const page = action.apiAction.__forcedPageNumber__ || action.apiAction.pageNumber || state.currentPage;
  const entityKey = action.apiAction.__forcedPageNumberEntityKey__;
  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        busy: true,
        error: false,
        message: '',
        entityKey
      }
    }
  };
}
