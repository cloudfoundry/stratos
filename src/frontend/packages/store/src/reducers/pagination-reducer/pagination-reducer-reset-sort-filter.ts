import { ResetPaginationSortFilter } from '../../actions/pagination.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';

export function paginationResetToStart(state: PaginationState, action: ResetPaginationSortFilter): PaginationState {
  const { pAction } = action;
  const entityKey = entityCatalog.getEntityKey(pAction);
  const pKey = action.pAction.paginationKey;

  if (!state[entityKey] || !state[entityKey][pKey]) {
    return state;
  }
  const pSection: PaginationEntityState = state[entityKey][pKey];
  const res: PaginationEntityState = {
    ...pSection,
    clientPagination: {
      ...pSection.clientPagination,
      filter: {
        items: [],
        string: ''
      },
    },
    params: {
      ...pAction.initialParams
    },
  };
  return {
    ...state,
    [entityKey]: {
      ...state[entityKey],
      [pKey]: res
    }
  };
}
