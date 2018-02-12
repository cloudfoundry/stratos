import { RequestAction } from '../../types/request.types';
import { State } from '@ngrx/store';
import { AppState } from '../../app-state';
import { PaginationAction, PaginationEntityState } from '../../types/pagination.types';

export function paginationSuccess(state: PaginationEntityState, action): PaginationEntityState {
  const { apiAction } = action;
  const params = getParams(apiAction);
  const totalResults = action.totalResults || action.response.result.length;
  const page = action.apiAction.pageNumber || state.currentPage;
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
      [page]: action.response.result
    },
    pageCount: action.totalPages,
    totalResults,
    clientPagination: {
      ...state.clientPagination,
      totalResults
    }
  };
}

function getParams(apiAction) {
  const params = {};
  if (apiAction.options && apiAction.options.params) {
    apiAction.options.params.paramsMap.forEach((value, key) => {
      const paramValue = value.length === 1 ? value[0] : value;
      params[key] = paramValue;
    });
  }
  return params;
}
