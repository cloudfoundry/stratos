import { PaginationEntityState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

export function paginationSuccess(state: PaginationEntityState, action): PaginationEntityState {
  const { apiAction, response, result } = action;
  let { totalResults, totalPages } = action;
  totalResults = totalResults || (response ? response.result.length : state.totalResults);
  totalPages = totalPages || (response ? response.totalPages : state.pageCount);
  const page = apiAction.pageNumber || state.currentPage;
  const pageResult = result || (response ? response.result : state[page]);

  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
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
      ...spreadClientPagination(state.clientPagination),
      totalResults
    }
  };
}
