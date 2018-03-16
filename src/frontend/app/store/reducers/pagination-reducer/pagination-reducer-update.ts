import { RequestAction } from '../../types/request.types';
import { State } from '@ngrx/store';
import { AppState } from '../../app-state';
import { PaginationAction, PaginationEntityState } from '../../types/pagination.types';

export function paginationPageBusy(state: PaginationEntityState, action): PaginationEntityState {
  const { busy, apiAction, error } = action;
  const page = apiAction.pageNumber || state.currentPage;

  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        busy: busy,
        error: !!error,
        message: error
      }
    },
  };
}
