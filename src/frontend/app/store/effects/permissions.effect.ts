import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { AppState, IRequestEntityTypeState } from '../app-state';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { catchError, map, switchMap, withLatestFrom, tap, mergeMap } from 'rxjs/operators';
import { APIResource } from '../types/api.types';
import { Observable } from 'rxjs/Observable';
import { endpointsRegisteredCFEntitiesSelector } from '../selectors/endpoint.selectors';
import { EndpointModel } from '../types/endpoint.types';
import { Action } from '@ngrx/store';
import { permissionTypes, RawPermissionData, EndpointRawPermissionData, PermissionRelationType, userOrgRelationsTypes, userSpaceRelationsTypes, EndpointRoleState } from '../types/permissions.types';
import { GetCurrentUsersRelations, UserRelationTypes, GetUserRelations, GET_CURRENT_USER_RELATIONS, GET_CURRENT_USER_RELATION, GetUserRelationsComplete } from '../actions/permissions.actions';

function getRequestFromAction(action: GetUserRelations, httpClient: HttpClient) {
  return httpClient.get<{ [guid: string]: { resources: APIResource[] } }>(
    `pp/v1/proxy/v2/users/${action.guid}/${action.relationType}`, {
      headers: {
        'x-cap-cnsi-list': action.endpointGuid
      }
    }
  ).pipe(
    map(data => {
      return new GetUserRelationsComplete(action.guid, action.relationType, action.endpointGuid, data[action.endpointGuid].resources);
    })
  );
}

@Injectable()
export class PermissionsEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.ofType<GetCurrentUsersRelations>(GET_CURRENT_USER_RELATIONS).pipe(
    withLatestFrom(
      this.store.select(endpointsRegisteredCFEntitiesSelector)
    ),
    switchMap(([action, endpoints]) => {
      const endpointsArray = Object.values(endpoints);
      return combineLatest(this.getRequests(endpointsArray)).pipe(
        mergeMap(actions => {
          actions.push({ type: 'all-complete' });
          return actions;
        })
      );
    }));

  getRequests(endpoints: EndpointModel[]) {
    return [].concat(...endpoints.map(endpoint => {
      return Object.values(UserRelationTypes).map(type => {
        return getRequestFromAction(new GetUserRelations(endpoint.user.guid, type, endpoint.guid), this.httpClient);
      });
    }));
  }
}
@Injectable()
export class PermissionEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.ofType<GetUserRelations>(GET_CURRENT_USER_RELATION).pipe(
    mergeMap(action => {
      return getRequestFromAction(action, this.httpClient).pipe(
        map(() => ({ type: action.actions[1] }))
      );
    })
  );
}
