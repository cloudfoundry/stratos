import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSuccess(state: PaginationEntityState, action): PaginationEntityState {
  const { apiAction, response, result } = action;
  let { totalResults, totalPages } = action;
  totalResults = totalResults || (response ? response.result.length : state.totalResults);
  totalPages = totalPages || (response ? response.totalPages : state.pageCount);
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
