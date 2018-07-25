import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, first, map, mergeMap, share, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { LoggerService } from '../../core/logger.service';
import {
  createCfFeatureFlagFetchAction,
} from '../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-data-source.helpers';
import { CONNECT_ENDPOINTS_SUCCESS, EndpointActionComplete } from '../actions/endpoint.actions';
import {
  GET_CURRENT_USER_CF_RELATIONS,
  GET_CURRENT_USER_CF_RELATIONS_FAILED,
  GET_CURRENT_USER_CF_RELATIONS_SUCCESS,
  GET_CURRENT_USER_RELATION,
  GET_CURRENT_USER_RELATIONS,
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
  GetCurrentUserRelationsComplete,
  GetCurrentUsersRelations,
  GetUserCfRelations,
  GetUserRelations,
  UserRelationTypes,
} from '../actions/permissions.actions';
import { AppState } from '../app-state';
import { BaseHttpClientFetcher, flattenPagination, IPaginationFlattener } from '../helpers/paginated-request-helpers';
import { createPaginationCompleteWatcher } from '../helpers/store-helpers';
import { endpointsRegisteredCFEntitiesSelector } from '../selectors/endpoint.selectors';
import { CFResponse } from '../types/api.types';
import { EndpointModel, INewlyConnectedEndpointInfo } from '../types/endpoint.types';

class PermissionFlattener extends BaseHttpClientFetcher implements IPaginationFlattener<CFResponse> {

  constructor(httpClient: HttpClient, public url, public requestOptions: { [key: string]: any }) {
    super(httpClient, requestOptions, url, 'page');
  }
  public getTotalPages = (res: CFResponse<any>) => {
    return res.total_pages;
  }
  public mergePages = (res: CFResponse[]) => {
    const firstRes = res.shift();
    const final = res.reduce((finalRes, currentRes) => {
      finalRes.resources = [
        ...finalRes.resources,
        ...currentRes.resources
      ];
      return finalRes;
    }, firstRes);
    return final;
  }
}

interface CfsRequestState {
  [cfGuid: string]: Observable<boolean>[];
}

interface IEndpointConnectionInfo {
  guid: string;
  userGuid: string;
}

const successAction: Action = { type: GET_CURRENT_USER_RELATIONS_SUCCESS };
const failedAction: Action = { type: GET_CURRENT_USER_RELATIONS_FAILED };

function fetchCfUserRole(store: Store<AppState>, action: GetUserRelations, httpClient: HttpClient): Observable<boolean> {
  const url = `pp/v1/proxy/v2/users/${action.guid}/${action.relationType}`;
  const params = {
    headers: {
      'x-cap-cnsi-list': action.endpointGuid,
      'x-cap-passthrough': 'true'
    },
    params: {
      'results-per-page': '100'
    }
  };
  const get$ = httpClient.get<CFResponse>(
    url,
    params
  );
  return flattenPagination(get$, new PermissionFlattener(httpClient, url, params)).pipe(
    map(data => {
      store.dispatch(new GetCurrentUserRelationsComplete(action.relationType, action.endpointGuid, data.resources));
      return true;
    }),
    first(),
    catchError(err => observableOf(false)),
    share()
  );
}

