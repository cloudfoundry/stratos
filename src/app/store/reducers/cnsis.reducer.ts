import { GET_CNSIS, GET_CNSIS_FAILED, GET_CNSIS_SUCCESS } from './../actions/cnsis.actions';
import { CNSISState } from '../types/cnsis.types';

export function cnsisReducer(state: CNSISState = {
  entities: [],
  loading: false,
  error: false,
  message: ''
}, action): CNSISState {
  switch (action.type) {
    case GET_CNSIS:
      return { ...state, loading: true, message: '', error: false };
    case GET_CNSIS_SUCCESS:
      return { ...state, loading: false, message: '', error: false, entities: action.payload };
    case GET_CNSIS_FAILED:
      return { ...state, loading: false, message: action.message || 'Failed to get cnsis', error: true };
    default:
      return state;
  }
}
