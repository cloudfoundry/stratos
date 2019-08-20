import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { ActionState } from '../../../store/src/reducers/api-request-reducer/types';
import { selectPaginationState } from '../../../store/src/selectors/pagination.selectors';
import { PaginatedAction, PaginationEntityState } from '../../../store/src/types/pagination.types';
import { EntityInlineParentAction, ValidateResultFetchingState } from './entity-relations.types';

export function createValidationPaginationWatcher(store, paramPaginationAction: PaginatedAction):
  Observable<ValidateResultFetchingState> {
  return store.select(selectPaginationState(entityCatalogue.getEntityKey(paramPaginationAction), paramPaginationAction.paginationKey)).pipe(
    map((paginationState: PaginationEntityState) => {
      const pageRequest: ActionState =
        paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
      return { fetching: pageRequest ? pageRequest.busy : true };
    })
  );
}


export function isEntityInlineParentAction(anything: any): EntityInlineParentAction {
  return anything && !!anything.includeRelations && anything.populateMissing !== undefined ? anything as EntityInlineParentAction : null;
}

