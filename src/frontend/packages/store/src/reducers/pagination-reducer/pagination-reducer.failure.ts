import { PaginationEntityState } from '../../types/pagination.types';
export function paginationFailure(state: PaginationEntityState, action): PaginationEntityState {
  const page = action.apiAction.__forcedPageNumber__ || action.apiAction.pageNumber || state.currentPage;
  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        ...state.pageRequests[page],
        busy: false,
        error: true,
        message: action.message
      }
    }
  };
}
