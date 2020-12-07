import { SetInitialParams, SetParams } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { removeEmptyParams } from './pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from './pagination-reducer.types';

export function paginationSetParams(state: PaginationEntityState, action: SetInitialParams | SetParams): PaginationEntityState {
  let params;
  if (action.overwrite) {
    // Overwrite any existing values
    params = {
      [resultPerPageParam]: resultPerPageParamDefault,
      ...action.params,
      q: action.params.q
    };
  } else {
    // Keep any existing values (for instance don't overwrite new params with initial set or params)
    params = {
      [resultPerPageParam]: resultPerPageParamDefault,
      ...action.params,
      ...state.params,
    };
  }
  return {
    ...state,
    params: removeEmptyParams(params)
  };
}
