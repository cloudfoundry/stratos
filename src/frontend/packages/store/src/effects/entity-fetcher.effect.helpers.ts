import { RequestInfoState } from '../reducers/api-request-reducer/types';

import { PaginationEntityState } from '../types/pagination.types';

export function isEntityBlocked(entityRequestInfo: RequestInfoState) {
  if (!entityRequestInfo) {
    return false;
  }
  return entityRequestInfo.fetching ||
    entityRequestInfo.error ||
    entityRequestInfo.deleting.busy ||
    entityRequestInfo.deleting.deleted
}

export function isPageReady(pagination: PaginationEntityState, isLocal = false) {
  if (!pagination) {
    return false;
  }
  if (isLocal) {
    return !Object.values(pagination.pageRequests).find((paginationPage) => paginationPage.busy);
  }
  if (!pagination.pageRequests[pagination.currentPage]) {
    return false;
  }
  return !pagination.pageRequests[pagination.currentPage].busy || false;
}