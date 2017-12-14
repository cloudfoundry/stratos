import { PaginationEntityState } from '../../types/pagination.types';
import { SetParams } from '../../actions/pagination.actions';
import { getUniqueQParams, removeEmptyParams } from './pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from './pagination-reducer.types';
export function paginationSetParams(state: PaginationEntityState, action: SetParams) {
  return {
    ...state,
    params: removeEmptyParams({
      [resultPerPageParam]: resultPerPageParamDefault,
      ...action.params,
      q: getUniqueQParams(action, state)
    })
  };
}
