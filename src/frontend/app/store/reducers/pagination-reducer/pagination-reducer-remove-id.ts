import { PaginationRemoveIdAction } from '../../actions/pagination.actions';
import { PaginationState } from '../../types/pagination.types';

export function paginationRemoveId(state: PaginationState, action: PaginationRemoveIdAction): PaginationState {
  if (state[action.entityKey] && state[action.entityKey][action.paginationKey]) {
    const pagination = state[action.entityKey][action.paginationKey];
    const oldIds = pagination.ids;
    const ids = Object.keys(pagination.ids).reduce((newPages, pageIndex) => {
      newPages[pageIndex] = oldIds[pageIndex].filter(guid => guid !== action.guid);
      return newPages;
    }, {});
    return {
      ...state,
      [action.entityKey]: {
        ...state[action.entityKey],
        [action.paginationKey]: {
          ...pagination,
          ids
        }
      }
    };
  }
  return state;
}
