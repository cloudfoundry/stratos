import { entityFactory } from '../../helpers/entity-factory';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationStart(state, action): PaginationEntityState {
  const page = action.apiAction.__forcedPageNumber__ || action.apiAction.pageNumber || state.currentPage;
  const schemaKey = action.apiAction.__forcedPageSchemaKey__;
  const entityKey = schemaKey ? entityFactory(schemaKey).key : action.apiAction.entityKey;
  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        busy: true,
        error: false,
        message: '',
        schemaKey,
        entityKey,
        maxed: false
      }
    }
  };
}
