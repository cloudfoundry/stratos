import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { RouteEvents, UnmapRoute } from '../../actions/route.actions';
import { CFAppState } from '../../cf-app-state';
import { ClearPaginationOfEntity } from '../../../../store/src/actions/pagination.actions';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';

// CF effects retention (wave-3 CF-effects audit, 2026-05-12):
// Retained — UNMAP_ROUTE_SUCCESS is auto-emitted by the request
// pipeline when UnmapRoute completes, and UnmapRoute is dispatched
// live via cfEntityCatalog.route.api.unmap from
// cf-routes-list-config-base.ts:149. Effect performs the
// post-success ClearPaginationOfEntity side-effect.
@Injectable({
  providedIn: 'root'
})
export class RouteEffect {
  private actions$ = inject(Actions);
  private store = inject<Store<CFAppState>>(Store);
  private appRef = inject(ApplicationRef);



  unmapEffect$ = createEffect(() => this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(RouteEvents.UNMAP_ROUTE_SUCCESS),
    map((action: APISuccessOrFailedAction) => {
      const unmapAction: UnmapRoute = action.apiAction as UnmapRoute;
      if (unmapAction.clearPaginationKey) {
        // Remove the route from the specified pagination list
        this.store.dispatch(new ClearPaginationOfEntity(action.apiAction, action.apiAction.guid, unmapAction.clearPaginationKey));
      }
      this.appRef.tick();
    })
  ), { dispatch: false });
}
