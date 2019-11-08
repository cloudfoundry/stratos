import { HttpParams } from '@angular/common/http';

import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { InternalAppState } from '../../app-state';
import { resultPerPageParam, resultPerPageParamDefault } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { selectPaginationState } from '../../selectors/pagination.selectors';
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
  catalogueEntity: StratosBaseCatalogueEntity,
  appState: InternalAppState,
): HttpParams {
  const params = setRequestParams(new HttpParams(), action.initialParams);

  // Set params from store
  const paginationState = selectPaginationState(
    catalogueEntity.entityKey,
    action.paginationKey,
  )(appState);
  const paginationParams = getPaginationParams(paginationState);
  // TODO We shouldn't be modifying this here as it is a unexpected side effect. #3977
  action.pageNumber = paginationState
    ? paginationState.currentPage
    : 1;
  const paramsFromPagination = setRequestParams(params, paginationParams);
  if (!paramsFromPagination.has(resultPerPageParam)) {
    return paramsFromPagination.set(
      resultPerPageParam,
      resultPerPageParamDefault.toString(),
    );
  }
  return paramsFromPagination;
}