@Injectable()
export class PermissionsEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
    private logService: LoggerService
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.ofType<GetCurrentUsersRelations>(GET_CURRENT_USER_RELATIONS).pipe(
    withLatestFrom(
      this.store.select(endpointsRegisteredCFEntitiesSelector)
    ),
    switchMap(([action, endpoints]) => {
      const endpointsArray = Object.values(endpoints);
      const isAllAdmins = endpointsArray.every(endpoint => !!endpoint.user.admin);

      // If all endpoints are connected as admin, there's no permissions to fetch. So only update the permission state to initialised
      if (isAllAdmins) {
        return [
          successAction,
          ...endpointsArray.map(endpoint => new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS_SUCCESS))
        ];
      }

      // If some endpoints are not connected as admin, go out and fetch the current user's specific roles
      const flagsAndRoleRequests = this.dispatchRoleRequests(endpointsArray);
      const allRequestsCompleted = this.handleCfRequests(flagsAndRoleRequests);
      return combineLatest(allRequestsCompleted).pipe(
        switchMap(succeeds => succeeds.every(succeeded => !!succeeded) ? [successAction] : [failedAction])
      );
    }),
    catchError(err => {
      this.logService.warn('Failed to fetch current user permissions: ', err);
      return observableOf([failedAction]);
    })
  );


  @Effect() getPermissionForNewlyConnectedEndpoint$ = this.actions$.ofType<EndpointActionComplete>(CONNECT_ENDPOINTS_SUCCESS).pipe(
    switchMap(action => {
      const endpoint = action.endpoint as INewlyConnectedEndpointInfo;
      if (endpoint.user.admin || action.endpointType !== 'cf') {
        return endpoint.user.admin ? [new GetUserCfRelations(action.guid, GET_CURRENT_USER_CF_RELATIONS_SUCCESS)] : [];
      }

      // START fetching cf roles for current user
      this.store.dispatch(new GetUserCfRelations(action.guid, GET_CURRENT_USER_CF_RELATIONS));

      return combineLatest(this.fetchCfUserRoles({ guid: action.guid, userGuid: endpoint.user.guid })).pipe(
        // FINISH fetching cf roles for current user
        mergeMap(succeeds => [new GetUserCfRelations(
          action.guid,
          succeeds.every(succeeded => !!succeeded) ? GET_CURRENT_USER_CF_RELATIONS_SUCCESS : GET_CURRENT_USER_CF_RELATIONS_FAILED
        )]),
        catchError(err => {
          this.logService.warn('Failed to fetch current user permissions for a cf: ', err);
          return [new GetUserCfRelations(action.guid, GET_CURRENT_USER_CF_RELATIONS_FAILED)];
        })
      );
    })
  );

  private dispatchRoleRequests(endpoints: EndpointModel[]): CfsRequestState {
    const requests: CfsRequestState = {};

    // Per endpoint fetch feature flags and user roles (unless admin, where we don't need to), then mark endpoint as initialised
    endpoints.forEach(endpoint => {
      if (endpoint.user.admin) {
        // We don't need permissions for admin users (they can do everything)
        requests[endpoint.guid] = [observableOf(true)];
        this.store.dispatch(new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS_SUCCESS));
      } else {
        // START fetching cf roles for current user
        this.store.dispatch(new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS));

        // Dispatch feature flags fetch actions
        const ffAction = createCfFeatureFlagFetchAction(endpoint.guid);
        requests[endpoint.guid] = [createPaginationCompleteWatcher(this.store, ffAction)];
        this.store.dispatch(ffAction);

        // Dispatch requests to fetch roles per role type for current user
        requests[endpoint.guid].push(...this.fetchCfUserRoles({ guid: endpoint.guid, userGuid: endpoint.user.guid }));

        // FINISH fetching cf roles for current user
        combineLatest(requests[endpoint.guid]).pipe(
          first(),
          tap(succeeds => {
            this.store.dispatch(new GetUserCfRelations(
              endpoint.guid,
              succeeds.every(succeeded => !!succeeded) ? GET_CURRENT_USER_CF_RELATIONS_SUCCESS : GET_CURRENT_USER_CF_RELATIONS_FAILED)
            );
          }),
          catchError(err => {
            this.logService.warn('Failed to fetch current user permissions for a cf: ', err);
            this.store.dispatch(new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS_FAILED));
            return observableOf(err);
          })
        ).subscribe();
      }
    });
    return requests;
  }

  private handleCfRequests(requests: CfsRequestState): Observable<boolean>[] {
    const allCompleted: Observable<boolean>[] = [];
    Object.keys(requests).forEach(cfGuid => {
      const successes = requests[cfGuid];
      allCompleted.push(...successes);
    });
    return allCompleted;
  }

  fetchCfUserRoles(endpoint: IEndpointConnectionInfo): Observable<boolean>[] {
    return Object.values(UserRelationTypes).map((type: UserRelationTypes) => {
      const relAction = new GetUserRelations(endpoint.userGuid, type, endpoint.guid);
      return fetchCfUserRole(this.store, relAction, this.httpClient);
    });
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
    map(action => {
      return fetchCfUserRole(this.store, action, this.httpClient).pipe(
        map((success) => ({ type: action.actions[1] }))
      );
    })
  );
}
