import { RequestTypes } from '../actions/request.actions';
import { createPaginationReducer } from './pagination-reducer/pagination.reducer';

export function generateRequestPaginationReducer() {
  const reducer = createPaginationReducer([
    RequestTypes.START,
    RequestTypes.SUCCESS,
    RequestTypes.FAILED
  ]);
  return reducer;
}
