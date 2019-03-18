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
  if (!state[action.entityKey] || !state[action.entityKey][action.paginationKey]) {
    return state;
  }
  const { ids, pageRequests, pageCount, currentPage, totalResults } = getDefaultPaginationEntityState();
  const newState = { ...state };
  const entityState = {
    ...newState[action.entityKey],
    [action.paginationKey]: {
      ...newState[action.entityKey][action.paginationKey],
      ids,
      pageRequests,
      pageCount,
      currentPage,
      totalResults,
    }
  } as PaginationEntityTypeState;
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}
