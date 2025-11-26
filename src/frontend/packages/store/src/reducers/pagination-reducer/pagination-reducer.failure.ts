import type { PaginatedAction, PaginationEntityState } from '../../types/pagination.types';
import type { IFailedRequestAction } from '../../types/request.types';

export function paginationFailure(state: PaginationEntityState, action: IFailedRequestAction & { apiAction: PaginatedAction }): PaginationEntityState {
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
