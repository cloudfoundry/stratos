import { PaginationEntityState } from '../../types/pagination.types';
import { EntityCatalogueEntityConfig } from '../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';

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
        entityConfig,
        maxed: false
      }
    }
  };
}
