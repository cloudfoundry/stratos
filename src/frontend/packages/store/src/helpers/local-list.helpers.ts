import { entityCatalog } from '../entity-catalog/entity-catalog';
import { PaginationEntityState } from '../types/pagination.types';

export class LocalPaginationHelpers {

  /**
   * Looks in all the places necessary to see if the current pagination section is maxed.
   */
  static isPaginationMaxed(pagination: PaginationEntityState) {
    if (!pagination) {
      console.warn('LocalPaginationHelpers.isPaginationMaxed - pagination is undefined or null');
      return false;
    }
    if (pagination.forcedLocalPage) {
      const forcedPage = pagination.pageRequests?.[pagination.forcedLocalPage];
      // SI Wall, 2 CFs, Select SI only, Filter to Org, Switch CFs, pagination has been reset so no page
      return forcedPage && forcedPage.maxed;
    }
    if (!pagination.pageRequests) {
      return false;
    }
    return !!Object.values(pagination.pageRequests).find(request => request.maxed);
  }

  /**
   * Gets a local page request section relating to a particular schema key.
   */
  static getEntityPageRequest(pagination: PaginationEntityState, entityKey: string) {
    const { pageRequests } = pagination;
    const pageNumber = (pageRequests && Object.keys(pageRequests).find(key => {
      const baseEntityKey = entityCatalog.getEntityKey(pageRequests[key]?.baseEntityConfig);
      return baseEntityKey === entityKey;
    })) || null;
    if (pageNumber) {
      return {
        pageNumber,
        pageRequest: pageRequests[pageNumber]
      };
    }
    return null;
  }
}
