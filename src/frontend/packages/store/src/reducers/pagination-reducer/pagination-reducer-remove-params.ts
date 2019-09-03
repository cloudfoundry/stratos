import { RemoveParams } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { QParam } from '../../q-param';

export function paginationRemoveParams(state: PaginationEntityState, action: RemoveParams) {

  const removeParamsState = {
    ...state,
    params: {
      ...state.params,
    }
  };
  // TODO We need to be able to do this. THe qparam is odd because the 'key' is always
  // q with the actual keys in the q param string.
  // if (state.params.q) {
  //   removeParamsState.params.q = (state.params.q as string[]).filter((qs: string) => {
  //     return !action.qs.find((removeParamKey: string) => QParam.keyFromString(qs) === removeParamKey);
  //   });
  // }

  action.params.forEach((key) => {
    if (removeParamsState.params.hasOwnProperty(key)) {
      delete removeParamsState.params[key];
    }
  });
  return removeParamsState;
}
