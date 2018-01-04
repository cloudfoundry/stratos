import { SetPage } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetClientPageSize(state: PaginationEntityState, action: SetPage) {
  return {
    ...state,
    error: false,
    clientPageSize: action.pageNumber
  };
}
