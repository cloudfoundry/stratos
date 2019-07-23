import { PaginatedAction, PaginationParam, PaginationEntityState } from '../../types/pagination.types';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { InternalAppState } from '../../app-state';
import { HttpParams } from '@angular/common/http';
import { qParamToString, qParamKeyFromString } from '../../reducers/pagination-reducer/pagination-reducer.helper';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import { resultPerPageParam, resultPerPageParamDefault } from '../../reducers/pagination-reducer/pagination-reducer.types';

function getPaginationParams(paginationState: PaginationEntityState): PaginationParam {
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
) {
  if (params.hasOwnProperty('q')) {
    // We need to create a series of q values that contain all from `requestParams` and `params`. Any that exist in `requestParams` should
    // be overwritten in `params`

    // Clear `requestParams` `q` and start afresh
    const initialQParams = requestParams.getAll('q');
    const clearParams = requestParams.delete('q');

    // Loop through all the NEW params that we wish to keep
    params.q.forEach(qParam => {
      // Add new param we wish to keep
      requestParams.append('q', qParamToString(qParam));
      // Remove any initial params that have been `overwritten`. This won't be added again later on
      const haveInitialParam = initialQParams.findIndex(qParamStr => qParam.key === qParamKeyFromString(qParamStr));
      if (haveInitialParam >= 0) {
        initialQParams.splice(haveInitialParam, 1);
      }
    });

    // Add the rest of the initial params
    initialQParams.forEach(qParamStr => requestParams.append('q', qParamStr));

    // Remove from q from `params` so it's not added again below
    delete params.qString;
    delete params.q;
  }
  // Assign other params
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      requestParams.set(key, params[key] as string);
    }
  }
}

export function fetchUrlParamsFromStore(
  action: PaginatedAction,
  catalogueEntity: StratosBaseCatalogueEntity,
  appState: InternalAppState
) {
  const params = new HttpParams();

  // Set initial params
  if (action.initialParams) {
    setRequestParams(params, action.initialParams);
  }

  // Set params from store
  const paginationState = selectPaginationState(
    catalogueEntity.entityKey,
    action.paginationKey,
  )(appState);
  const paginationParams = getPaginationParams(paginationState);
  action.pageNumber = paginationState
    ? paginationState.currentPage
    : 1;
  setRequestParams(params, paginationParams);
  if (!params.has(resultPerPageParam)) {
    params.set(
      resultPerPageParam,
      resultPerPageParamDefault.toString(),
    );
  }
  return params;
}
