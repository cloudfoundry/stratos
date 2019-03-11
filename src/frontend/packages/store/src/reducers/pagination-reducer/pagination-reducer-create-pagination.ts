import { CreatePagination } from '../../actions/pagination.actions';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

/**
 * Creates new pagination from default values or a seed pagination section.
 * If the pagination exists and a seed pagination key is provided, sync the current pagination section and the seed.
 * If the pagination exists and no seed is given then do nothing.
 * @param state
 * @param action
 * @param defaultState The default state to create the pagination section with.
 */
export function createNewPaginationSection(state: PaginationState, action: CreatePagination, defaultState: PaginationEntityState)
  : PaginationState {
  if (state[action.entityKey][action.paginationKey] && !action.seed) {
    return state;
  }
  if (!state[action.entityKey][action.paginationKey] && !action.seed) {
    return createNew(state, action, defaultState);
  }
  return mergeWithSeed(state, action, defaultState);
}

function createNew(state: PaginationState, action: CreatePagination, defaultState: PaginationEntityState): PaginationState {
  return {
    ...state,
    [action.entityKey]: {
      ...state[action.entityKey],
      [action.paginationKey]: defaultState
    }
  };
}

function mergeWithSeed(state: PaginationState, action: CreatePagination, defaultState: PaginationEntityState): PaginationState {
  const newState = { ...state };
  const currentPagination = state[action.entityKey][action.paginationKey] || defaultState;
  const seeded = action.seed && state[action.entityKey] && state[action.entityKey][action.seed];
  const seedPagination = seeded ? state[action.entityKey][action.seed] : defaultState;
  const entityState = {
    ...newState[action.entityKey],
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
    [action.entityKey]: entityState
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
  const seededTotalResults = seedPagination.clientPagination.totalResults;
  const totalResults = currentPagination.clientPagination.totalResults;
  if (hasResultCountChanged(currentPagination, seedPagination)) {
    return 1;
  } else {
    return currentPage;
  }
}
