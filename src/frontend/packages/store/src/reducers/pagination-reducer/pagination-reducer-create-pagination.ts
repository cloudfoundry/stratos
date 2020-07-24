import { CreatePagination } from '../../actions/pagination.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { EntityCatalogEntityConfig } from '../../entity-catalog/entity-catalog.types';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

function getPaginationKey(entityConfig: EntityCatalogEntityConfig) {
  return entityCatalog.getEntityKey(entityConfig);
}
/**
 * Creates new pagination from default values or a seed pagination section.
 * If the pagination exists and a seed pagination key is provided, sync the current pagination section and the seed.
 * If the pagination exists and no seed is given then do nothing.
 * @param defaultState The default state to create the pagination section with.
 */
export function createNewPaginationSection(state: PaginationState, action: CreatePagination, defaultState: PaginationEntityState)
  : PaginationState {
  const entityKey = getPaginationKey(action.entityConfig);
  if (state[entityKey][action.paginationKey] && !action.seed) {
    return state;
  }
  if (!state[entityKey][action.paginationKey] && !action.seed) {
    return createNew(state, action, defaultState);
  }
  return mergeWithSeed(state, action, defaultState);
}

function createNew(state: PaginationState, action: CreatePagination, defaultState: PaginationEntityState): PaginationState {
  const entityKey = getPaginationKey(action.entityConfig);
  return {
    ...state,
    [entityKey]: {
      ...state[entityKey],
      [action.paginationKey]: defaultState
    }
  };
}

function mergeWithSeed(state: PaginationState, action: CreatePagination, defaultState: PaginationEntityState): PaginationState {
  const entityKey = getPaginationKey(action.entityConfig);
  const newState = { ...state };
  const currentPagination = state[entityKey][action.paginationKey] || defaultState;
  const seeded = action.seed && state[entityKey] && state[entityKey][action.seed];
  const seedPagination = seeded ? state[entityKey][action.seed] : defaultState;
  const entityState = {
    ...newState[entityKey],
    [action.paginationKey]: {
      ...seedPagination,
      // If we already have a pagination section, retain these values.
      pageCount: currentPagination.pageCount,
      currentPage: currentPagination.currentPage,
      clientPagination: mergePaginationSections(currentPagination, seedPagination, defaultState),
      seed: seeded ? action.seed : null
    }
  };
  return {
    ...newState,
    [entityKey]: entityState
  };
}

function mergePaginationSections(
  currentPagination: PaginationEntityState,
  seedPagination: PaginationEntityState,
  defaultState: PaginationEntityState
) {
  const seedClientPagination = spreadClientPagination(seedPagination.clientPagination);
  return {
    ...currentPagination.clientPagination,
    totalResults: seedClientPagination.totalResults,
    currentPage: getCurrentPage(currentPagination, seedPagination)
  };
}

function hasResultCountChanged(currentPagination: PaginationEntityState, seedPagination: PaginationEntityState) {
  const seededTotalResults = seedPagination.clientPagination.totalResults;
  const totalResults = currentPagination.clientPagination.totalResults;
  return seededTotalResults !== totalResults;
}

function getCurrentPage(currentPagination: PaginationEntityState, seedPagination: PaginationEntityState) {
  const currentPage = currentPagination.clientPagination.currentPage;
  if (hasResultCountChanged(currentPagination, seedPagination)) {
    return 1;
  } else {
    return currentPage;
  }
}
