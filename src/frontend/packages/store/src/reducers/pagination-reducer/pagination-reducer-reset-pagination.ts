import { ResetPagination } from '../../actions/pagination.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { PaginationEntityState, PaginationEntityTypeState, PaginationState } from '../../types/pagination.types';

export const defaultClientPaginationPageSizeCards = 6;
export const defaultClientPaginationPageSizeTable = 10;
export const defaultClientPaginationPageSize = defaultClientPaginationPageSizeCards;

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
  },
  maxedState: {
    isMaxedMode: false
  },
  isListPagination: false
};

export function getDefaultPaginationEntityState(ignoreMaxed?: boolean): PaginationEntityState {
  return {
    ...defaultPaginationEntityState,
    maxedState: {
      ...defaultPaginationEntityState.maxedState,
      ignoreMaxed
    }
  };
}


export function paginationResetPagination(state: PaginationState, action: ResetPagination, allTypes = false): PaginationState {
  const entityKey = entityCatalog.getEntityKey(action.entityConfig);

  if (!state[entityKey]) {
    return state;
  }

  const entityState = allTypes ?
    paginationResetAllPaginationSections(state, entityKey) :
    paginationResetPaginationSection(state, action.paginationKey, entityKey);

  if (!entityState) {
    return state;
  }

  const newState = { ...state };
  return {
    ...newState,
    [entityKey]: entityState
  };
}

/**
 * Reset all pagination sections of an entity type
 */
function paginationResetAllPaginationSections(state: PaginationState, entityKey: string): PaginationEntityTypeState {
  return Object.entries(state[entityKey]).reduce((res, [paginationKey, paginationSection]) => {
    res[paginationKey] = paginationResetPaginationState(paginationSection);
    return res;
  }, {} as PaginationEntityTypeState);
}

/**
 * Reset a single pagination section of an entity type
 */
function paginationResetPaginationSection(state: PaginationState, paginationKey: string, entityKey: string): PaginationEntityTypeState {

  const paginationSection = state[entityKey][paginationKey];
  if (!paginationSection) {
    return;
  }

  const entityState: PaginationEntityTypeState = {
    ...state[entityKey],
    [paginationKey]: paginationResetPaginationState(paginationSection)
  };
  return entityState;
}

/**
 * Reset a pagination section (retain initial/user sort/filter/etc)
 */
function paginationResetPaginationState(oldEntityState: PaginationEntityState) {
  const { ids, pageRequests, pageCount, currentPage, totalResults } = getDefaultPaginationEntityState();
  const entityState: PaginationEntityState = {
    ...oldEntityState,
    ids,
    pageRequests,
    pageCount,
    currentPage,
    totalResults,
  };
  return entityState;
}

// Wave 4 part 1 (W36-B): legacy `resetEndpointEntities` deleted. The
// equivalent generic walk now lives in
// `EndpointDisconnectCleanupService.runGenericCleanup`, driven by
// `EndpointsDataService.disconnectedSignal`. The new path dispatches
// `ResetPaginationOfType` per affected entity, which routes through this
// file's existing `paginationResetPagination(..., allTypes=true)` path.
