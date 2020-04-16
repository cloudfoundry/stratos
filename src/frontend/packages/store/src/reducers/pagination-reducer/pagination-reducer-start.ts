import { EntityCatalogEntityConfig } from '../../entity-catalog/entity-catalog.types';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationStart(state: PaginationEntityState, action): PaginationEntityState {
  const page = action.apiAction.__forcedPageNumber__ || action.apiAction.pageNumber || state.currentPage;
  const entityConfig = action.apiAction.__forcedPageEntityConfig__ as EntityCatalogEntityConfig;

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
          schemaKey: action.apiAction.schemaKey
        },
        entityConfig: entityConfig ? {
          entityType: entityConfig.entityType,
          endpointType: entityConfig.endpointType,
          schemaKey: entityConfig.schemaKey
        } : null,
        maxed: false
      }
    }
  };
}
