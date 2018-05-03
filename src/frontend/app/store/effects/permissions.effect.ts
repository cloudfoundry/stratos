import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { GET_CURRENT_USER_PERMISSIONS, GetCurrentUsersPermissions } from '../actions/permissions.actions';
import { AppState, IRequestEntityTypeState } from '../app-state';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { catchError, map, switchMap, withLatestFrom, tap } from 'rxjs/operators';
import { APIResource } from '../types/api.types';
import { Observable } from 'rxjs/Observable';
import { endpointsRegisteredCFEntitiesSelector } from '../selectors/endpoint.selectors';
import { EndpointModel } from '../types/endpoint.types';
import { permissionTypes, RawPermissionData, EndpointRawPermissionData, PermissionRelationType, userOrgRelationsTypes, userSpaceRelationsTypes, EndpointRoleState } from '../types/permissions.types';



@Injectable()
export class PermissionEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect({ dispatch: false }) getCurrentUsersPermissions$ = this.actions$.ofType<GetCurrentUsersPermissions>(GET_CURRENT_USER_PERMISSIONS).pipe(
    withLatestFrom(
      this.store.select(endpointsRegisteredCFEntitiesSelector)
    ),
    switchMap(([action, endpoints]) => {
      const endpointsArray = Object.values(endpoints);
      const adminEndpoints = endpointsArray.filter(endpoint => endpoint.user.admin);
      const noneAdminEndpoints = endpointsArray.filter(endpoint => !endpoint.user.admin);
      const adminRequests = adminEndpoints.map(endpoint => Observable.of(new EndpointRawPermissionData(endpoint.guid, [], true)));
      const requests = this.getRequests(noneAdminEndpoints, );
      return combineLatest(
        [...requests, ...adminRequests]
      ).pipe(
        tap((permissions: EndpointRawPermissionData[]) => {
          console.log(new EndpointRoleState(permissions[0]));
        })
      );
    })
  );

  getRequests(endpoints: EndpointModel[]) {
    return [].concat(...endpoints.map(endpoint => this.getEndpointRequest(endpoint)));
  }

  getEndpointRequest(endpoint: EndpointModel) {
    const orgRequests = this.getRequestsByType(endpoint, userOrgRelationsTypes, PermissionRelationType.ORG);
    const spaceRequests = this.getRequestsByType(endpoint, userSpaceRelationsTypes, PermissionRelationType.SPACE);
    return combineLatest([...orgRequests, ...spaceRequests]).pipe(
      map((data: RawPermissionData[]) => new EndpointRawPermissionData(endpoint.guid, data))
    );
  }

  getRequestsByType(endpoint: EndpointModel, permissionTypes: string[], relationType: PermissionRelationType) {
    return permissionTypes.map(permissionType => this.httpClient.get<{ [guid: string]: { resources: APIResource[] } }>(
      `pp/v1/proxy/v2/users/${endpoint.user.guid}/${permissionType}`, {
        headers: {
          'x-cap-cnsi-list': endpoint.guid
        }
      }
    ).pipe(
      map(data => new RawPermissionData(data[endpoint.guid].resources, permissionType, relationType))
    ));
  }

}
