import { PaginatedAction, PaginationParam, PaginationEntityState } from '../../types/pagination.types';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { InternalAppState } from '../../app-state';
import { HttpParams } from '@angular/common/http';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import { resultPerPageParam, resultPerPageParamDefault } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { QParam } from '../../q-param';

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
  // TODO See if this works without this.
  // This is cf specific so needs to be moved and a hook added if it's needed.
  // if (params.hasOwnProperty('q')) {
  //   // We need to create a series of q values that contain all from `requestParams` and `params`. Any that exist in `requestParams` should
  //   // be overwritten in `params`

  //   // Clear `requestParams` `q` and start afresh
  //   const initialQParams = requestParams.getAll('q');
  //   const clearParams = requestParams.delete('q');
  //   const qParamStrings = params.q as string[];
  //   // Loop through all the NEW params that we wish to keep
  //   qParamStrings.forEach((qParamString: string) => {
  //     // Add new param we wish to keep
  //     clearParams.append('q', qParamString);
  //     // Remove any initial params that have been `overwritten`. This won't be added again later on
  //     const haveInitialParam = initialQParams.
  //       findIndex(qParamStr => QParam.keyFromString(qParamString) === QParam.keyFromString(qParamStr));
  //     if (haveInitialParam >= 0) {
  //       initialQParams.splice(haveInitialParam, 1);
  //     }
  //   });

  //   // Add the rest of the initial params
  //   initialQParams.forEach(qParamStr => clearParams.append('q', qParamStr));

  //   // Remove from q from `params` so it's not added again below
  //   delete params.qString;
  //   delete params.q;
  // }
  // Assign other params
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      requestParams.set(key, params[key] as string);
    }
  }
}

export function getPaginationParamsPipe(
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
