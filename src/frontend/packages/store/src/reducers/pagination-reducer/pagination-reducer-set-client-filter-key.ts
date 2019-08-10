import { PaginationEntityState } from '../../types/pagination.types';
import { SetClientFilterKey } from '../../actions/pagination.actions';
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
                items: {
                    ...clientPagination.filter.items,
                },
                filterKey: action.filterKey,
            }
        }
    };
}
