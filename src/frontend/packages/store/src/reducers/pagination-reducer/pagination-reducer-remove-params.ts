import type { RemoveParams } from '../../actions/pagination.actions';
import type { PaginationEntityState } from '../../types/pagination.types';

export function paginationRemoveParams(state: PaginationEntityState, action: RemoveParams) {

  const removeParamsState = {
    ...state,
    params: {
      ...state.params,
    }
  };

  action.params.forEach((key) => {
    if (Object.hasOwn(removeParamsState.params, key)) {
      delete removeParamsState.params[key];
    }
  });

  return removeParamsState;
}
