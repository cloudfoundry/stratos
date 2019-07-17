import { PaginatedAction, PaginationEntityState } from '../../../store/src/types/pagination.types';
import { selectPaginationState } from '../../../store/src/selectors/pagination.selectors';
import { Observable } from 'rxjs';
import { ValidateResultFetchingState } from './entity-relations.types';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { map } from 'rxjs/operators';
import { ActionState } from '../../../store/src/reducers/api-request-reducer/types';
import { getPaginationKey } from '../../../store/src/actions/pagination.actions';

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


export function isEntityInlineParentAction(anything: any): boolean {
  return anything && !!anything.includeRelations && anything.populateMissing !== undefined;
}

