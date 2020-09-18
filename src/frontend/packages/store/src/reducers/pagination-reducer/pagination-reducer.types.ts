import { Observable } from 'rxjs'; import { PaginationEntityState } from '../../types/pagination.types';
import { ListActionState } from '../api-request-reducer/types';


export const resultPerPageParam = 'results-per-page';
export const resultPerPageParamDefault = 5;

export interface PaginationObservables<T> {
  pagination$: Observable<PaginationEntityState>;
  entities$: Observable<T[]>;
  /**
   * Convenience observable on !!entities
   */
  hasEntities$: Observable<boolean>;
  /**
   * Convenience observable on pagination totalResults (note - not entities.length. In maxed world this can be different)
   */
  totalEntities$: Observable<number>;
  /**
   * Equate to current page fetching observable
   */
  fetchingEntities$: Observable<boolean>;
}

export function getCurrentPageRequestInfo(pagination: PaginationEntityState, valueIfMissing = {
  busy: false,
  error: false,
  message: ''
}): ListActionState {
  if (
    !pagination ||
    !pagination.pageRequests ||
    !pagination.pageRequests[pagination.currentPage]
  ) {
    return valueIfMissing;
  } else {
    return pagination.pageRequests[pagination.currentPage];
  }
}