import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { endpointsCfEntitiesConnectedSelector } from 'frontend/packages/store/src/selectors/endpoint.selectors';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import {
  catchError,
  first,
  map,
  mergeMap,
  pairwise,
  share,
  skipWhile,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { LoggerService } from '../../../../core/src/core/logger.service';
import { CONNECT_ENDPOINTS_SUCCESS, EndpointActionComplete } from '../../../../store/src/actions/endpoint.actions';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import {
  BaseHttpClientFetcher,
  flattenPagination,
  PaginationFlattener,
} from '../../../../store/src/helpers/paginated-request-helpers';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { selectPaginationState } from '../../../../store/src/selectors/pagination.selectors';
import { EndpointModel, INewlyConnectedEndpointInfo } from '../../../../store/src/types/endpoint.types';
import { BasePaginatedAction, PaginationEntityState } from '../../../../store/src/types/pagination.types';
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
} from '../../actions/permissions.actions';
import { CFAppState } from '../../cf-app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { CFResponse } from '../types/cf-api.types';

class PermissionFlattener extends BaseHttpClientFetcher<CFResponse> implements PaginationFlattener<CFResponse, CFResponse> {

  constructor(httpClient: HttpClient, public url, public requestOptions: { [key: string]: any }) {
    super(httpClient, url, requestOptions, 'page');
  }
  public getTotalPages = (res: CFResponse) => res.total_pages;

  public mergePages = (res: CFResponse[]) => {
    const firstRes = res.shift();
    const final = res.reduce((finalRes, currentRes) => {
      finalRes.resources = [
        ...finalRes.resources,
      ];
      return finalRes;
    }, firstRes);
    return final;
  }
  public getTotalResults = (res: CFResponse): number => res.total_results;
  public clearResults = (res: CFResponse) => observableOf(res);
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

function fetchCfUserRole(store: Store<CFAppState>, action: GetUserRelations, httpClient: HttpClient): Observable<boolean> {
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
  return flattenPagination(
    (flatAction: Action) => this.store.dispatch(flatAction),
    get$,
    new PermissionFlattener(httpClient, url, params)
  ).pipe(
    map(data => {
      store.dispatch(new GetCurrentUserRelationsComplete(action.relationType, action.endpointGuid, data.resources));
      return true;
    }),
    first(),
    catchError(err => observableOf(false)),
    share()
  );
}

const fetchPaginationStateFromAction = (store: Store<CFAppState>, action: BasePaginatedAction) => {
  const entityKey = entityCatalog.getEntityKey(action);
  return store.select(selectPaginationState(entityKey, action.paginationKey));
};

/**
 * Using the given action wait until the associated pagination section changes from busy to not busy
 */
const createPaginationCompleteWatcher = (store: Store<CFAppState>, action: BasePaginatedAction): Observable<boolean> =>
  fetchPaginationStateFromAction(store, action).pipe(
    map((paginationState: PaginationEntityState) => {
      const pageRequest: ActionState =
        paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
      return pageRequest ? pageRequest.busy : true;
    }),
    pairwise(),
    map(([oldFetching, newFetching]) => {
      return oldFetching === true && newFetching === false;
    }),
    skipWhile(completed => !completed),
    first(),
  );

@Injectable()
export class PermissionsEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<CFAppState>,
    private logService: LoggerService
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.pipe(
    ofType<GetCurrentUsersRelations>(GET_CURRENT_USER_RELATIONS),
    withLatestFrom(this.store.select(endpointsCfEntitiesConnectedSelector)),
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


  @Effect() getPermissionForNewlyConnectedEndpoint$ = this.actions$.pipe(
    ofType<EndpointActionComplete>(CONNECT_ENDPOINTS_SUCCESS),
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
        const ffAction = cfEntityCatalog.featureFlag.actions.getMultiple(endpoint.guid)
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
    private store: Store<CFAppState>
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.pipe(
    ofType<GetUserRelations>(GET_CURRENT_USER_RELATION),
    map(action => {
      return fetchCfUserRole(this.store, action, this.httpClient).pipe(
        map((success) => ({ type: action.actions[1] }))
      );
    })
  );
}
