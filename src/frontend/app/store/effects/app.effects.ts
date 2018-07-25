import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { GetAppSummaryAction } from '../actions/app-metadata.actions';
import { ASSIGN_ROUTE, AssociateRouteWithAppApplication, ASSIGN_ROUTE_SUCCESS } from '../actions/application-service-routes.actions';
import { AppState } from '../app-state';
import { APISuccessOrFailedAction } from '../types/request.types';


@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect({ dispatch: false }) upateSummary$ = this.actions$.ofType<APISuccessOrFailedAction>(ASSIGN_ROUTE_SUCCESS).pipe(
    map(action => {
        this.store.dispatch(new GetAppSummaryAction(action.apiAction.guid, action.apiAction.endpointGuid));
    }),

  );
}
