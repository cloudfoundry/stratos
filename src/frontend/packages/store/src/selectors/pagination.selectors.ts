import { AppState } from '../app-state';
import { PaginationEntityTypeState, PaginationState } from '../types/pagination.types';
import { compose } from '@ngrx/store';
export function selectPaginationState(entityKey: string, paginationKey: string) {
  return compose(
    getPaginationKeyState(paginationKey),
    getPaginationEntityState(entityKey),
    getPaginationState
  );
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

export function getPaginationState(state: AppState) {
  return state.pagination;
}

