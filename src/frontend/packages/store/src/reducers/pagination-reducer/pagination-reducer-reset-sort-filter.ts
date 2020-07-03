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
  const pSection: PaginationEntityState = state[entityKey][pKey]
  // TODO: RC it would be nice to try to also reset page & page size... but we've lost the latter
  const res: PaginationEntityState = {
    ...pSection,
    clientPagination: {
      ...pSection.clientPagination,
      filter: {
        items: [],
        string: ''
      },
    },
    // maxedState:// TODO: RC test
    params: {
      ...pAction.initialParams
    },
  }
  return {
    ...state,
    [entityKey]: {
      ...state[entityKey],
      [pKey]: res
    }
  };
}