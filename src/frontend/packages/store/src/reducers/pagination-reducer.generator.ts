import type { Action } from '@ngrx/store';

import { RequestTypes } from '../actions/request.actions';
import type { PaginationState } from '../types/pagination.types';
import { createPaginationReducer } from './pagination-reducer/pagination.reducer';

const reducer = createPaginationReducer([
  RequestTypes.START,
  RequestTypes.SUCCESS,
  RequestTypes.FAILED
]);

export function requestPaginationReducer(state: PaginationState, action: Action): PaginationState {
  return reducer(state, action);
}
