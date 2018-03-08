import { RequestAction } from '../../types/request.types';
import { State } from '@ngrx/store';
import { AppState } from '../../app-state';
import { PaginationAction, PaginationEntityState } from '../../types/pagination.types';

export function paginationSuccess(state: PaginationEntityState, action): PaginationEntityState {
  const { apiAction, response, result } = action;
  let { totalResults, totalPages } = action;

  const params = getParams(apiAction);
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
