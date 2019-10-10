import { AddParams } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { removeEmptyParams } from './pagination-reducer.helper';

export function paginationAddParams(state: PaginationEntityState, action: AddParams) {
  const addParamAction = action as AddParams;
  return {
    ...state,
    params: removeEmptyParams({
      ...state.params,
      ...addParamAction.params,
    })
  };
}
