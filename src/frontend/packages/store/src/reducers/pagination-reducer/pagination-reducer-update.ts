import type { PaginatedAction, PaginationEntityState } from '../../types/pagination.types';
import type { IUpdateRequestAction } from '../../types/request.types';

export function paginationPageBusy(state: PaginationEntityState, action: IUpdateRequestAction & { apiAction: PaginatedAction }): PaginationEntityState {
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
