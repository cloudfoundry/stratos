import { SetClientFilterKey } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

export function paginationSetClientFilterKey(state: PaginationEntityState, action: SetClientFilterKey) {
  const clientPagination = spreadClientPagination(state.clientPagination);

  return {
    ...state,
    error: false,
    clientPagination: {
      ...clientPagination,
      filter: {
        ...clientPagination.filter,
        filterKey: action.filterKey,
      }
    }
  };
}
