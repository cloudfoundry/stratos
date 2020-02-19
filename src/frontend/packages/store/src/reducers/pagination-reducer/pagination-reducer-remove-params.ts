import { QParam } from '../../../../cloud-foundry/src/shared/q-param';
import { RemoveParams } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationRemoveParams(state: PaginationEntityState, action: RemoveParams) {

  const removeParamsState = {
    ...state,
    params: {
      ...state.params,
    }
  };

  if (state.params.q) {
    removeParamsState.params.q = (state.params.q as string[]).filter((qs: string) => {
      return !action.qs.find((removeParamKey: string) => QParam.keyFromString(qs) === removeParamKey);
    });
  }

  action.params.forEach((key) => {
    if (removeParamsState.params.hasOwnProperty(key)) {
      delete removeParamsState.params[key];
    }
  });

  return removeParamsState;
}
