import { PaginationEntityState } from '../../types/pagination.types';
export function paginationFailure(state: PaginationEntityState, action) {
  return {
    ...state,
    fetching: false,
    error: true,
    message: action.message
  };
}
