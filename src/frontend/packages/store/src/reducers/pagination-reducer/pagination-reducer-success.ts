import type { NormalizedResponse } from '../../types/api.types';
import type { PaginatedAction, PaginationEntityState } from '../../types/pagination.types';
import type { ISuccessRequestAction } from '../../types/request.types';

export function paginationSuccess(state: PaginationEntityState, action: ISuccessRequestAction & { apiAction: PaginatedAction; result?: string[]; totalResults?: number; totalPages?: number }): PaginationEntityState {
  const { apiAction, result } = action;
  const response = action.response as NormalizedResponse | undefined;
  let { totalResults, totalPages } = action;
  totalResults = totalResults || (response ? response.result.length : state.totalResults);
  totalPages = totalPages || (response?.totalPages ?? state.pageCount);
  const page = apiAction.__forcedPageNumber__ || apiAction.pageNumber || state.currentPage;
  const pageResult = result || (response ? response.result : state.ids[page]);
  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        ...state.pageRequests[page],
        busy: false,
        error: false,
        message: ''
      }
    },
    ids: {
      ...state.ids,
      [page]: pageResult
    },
    pageCount: totalPages,
    totalResults,
    clientPagination: {
      ...state.clientPagination,
      totalResults
    }
  };
}
