import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  createCfFeatureFlagFetchAction,
} from '../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-data-source.helpers';
import { CONNECT_ENDPOINTS_SUCCESS, EndpointActionComplete } from '../actions/endpoint.actions';
import {
  GET_CURRENT_USER_RELATION,
  GET_CURRENT_USER_RELATIONS,
  GetCurrentUserRelationsComplete,
  GetCurrentUsersRelations,
  GetUserRelations,
  UserRelationTypes,
} from '../actions/permissions.actions';
import { AppState } from '../app-state';
import { endpointsRegisteredCFEntitiesSelector } from '../selectors/endpoint.selectors';
import { APIResource } from '../types/api.types';
import { EndpointModel, INewlyConnectedEndpointInfo } from '../types/endpoint.types';
import { APISuccessOrFailedAction } from '../types/request.types';
import { Observable } from 'rxjs/Observable';

interface IEndpointConnectionInfo {
  guid: string;
  userGuid: string;
}

function getRequestFromAction(action: GetUserRelations, httpClient: HttpClient) {
  return httpClient.get<{ [guid: string]: { resources: APIResource[] } }>(
    `pp/v1/proxy/v2/users/${action.guid}/${action.relationType}`, {
      headers: {
        'x-cap-cnsi-list': action.endpointGuid
      }
    }
  ).pipe(
    map(data => {
      return new GetCurrentUserRelationsComplete(action.relationType, action.endpointGuid, data[action.endpointGuid].resources);
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
      const noneAdminEndpoints = endpointsArray.filter(endpoint => !endpoint.user.admin);
      // Dispatch feature flags fetch actions
      noneAdminEndpoints.forEach(endpoint => this.store.dispatch(createCfFeatureFlagFetchAction(endpoint.guid)));
      const allActions = [
        { type: 'all-complete' }
      ];
      if (!noneAdminEndpoints.length) {
        return allActions;
      }
      const connectionInfo = noneAdminEndpoints.map(endpoint => ({
        guid: endpoint.guid,
        userGuid: endpoint.user.guid
      }));
      return combineLatest(this.getRequests(connectionInfo)).pipe(
        mergeMap(actions => {
          actions.push({ type: 'all-complete' });
          return [
            ...actions,
            ...allActions
          ];
        })
      );
    }));

  @Effect() getPermissionForNewlyConnectedEndpoint$ = this.actions$.ofType<EndpointActionComplete>(CONNECT_ENDPOINTS_SUCCESS).pipe(
    switchMap(action => {
      const endpoint = action.endpoint as INewlyConnectedEndpointInfo;
      if (endpoint.user.admin || action.endpointType !== 'cf') {
        return [];
      }
      return combineLatest(this.getRequests([{
        guid: action.guid,
        userGuid: endpoint.user.guid
      }])).pipe(
        mergeMap(actions => actions)
      );
    })
  );

  getRequests(endpoints: IEndpointConnectionInfo[]): Observable<Action>[] {
    return [].concat(...endpoints.map(endpoint => {
      return Object.values(UserRelationTypes).map((type: UserRelationTypes) => {
        return getRequestFromAction(new GetUserRelations(endpoint.userGuid, type, endpoint.guid), this.httpClient);
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
