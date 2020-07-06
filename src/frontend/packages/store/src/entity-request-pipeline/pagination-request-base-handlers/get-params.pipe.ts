import { HttpParams } from '@angular/common/http';

import { resultPerPageParam, resultPerPageParamDefault } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../../types/pagination.types';

export function getPaginationParams(paginationState: PaginationEntityState): PaginationParam {
  return paginationState
    ? {
      ...paginationState.params,
      page: paginationState.currentPage.toString(),
    }
    : {};
}

function setRequestParams(
  requestParams: HttpParams,
  params: PaginationParam,
): HttpParams {
  if (!params) {
    return requestParams;
  }

  return Object.keys(params).reduce((allParams, key) => {
    return allParams.set(key, params[key] + '');
  }, requestParams);
}

export function getPaginationParamsPipe(
  action: PaginatedAction,
  paginationState: PaginationEntityState,
): HttpParams {
  const params = setRequestParams(new HttpParams(), action.initialParams);
  const paginationParams = getPaginationParams(paginationState);
  const paramsFromPagination = setRequestParams(params, paginationParams);
  if (!paramsFromPagination.has(resultPerPageParam)) {
    return paramsFromPagination.set(
      resultPerPageParam,
      resultPerPageParamDefault.toString(),
    );
  }
  return paramsFromPagination;
}
