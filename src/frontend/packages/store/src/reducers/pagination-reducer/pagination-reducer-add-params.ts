import { PaginationEntityState } from '../../types/pagination.types';
import { AddParams } from '../../actions/pagination.actions';
import { removeEmptyParams } from './pagination-reducer.helper';

export function paginationAddParams(state: PaginationEntityState, action: AddParams) {
  const addParamAction = action as AddParams;
  return {
    ...state,
    params: removeEmptyParams({
      ...state.params,
      ...addParamAction.params,
      // TODO Look into why this was needed. This is CF specific.
      // q: getUniqueQParams(addParamAction, state)
    })
  };
}
