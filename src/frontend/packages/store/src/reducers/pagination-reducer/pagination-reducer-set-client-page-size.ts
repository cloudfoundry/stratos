import { SetClientPageSize } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

export function paginationSetClientPageSize(state: PaginationEntityState, action: SetClientPageSize) {
  return {
    ...state,
    error: false,
    clientPagination: {
      ...spreadClientPagination(state.clientPagination),
      pageSize: action.pageSize
    }
  };
}
