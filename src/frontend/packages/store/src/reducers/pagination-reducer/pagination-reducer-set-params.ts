import { PaginationEntityState } from '../../types/pagination.types';
import { SetParams } from '../../actions/pagination.actions';
import { removeEmptyParams } from './pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from './pagination-reducer.types';
export function paginationSetParams(state: PaginationEntityState, action: SetParams) {
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
      // TODO Look into why this was needed. This is CF specific.
      // q: getUniqueQParams(action, state),
      ...state.params,
    };
  }
  return {
    ...state,
    params: removeEmptyParams(params)
  };
}
