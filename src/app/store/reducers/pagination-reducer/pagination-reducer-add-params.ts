import { PaginationEntityState } from '../../types/pagination.types';
import { AddParams } from '../../actions/pagination.actions';
import { getUniqueQParams, removeEmptyParams } from './pagination-reducer.helper';

export function paginationAddParams(state: PaginationEntityState, action: AddParams) {
  const addParamAction = action as AddParams;
  return {
    ...state,
    params: removeEmptyParams({
      ...state.params,
      ...addParamAction.params,
      q: getUniqueQParams(addParamAction, state)
    })
  };
}
