import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { CNSISModel } from '../types/cnsis.types';
import { GetSystemSuccess, GET_SYSTEM_INFO_SUCCESS } from './../actions/system.actions';
export function systemEndpointsReducer(state: IRequestEntityTypeState<CNSISModel>, action: GetSystemSuccess) {
  if (action.type === GET_SYSTEM_INFO_SUCCESS) {
    const newState = { ...state };
    Object.keys(action.payload.endpoints.cf).forEach(guid => {
      newState[guid] = {
        ...newState[guid],
        info: action.payload.endpoints.cf[guid]
      };
    });
    return newState;
  }
  return state;
}
