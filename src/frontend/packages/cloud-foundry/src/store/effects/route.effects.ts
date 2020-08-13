import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { RouteEvents, UnmapRoute } from '../../actions/route.actions';
import { CFAppState } from '../../cf-app-state';
import { ClearPaginationOfEntity } from '../../../../store/src/actions/pagination.actions';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';

@Injectable()
export class RouteEffect {

  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>
  ) { }

  @Effect({ dispatch: false })
  unmapEffect$ = this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(RouteEvents.UNMAP_ROUTE_SUCCESS),
    map((action: APISuccessOrFailedAction) => {
      const unmapAction: UnmapRoute = action.apiAction as UnmapRoute;
      if (unmapAction.clearPaginationKey) {
        // Remove the route from the specified pagination list
        this.store.dispatch(new ClearPaginationOfEntity(action.apiAction, action.apiAction.guid, unmapAction.clearPaginationKey));
      }
    })
  );
}
