import { PaginationEntityState } from '../../types/pagination.types';
import { EntityCatalogueEntityConfig } from '../../../../core/src/core/entity-catalogue/entity-catalogue.types';

export function paginationStart(state, action): PaginationEntityState {
  const page = action.apiAction.__forcedPageNumber__ || action.apiAction.pageNumber || state.currentPage;
  const entityConfig = action.apiAction.__forcedPageEntityConfig__ as EntityCatalogueEntityConfig;

  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        busy: true,
        error: false,
        message: '',
        baseEntityConfig: {
          entityType: action.apiAction.entityType,
          endpointType: action.apiAction.endpointType,
        },
        entityConfig: entityConfig ? {
          entityType: entityConfig.entityType,
          endpointType: entityConfig.endpointType,
        } : null,
        maxed: false
      }
    }
  };
}
