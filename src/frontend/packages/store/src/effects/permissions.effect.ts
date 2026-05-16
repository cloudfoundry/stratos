import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import {
  GET_CURRENT_USER_RELATIONS,
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
  GetCurrentUsersRelations,
} from '../actions/permissions.actions';
import { AppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { EndpointsDataService } from '../services/endpoints-data.service';

const successAction: Action = { type: GET_CURRENT_USER_RELATIONS_SUCCESS };
const failedAction: Action = { type: GET_CURRENT_USER_RELATIONS_FAILED };


@Injectable()
export class PermissionsEffects {
  private httpClient = inject(HttpClient);
  private actions$ = inject(Actions);
  private store = inject<Store<AppState>>(Store);
  private endpointsService = inject(EndpointsDataService);


   getCurrentUsersPermissions$ = createEffect(() => this.actions$.pipe(
    ofType<GetCurrentUsersRelations>(GET_CURRENT_USER_RELATIONS),
    switchMap(_action => {
      const allRequestsCompleted = entityCatalog.getAllBaseEndpointTypes().reduce((res, endpointType) => {
        if (endpointType.definition.userRolesFetch) {
          res.push(endpointType.definition.userRolesFetch([], this.store, this.httpClient, this.endpointsService));
        }
        return res;
      }, []);
      return combineLatest(allRequestsCompleted).pipe(
        switchMap(succeeds => succeeds.every(succeeded => !!succeeded) ? [successAction] : [failedAction])
      );
    }),
    catchError(err => {
      console.warn('Failed to fetch current user permissions: ', err);
      return of(failedAction);
    })
  ));
}
