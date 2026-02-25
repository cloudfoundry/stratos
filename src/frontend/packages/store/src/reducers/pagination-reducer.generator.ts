import { RequestTypes } from '../actions/request.actions';
import { createPaginationReducer } from './pagination-reducer/pagination.reducer';

const reducer = createPaginationReducer([
  RequestTypes.START,
  RequestTypes.SUCCESS,
  RequestTypes.FAILED
]);

export function requestPaginationReducer(state: any, action: any) {
  return reducer(state, action);
}
