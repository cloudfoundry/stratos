import { EntityCatalogueHelpers } from '../../../../core/src/core/entity-catalogue/entity-catalogue.helper';
import { ResetPagination } from '../../actions/pagination.actions';
import { PaginationEntityState, PaginationEntityTypeState, PaginationState } from '../../types/pagination.types';

export const defaultClientPaginationPageSize = 9;

const defaultPaginationEntityState: PaginationEntityState = {
  pageCount: 0,
  currentPage: 1,
  totalResults: 0,
  ids: {},
  pageRequests: {
  },
  params: {
  },
  clientPagination: {
    pageSize: defaultClientPaginationPageSize,
    currentPage: 1,
    filter: {
      string: '',
      items: {}
    },
    totalResults: 0
  }
};

export function getDefaultPaginationEntityState(): PaginationEntityState {
  return {
    ...defaultPaginationEntityState
  };
}

export function paginationResetPagination(state: PaginationState, action: ResetPagination): PaginationState {
  const entityKey = EntityCatalogueHelpers.buildEntityKey(action.entityConfig.entityType, action.entityConfig.endpointType);
  if (!state[entityKey] || !state[entityKey][action.paginationKey]) {
    return state;
  }
  const { ids, pageRequests, pageCount, currentPage, totalResults } = getDefaultPaginationEntityState();
  const newState = { ...state };
  const entityState = {
    ...newState[entityKey],
    [action.paginationKey]: {
      ...newState[entityKey][action.paginationKey],
      ids,
      pageRequests,
      pageCount,
      currentPage,
      totalResults,
    }
  } as PaginationEntityTypeState;
  return {
    ...newState,
    [entityKey]: entityState
  };
}
