import { PaginationEntityState } from '../../../../store/types/pagination.types';

export class LocalPaginationHelpers {

  /**
   * Looks in all the places necessary to see if the current pagination section is maxed.
   *
   * @static
   * @param {PaginationEntityState} pagination
   * @returns
   * @memberof LocalPaginationHelpers
   */
  static isPaginationMaxed(pagination: PaginationEntityState) {
    if (pagination.forcedLocalPage) {
      return !!pagination.pageRequests[pagination.forcedLocalPage].maxed;
    }
    return pagination.currentlyMaxed || !!Object.values(pagination.pageRequests).find(request => request.maxed);
  }

  /**
   * Gets a local page request section relating to a particular schema key.
   *
   * @static
   * @param {PaginationEntityState} pagination
   * @param {string} schemaKey
   * @memberof LocalPaginationHelpers
   */
  static getSchemaPageRequest(pagination: PaginationEntityState, schemaKey: string) {
    const { pageRequests } = pagination;
    const pageNumber = Object.keys(pagination.pageRequests).find(key => pageRequests[key].schemaKey === schemaKey) || null;
    if (pageNumber) {
      return {
        pageNumber,
        pageRequest: pageRequests[pageNumber]
      };
    }
    return null;
  }
}
