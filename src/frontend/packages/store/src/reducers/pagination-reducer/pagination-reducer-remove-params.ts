import { RemoveParams } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationRemoveParams(state: PaginationEntityState, action: RemoveParams) {

  const removeParamsState = {
    ...state,
    params: {
      ...state.params,
    }
  };

  action.params.forEach((key) => {
    if (removeParamsState.params.hasOwnProperty(key)) {
      delete removeParamsState.params[key];
    }
  });

  return removeParamsState;
}
