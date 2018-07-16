import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { ResetPagination } from '../actions/pagination.actions';
import { RouteEvents, UnmapRoute } from '../actions/route.actions';
import { AppState } from '../app-state';
import { routeSchemaKey } from '../helpers/entity-factory';
import { APISuccessOrFailedAction } from '../types/request.types';

@Injectable()
export class RouteEffect {

  constructor(
    private actions$: Actions,
    private router: Router,
    private store: Store<AppState>
  ) { }

  @Effect({ dispatch: false })
  unmapEffect$ = this.actions$.ofType<APISuccessOrFailedAction>(RouteEvents.UNMAP_ROUTE_SUCCESS).pipe(
    map((action: APISuccessOrFailedAction) =>
    this.store.dispatch( new ResetPagination(routeSchemaKey, `application-${(action.apiAction as UnmapRoute).appGuid}`))
    )
 );
}
