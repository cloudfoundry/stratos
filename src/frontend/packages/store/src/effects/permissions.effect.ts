import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { combineLatest, EMPTY, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { LoggerService } from '../../../core/src/core/logger.service';
import { CONNECT_ENDPOINTS_SUCCESS, EndpointActionComplete } from '../actions/endpoint.actions';
import {
  GET_CURRENT_USER_RELATIONS,
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
  GetCurrentUsersRelations,
} from '../actions/permissions.actions';
import { AppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { EntityUserRolesEndpoint } from '../entity-request-pipeline/entity-request-pipeline.types';

const successAction: Action = { type: GET_CURRENT_USER_RELATIONS_SUCCESS };
const failedAction: Action = { type: GET_CURRENT_USER_RELATIONS_FAILED };


@Injectable()
export class PermissionsEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
    private logService: LoggerService
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.pipe(
    ofType<GetCurrentUsersRelations>(GET_CURRENT_USER_RELATIONS),
    switchMap(action => {
      const allRequestsCompleted = entityCatalog.getAllBaseEndpointTypes().reduce((res, endpointType) => {
        if (endpointType.definition.userRolesFetch) {
          res.push(endpointType.definition.userRolesFetch([], this.store, this.logService, this.httpClient));
        }
        return res;
      }, []);
      return combineLatest(allRequestsCompleted).pipe(
        switchMap(succeeds => succeeds.every(succeeded => !!succeeded) ? [successAction] : [failedAction])
      );
    }),
    catchError(err => {
      this.logService.warn('Failed to fetch current user permissions: ', err);
      return of(failedAction);
    })
  );


  @Effect() getPermissionForNewlyConnectedEndpoint$ = this.actions$.pipe(
    ofType<EndpointActionComplete>(CONNECT_ENDPOINTS_SUCCESS),
    switchMap(action => {
      const endpointType = entityCatalog.getEndpoint(action.endpointType)
      if (!endpointType.definition.userRolesFetch) {
        return EMPTY;
      }
      const endpoint: EntityUserRolesEndpoint = {
        guid: action.guid,
        user: action.endpoint.user
      }
      return endpointType.definition.userRolesFetch([endpoint], this.store, this.logService, this.httpClient).pipe(
        map(succeeded => succeeded ? successAction : failedAction)
      );
    }),
    catchError(err => {
      this.logService.warn('Failed to fetch current user permissions after endpoint connected: ', err);
      return of(failedAction);
    })
  );
}
