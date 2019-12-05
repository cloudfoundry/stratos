import { PaginationEntityState } from '../../types/pagination.types';

export function paginationPageBusy(state: PaginationEntityState, action): PaginationEntityState {
  const { busy, apiAction, error } = action;
  const page = apiAction.pageNumber || state.currentPage;

  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        ...state.pageRequests[page],
        busy,
        error: !!error,
        message: error
      }
    },
  };
}
