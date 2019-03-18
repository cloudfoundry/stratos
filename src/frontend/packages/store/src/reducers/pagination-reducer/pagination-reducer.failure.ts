import { PaginationEntityState } from '../../types/pagination.types';
export function paginationFailure(state: PaginationEntityState, action) {
  const page = action.apiAction.pageNumber || state.currentPage;
  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        busy: false,
        error: true,
        message: action.message
      }
    }
  };
}
