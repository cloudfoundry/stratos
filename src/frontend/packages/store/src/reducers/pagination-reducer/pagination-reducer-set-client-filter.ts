import { SetClientFilter } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

export function paginationSetClientFilter(state: PaginationEntityState, action: SetClientFilter) {
  const clientPagination = spreadClientPagination(state.clientPagination);
  return {
    ...state,
    error: false,
    clientPagination: {
      ...clientPagination,
      filter: {
        ...clientPagination.filter,
        ...action.filter,
        items: {
          ...clientPagination.filter.items,
          ...action.filter.items
        }
      }
    }
  };
}
