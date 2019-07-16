import { compose } from '@ngrx/store';

import { AppState } from '../app-state';
import { PaginationEntityTypeState } from '../types/pagination.types';
import { PaginationEntityState, PaginationState } from '../types/pagination.types';

export function isIdInPagination(entityId: string, entityKey: string, paginationKey: string) {
  return compose(
    checkPagesForId(entityId),
    selectPaginationState(entityKey, paginationKey)
  );
}

export function selectPaginationState(entityKey: string, paginationKey: string) {
  const state = compose(
    getPaginationKeyState(paginationKey),
    getPaginationEntityState(entityKey),
    getPaginationState
  );
  return state;
}

export function checkPagesForId(entityId: string) {
  return (paginationState: PaginationEntityState) => {
    if (!paginationState) {
      return false;
    }
    return !!Object.keys(paginationState.ids).reduce((flatPages, pageId) => {
      const page = paginationState.ids[pageId];
      if (page && Array.isArray(page)) {
        return [
          ...flatPages,
          ...paginationState.ids[pageId]
        ];
      }
      return flatPages;
    }, [])
      .find((id => id === entityId));
  };
}

export function getPaginationKeyState(paginationKey: string) {
  return (state: PaginationEntityTypeState) => {
    return state[paginationKey];
  };
}

export function getPaginationEntityState(entityKey: string) {
  return (state: PaginationState) => {
    return state[entityKey] || {};
  };
}

export function getPaginationState<T extends AppState>(state: T) {
  return state.pagination;
}

