import { RemoveParams } from '../../actions/pagination.actions';
import { PaginationEntityState, QParam } from '../../types/pagination.types';

export function paginationRemoveParams(state: PaginationEntityState, action: RemoveParams) {

  const removeParamsState = {
    ...state,
    params: {
      ...state.params,
    }
  };

  if (state.params.q) {
    removeParamsState.params.q = state.params.q.filter((qs: QParam) => {
      return !action.qs.find((removeParamKey: string) => qs.key === removeParamKey);
    });
  }

  action.params.forEach((key) => {
    if (removeParamsState.params.hasOwnProperty(key)) {
      delete removeParamsState.params[key];
    }
  });
  return removeParamsState;
}
