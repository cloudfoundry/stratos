import { CreatePagination } from '../../actions/pagination.actions';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';

/**
 * Creates new pagination from default values or a seed pagination section.
 * If the pagination exists and a seed pagination key is provided, sync the current pagination section and the seed.
 * If the pagination exists and no seed is given then do nothing.
 * @param state
 * @param action
 * @param defaultState The default state to create the pagination section with.
 */
export function createNewPaginationSection(state: PaginationState, action: CreatePagination, defaultState: PaginationEntityState) {
  if (state[action.entityKey][action.paginationKey] && !action.seed) {
    return state;
  }
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
      clientPagination: mergePaginationSections(currentPagination, seedPagination),
      seed: seeded ? action.seed : null
    }
  };
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}

function mergePaginationSections(currentPagination: PaginationEntityState, seedPagination: PaginationEntityState) {
  const currentClientPagination = currentPagination.clientPagination;
  const seedClientPagination = seedPagination.clientPagination;
  return {
    ...currentClientPagination,
    totalResults: seedClientPagination.totalResults,
    currentPage: getCurrentPage(currentPagination, seedPagination)
  };
}

function getCurrentPage(currentPagination: PaginationEntityState, seedPagination: PaginationEntityState) {
  const currentPage = currentPagination.clientPagination.currentPage;
  const seededTotalResults = seedPagination.clientPagination.totalResults;
  const totalResults = currentPagination.clientPagination.totalResults;
  if (seededTotalResults !== totalResults) {
    return 1;
  } else {
    return currentPage;
  }
}
